import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validate, validateUUID } from "../../../../shared/utils/validate";
import { v7 as uuidv7 } from "uuid";

const reportRepo = new ReportRepository();
const songRepo = new SongRepository();

const ReportSchema = z.object({
    reason: z.string().min(1, "Lý do không được để trống").max(200),
    description: z.string().max(500).optional().nullable(),
});

// POST /songs/{id}/report
export const handler = makeAuthHandler(async (body, params, auth) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const songResult = await songRepo.findById(idResult.data);
    if (!songResult.success) return songResult;
    if (!songResult.data) return Failure("Bài hát không tồn tại", 404);

    const v = validate(ReportSchema, body);
    if (!v.success) return v;

    return reportRepo.save({
        id: uuidv7(),
        songId: idResult.data,
        userId: auth.userId,
        reason: v.data.reason,
        description: v.data.description ?? null,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
});
