import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { Failure } from "../../../../shared/utils/Result";

const artistService = new ArtistService(new ArtistRepository());

export const handler = makeHandler(async (_body: any, params: any) => {
    const { id } = params;
    if (!id) return Failure("Thiếu artist ID", 400);

    const result = await artistService.getArtist(id);
    if (result.success && !result.data) return Failure("Nghệ sĩ không tồn tại", 404);
    return result;
});
