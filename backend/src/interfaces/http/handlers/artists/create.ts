import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";

// Tiêm phụ thuộc (Dependency Injection)
const artistRepo = new ArtistRepository();
const artistService = new ArtistService(artistRepo);

// Logic cực kỳ đơn giản vì Service đã lo hết phần khó
export const handler = makeHandler(async (body: any) => {
    return await artistService.createArtist(body);
});