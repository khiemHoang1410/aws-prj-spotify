import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { FollowRepository } from "../../../../infrastructure/database/FollowRepository";
import { Failure } from "../../../../shared/utils/Result";

const artistService = new ArtistService(new ArtistRepository(), new FollowRepository());

export const handler = makeHandler(async (_body: any, params: any) => {
    const { id } = params;
    if (!id) return Failure("Thiếu artist ID", 400);
    return await artistService.getArtistProfile(id);
});
