import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";

const artistService = new ArtistService(new ArtistRepository());

export const handler = makeAuthHandler(async (body, _params, auth) => {
    return await artistService.createArtist(body, auth.userId);
});