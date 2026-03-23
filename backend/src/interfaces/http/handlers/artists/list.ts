import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";

const artistService = new ArtistService(new ArtistRepository());

export const handler = makeHandler(async () => {
    return await artistService.getAllArtists();
});
