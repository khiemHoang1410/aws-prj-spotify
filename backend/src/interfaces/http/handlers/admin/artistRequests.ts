import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRequestService } from "../../../../application/services/ArtistRequestService";
import { ArtistRequestRepository } from "../../../../infrastructure/database/ArtistRequestRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { validate, validateUUID } from "../../../../shared/utils/validate";

const artistRequestService = new ArtistRequestService(
    new ArtistRequestRepository(),
    new ArtistRepository(),
    new UserRepository(),
);

const AdminNoteSchema = z.object({
    adminNote: z.string().max(500).nullable().optional(),
});

const RejectSchema = z.object({
    adminNote: z.string().min(1, "Lý do từ chối không được để trống").max(500),
});

// GET /admin/artist-requests
export const listHandler = makeAuthHandler(async () => {
    return artistRequestService.getPendingRequests();
}, "admin");

// POST /admin/artist-requests/{id}/approve
export const approveHandler = makeAuthHandler(async (body, params) => {
    const idResult = validateUUID(params.id, "request ID");
    if (!idResult.success) return idResult;

    const v = validate(AdminNoteSchema, body);
    if (!v.success) return v;

    return artistRequestService.approveRequest(idResult.data, v.data.adminNote ?? undefined);
}, "admin");

// POST /admin/artist-requests/{id}/reject
export const rejectHandler = makeAuthHandler(async (body, params) => {
    const idResult = validateUUID(params.id, "request ID");
    if (!idResult.success) return idResult;

    const v = validate(RejectSchema, body);
    if (!v.success) return v;

    return artistRequestService.rejectRequest(idResult.data, v.data.adminNote);
}, "admin");
