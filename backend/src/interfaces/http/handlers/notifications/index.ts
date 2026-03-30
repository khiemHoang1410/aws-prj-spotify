import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { NotificationRepository } from "../../../../infrastructure/database/NotificationRepository";
import { validate, validateUUID } from "../../../../shared/utils/validate";
import { Success } from "../../../../shared/utils/Result";
import { v7 as uuidv7 } from "uuid";

const notifRepo = new NotificationRepository();

const CreateSchema = z.object({
    type: z.string().min(1),
    message: z.string().min(1).max(500),
    artistName: z.string().optional().nullable(),
    songTitle: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
});

// GET /notifications
export const listHandler = makeAuthHandler(async (_body, _params, auth) => {
    const result = await notifRepo.findByUserId(auth.userId);
    if (!result.success) return result;
    // Map isRead → is_read for FE compatibility
    return Success(result.data.map((n) => ({ ...n, is_read: n.isRead })));
});

// POST /notifications
export const createHandler = makeAuthHandler(async (body, _params, auth) => {
    const v = validate(CreateSchema, body);
    if (!v.success) return v;

    return notifRepo.save({
        id: uuidv7(),
        userId: auth.userId,
        type: v.data.type,
        message: v.data.message,
        artistName: v.data.artistName ?? null,
        songTitle: v.data.songTitle ?? null,
        imageUrl: v.data.imageUrl ?? null,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
});

// PUT /notifications/{id}/read
export const markReadHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "notification ID");
    if (!idResult.success) return idResult;
    return notifRepo.markRead(idResult.data);
});

// PUT /notifications/read-all
export const markAllReadHandler = makeAuthHandler(async (_body, _params, auth) => {
    return notifRepo.markAllRead(auth.userId);
});
