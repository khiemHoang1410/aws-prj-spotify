/**
 * One-time setup Lambda: tạo OpenSearch indices + bulk index data từ DynamoDB
 * Invoke thủ công 1 lần: aws lambda invoke --function-name <name> /dev/null
 * v4 - vi_search analyzer với asciifolding + edge_ngram để support gõ tắt không dấu
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { getOpenSearchClient, INDICES } from "./opensearchClient";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Custom analyzer: asciifolding bỏ dấu + ngram để match substring gõ tắt
// "Son Tung" (sau bỏ dấu) → ngram(3): "son","on ","n t","tun","ung"
// Query "spontung" → ngram(3): "spo","pon","ont","ntu","tun","ung" → match "tun","ung" → hit!
const VI_SETTINGS = {
    "index.max_ngram_diff": 10,
    analysis: {
        filter: {
            vi_ngram: {
                type: "ngram",
                min_gram: 3,
                max_gram: 10,
            },
        },
        analyzer: {
            vi_index: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "asciifolding", "vi_ngram"],
            },
            vi_search: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "asciifolding", "vi_ngram"],
            },
        },
    },
};

const SONG_MAPPING = {
    settings: VI_SETTINGS,
    mappings: {
        properties: {
            id:         { type: "keyword" },
            title: {
                type: "text",
                analyzer: "vi_index",
                search_analyzer: "vi_search",
                fields: { keyword: { type: "keyword" } },
            },
            artistId:   { type: "keyword" },
            artistName: {
                type: "text",
                analyzer: "vi_index",
                search_analyzer: "vi_search",
            },
            coverUrl:   { type: "keyword", index: false },
            fileUrl:    { type: "keyword", index: false },
            duration:   { type: "integer" },
            playCount:  { type: "long" },
            genres:     { type: "keyword" },
            genre:      { type: "keyword" },
            albumId:    { type: "keyword" },
            createdAt:  { type: "date" },
            deletedAt:  { type: "date" },
        },
    },
};

const ARTIST_MAPPING = {
    settings: VI_SETTINGS,
    mappings: {
        properties: {
            id:   { type: "keyword" },
            name: {
                type: "text",
                analyzer: "vi_index",
                search_analyzer: "vi_search",
                fields: { keyword: { type: "keyword" } },
            },
            bio: {
                type: "text",
                analyzer: "vi_index",
                search_analyzer: "vi_search",
            },
            photoUrl:         { type: "keyword", index: false },
            backgroundUrl:    { type: "keyword", index: false },
            isVerified:       { type: "boolean" },
            followers:        { type: "long" },
            monthlyListeners: { type: "keyword" },
            userId:           { type: "keyword" },
            deletedAt:        { type: "date" },
        },
    },
};

const ALBUM_MAPPING = {
    settings: VI_SETTINGS,
    mappings: {
        properties: {
            id:    { type: "keyword" },
            title: {
                type: "text",
                analyzer: "vi_index",
                search_analyzer: "vi_search",
                fields: { keyword: { type: "keyword" } },
            },
            artistId:    { type: "keyword" },
            artistName:  {
                type: "text",
                analyzer: "vi_index",
                search_analyzer: "vi_search",
            },
            coverUrl:    { type: "keyword", index: false },
            releaseDate: { type: "date" },
            deletedAt:   { type: "date" },
        },
    },
};

async function fetchAll(entityType: string): Promise<any[]> {
    const TABLE = process.env.REAL_TABLE_NAME || Resource.SpotifyTable.name;
    const items: any[] = [];
    let lastKey: any;
    do {
        const res = await dynamo.send(new QueryCommand({
            TableName: TABLE,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": entityType, ":sk": "METADATA" },
            ExclusiveStartKey: lastKey,
        }));
        items.push(...(res.Items || []));
        lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return items;
}

export const handler = async (event: any) => {
    const endpoint = "https://vpc-spotify-domain-b56x73efwiu5vzn6lrj2qymr54.ap-southeast-1.es.amazonaws.com";
    process.env.OPENSEARCH_ENDPOINT = endpoint;

    const client = getOpenSearchClient();
    const log: string[] = [];

    // Step 0: Map Lambda roles vào all_access dùng SigV4 signed fetch
    try {
        const url = new URL(`${endpoint}/_plugins/_security/api/rolesmapping/all_access`);
        const body = JSON.stringify({
            backend_roles: [
                "arn:aws:iam::311464491329:role/spotify-backend-prod-OpenSearchSetupV2Role-xfbmczoc",
                "arn:aws:iam::311464491329:role/spotify-backend-prod-SearchIndexerRole-bcrfmtzo",
                "arn:aws:iam::311464491329:role/spotify-backend-prod-MyApiRouteMswwvfHandlerRole-xaemufxx",
                "arn:aws:iam::311464491329:role/spotify-backend-khiemhoang-MyApiRouteMswwvfHandlerRole-hnwdwrcf",
                "arn:aws:iam::311464491329:role/spotify-backend-khiemhoang-OpenSearchSetupV2Role-rzhubkok",
                "arn:aws:iam::311464491329:role/spotify-backend-khiemhoang-SearchIndexerRole-wnnvatrh",
            ],
        });

        const request = new HttpRequest({
            method: "PUT",
            hostname: url.hostname,
            path: url.pathname,
            headers: {
                "Content-Type": "application/json",
                "host": url.hostname,
            },
            body,
        });

        const credentials = await defaultProvider()();
        const signer = new SignatureV4({
            credentials,
            region: "ap-southeast-1",
            service: "es",
            sha256: Sha256,
        });

        const signed = await signer.sign(request);
        const res = await fetch(`${endpoint}${url.pathname}`, {
            method: signed.method,
            headers: signed.headers as Record<string, string>,
            body: signed.body,
        });
        const text = await res.text();
        log.push(`Role mapping (${res.status}): ${text}`);
    } catch (mapErr: any) {
        log.push(`Role mapping error: ${mapErr.message}`);
    }

    try {
        // 1. Xóa index cũ và tạo lại với mapping mới (có vi_search analyzer)
        for (const [index, mapping] of [
            [INDICES.SONGS,   SONG_MAPPING],
            [INDICES.ARTISTS, ARTIST_MAPPING],
            [INDICES.ALBUMS,  ALBUM_MAPPING],
        ] as [string, any][]) {
            const exists = await client.indices.exists({ index });
            if (exists.body) {
                await client.indices.delete({ index });
                log.push(`Deleted old index: ${index}`);
            }
            await client.indices.create({ index, body: mapping });
            log.push(`Created index: ${index}`);
        }

        // 2. Fetch data
        const [songs, artists, albums] = await Promise.all([
            fetchAll("SONG"),
            fetchAll("ARTIST"),
            fetchAll("ALBUM"),
        ]);
        log.push(`Fetched: ${songs.length} songs, ${artists.length} artists, ${albums.length} albums`);

        // 3. Bulk index
        for (const [index, docs] of [
            [INDICES.SONGS,   songs.filter((s) => !s.deletedAt && s.fileUrl)],
            [INDICES.ARTISTS, artists.filter((a) => !a.deletedAt)],
            [INDICES.ALBUMS,  albums.filter((a) => !a.deletedAt)],
        ] as [string, any[]][]) {
            if (docs.length === 0) { log.push(`No docs for ${index}`); continue; }
            const body = docs.flatMap((doc) => [
                { index: { _index: index, _id: doc.id } },
                doc,
            ]);
            const res = await client.bulk({ body, refresh: true });
            const errors = (res.body.items || []).filter((i: any) => i.index?.error);
            log.push(`Indexed ${docs.length - errors.length}/${docs.length} into "${index}"`);
        }

        return { statusCode: 200, body: JSON.stringify({ success: true, log }) };
    } catch (err: any) {
        const detail = {
            message: err.message,
            name: err.name,
            statusCode: err.statusCode ?? err.meta?.statusCode,
            body: err.meta?.body ?? err.body,
        };
        console.error("OpenSearch error:", JSON.stringify(detail));
        return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message, detail, log }) };
    }
};
