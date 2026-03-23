import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRequestService } from "../../../../application/services/ArtistRequestService";
import { ArtistRequestRepository } from "../../../../infrastructure/database/ArtistRequestRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";

const artistRequestService = new ArtistRequestService(
    new ArtistRequestRepository(),
    new ArtistRepository(),
    new UserRepository(),
);

export const handler = makeAuthHandler(async (body, _params, auth) => {
    return await artistRequestService.submitRequest(auth.userId, body);
});
