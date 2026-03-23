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

// GET /admin/artist-requests - lấy danh sách pending
export const listHandler = makeAuthHandler(async () => {
    return await artistRequestService.getPendingRequests();
}, "admin");

// POST /admin/artist-requests/{id}/approve
export const approveHandler = makeAuthHandler(async (body, params) => {
    return await artistRequestService.approveRequest(params.id, body.adminNote);
}, "admin");

// POST /admin/artist-requests/{id}/reject
export const rejectHandler = makeAuthHandler(async (body, params) => {
    return await artistRequestService.rejectRequest(params.id, body.adminNote || "Không đáp ứng yêu cầu");
}, "admin");
