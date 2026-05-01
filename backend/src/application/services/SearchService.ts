import { getOpenSearchClient, INDICES } from "../../infrastructure/search/opensearchClient";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../infrastructure/database/ArtistRepository";
import { AlbumRepository } from "../../infrastructure/database/AlbumRepository";
import { Result, Success, Failure } from "../../shared/utils/Result";
import { config } from "../../config";

export class SearchService {
    constructor(
        private readonly songRepo: SongRepository,
        private readonly artistRepo: ArtistRepository,
        private readonly albumRepo: AlbumRepository,
    ) {}

    async search(q: string, type?: string): Promise<Result<any>> {
        if (!q || q.trim().length === 0) return Failure("Từ khóa tìm kiếm không được để trống", 400);

        // Thử OpenSearch trước, fallback về DynamoDB scan nếu lỗi
        try {
            return await this.searchWithOpenSearch(q.trim(), type);
        } catch (err: any) {
            console.warn("OpenSearch unavailable, falling back to DynamoDB scan:", err.message);
            return await this.searchWithDynamoDB(q.trim(), type);
        }
    }

    // ── OpenSearch (primary) ──────────────────────────────────────────────────

    private async searchWithOpenSearch(q: string, type?: string): Promise<Result<any>> {
        const client = getOpenSearchClient();
        const size = config.searchMaxResults;
        const searchAll = !type || type === "all";
        const result: any = {};

        // Multi-match query với fuzzy + boost
        // analyzer: vi_search → asciifolding bỏ dấu trước khi match
        // kết hợp với edge_ngram ở index → "spontung" match "Sơn Tùng"
        const buildQuery = (fields: { name: string; boost: number }[]) => ({
            bool: {
                should: [
                    {
                        multi_match: {
                            query: q,
                            fields: fields.map((f) => `${f.name}^${f.boost}`),
                            type: "best_fields",
                            analyzer: "vi_search",   // bỏ dấu query trước khi match
                            fuzziness: "AUTO",
                            prefix_length: 1,
                            operator: "or",
                        },
                    },
                    {
                        multi_match: {
                            query: q,
                            fields: fields
                                .filter((f) => !["genres", "genre"].includes(f.name))
                                .map((f) => `${f.name}^${f.boost}`),
                            type: "phrase_prefix",
                            analyzer: "vi_search",
                        },
                    },
                ],
                minimum_should_match: 1,
                must_not: [
                    { exists: { field: "deletedAt" } },
                ],
            },
        });

        const promises: Promise<void>[] = [];

        if (searchAll || type === "song") {
            promises.push(
                client.search({
                    index: INDICES.SONGS,
                    body: {
                        size,
                        query: buildQuery([
                            { name: "title",      boost: 3 },  // title match quan trọng nhất
                            { name: "artistName", boost: 2 },
                            { name: "genres",     boost: 1 },
                        ]),
                        sort: [
                            { _score: "desc" },
                            { playCount: "desc" },  // tie-break bằng lượt nghe
                        ],
                    },
                }).then((res) => {
                    result.songs = res.body.hits.hits.map((h: any) => ({
                        ...h._source,
                        _score: h._score,
                    }));
                })
            );
        }

        if (searchAll || type === "artist") {
            promises.push(
                client.search({
                    index: INDICES.ARTISTS,
                    body: {
                        size,
                        query: buildQuery([
                            { name: "name", boost: 3 },
                            { name: "bio",  boost: 1 },
                        ]),
                        sort: [
                            { _score: "desc" },
                            { followers: "desc" },
                        ],
                    },
                }).then((res) => {
                    result.artists = res.body.hits.hits.map((h: any) => ({
                        ...h._source,
                        _score: h._score,
                    }));
                })
            );
        }

        if (searchAll || type === "album") {
            promises.push(
                client.search({
                    index: INDICES.ALBUMS,
                    body: {
                        size,
                        query: buildQuery([
                            { name: "title",      boost: 3 },
                            { name: "artistName", boost: 2 },
                        ]),
                        sort: [{ _score: "desc" }],
                    },
                }).then((res) => {
                    result.albums = res.body.hits.hits.map((h: any) => ({
                        ...h._source,
                        _score: h._score,
                    }));
                })
            );
        }

        await Promise.all(promises);

        // Nếu search "all" và có artist match → thêm bài hát của artist đó vào kết quả
        if (searchAll && result.artists?.length > 0) {
            const topArtistId = result.artists[0].id;
            const existingSongIds = new Set((result.songs || []).map((s: any) => s.id));

            const artistSongsRes = await client.search({
                index: INDICES.SONGS,
                body: {
                    size,
                    query: {
                        bool: {
                            must: [{ term: { artistId: topArtistId } }],
                            must_not: [{ exists: { field: "deletedAt" } }],
                        },
                    },
                    sort: [{ playCount: "desc" }],
                },
            });

            const artistSongs = artistSongsRes.body.hits.hits
                .map((h: any) => ({ ...h._source, _score: h._score }))
                .filter((s: any) => !existingSongIds.has(s.id));

            result.songs = [...(result.songs || []), ...artistSongs].slice(0, size);
        }

        return Success(result);
    }

    // ── DynamoDB fallback ─────────────────────────────────────────────────────

    private async searchWithDynamoDB(q: string, type?: string): Promise<Result<any>> {
        const norm = (s: string) =>
            (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        const matches = (text: string, kw: string): boolean => {
            if (!text || !kw) return false;
            const normText = norm(text);
            const normKw   = norm(kw);
            if (normText.includes(normKw)) return true;
            return normText.split(/\s+/).some((word) => word.startsWith(normKw));
        };

        const keyword = norm(q);
        const searchAll = !type || type === "all";
        const result: any = {};

        let matchedArtistIds: Set<string> = new Set();

        if (searchAll || type === "artist" || type === "song") {
            const artists = await this.artistRepo.findAll();
            if (!artists.success) return artists;
            const matchedArtists = artists.data.filter((a) => matches(a.name, keyword));
            matchedArtistIds = new Set(matchedArtists.map((a) => a.id));
            if (searchAll || type === "artist") {
                result.artists = matchedArtists.slice(0, config.searchMaxResults);
            }
        }

        if (searchAll || type === "song") {
            const songs = await this.songRepo.findAll();
            if (!songs.success) return songs;
            result.songs = songs.data
                .filter((s) =>
                    matches(s.title, keyword) ||
                    matches((s as any).artistName || "", keyword) ||
                    matchedArtistIds.has((s as any).artistId || "")
                )
                .slice(0, config.searchMaxResults);
        }

        if (searchAll || type === "album") {
            const albums = await this.albumRepo.findAll();
            if (!albums.success) return albums;
            result.albums = albums.data
                .filter((a) =>
                    matches(a.title, keyword) ||
                    matches((a as any).artistName || "", keyword) ||
                    matchedArtistIds.has((a as any).artistId || "")
                )
                .slice(0, config.searchMaxResults);
        }

        return Success(result);
    }
}
