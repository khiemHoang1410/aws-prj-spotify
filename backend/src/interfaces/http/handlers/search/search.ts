import { SearchService } from "../../../../application/services/SearchService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { Failure } from "../../../../shared/utils/Result";

const searchService = new SearchService(
    new SongRepository(),
    new ArtistRepository(),
    new AlbumRepository(),
);

export const handler = async (event: any) => {
    try {
        const q = event.queryStringParameters?.q || "";
        const type = event.queryStringParameters?.type; // "song" | "artist" | "album" | "all"

        const result = await searchService.search(q, type);

        if (result.success) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(result.data),
            };
        }

        return {
            statusCode: result.code ?? 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: result.error }),
        };
    } catch (error: any) {
        console.error("CRITICAL_ERROR:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Lỗi hệ thống rồi!" }),
        };
    }
};
