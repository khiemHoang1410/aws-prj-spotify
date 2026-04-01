import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { validate } from "../../../../shared/utils/validate";
import { Success } from "../../../../shared/utils/Result";

const songRepo = new SongRepository();

const BulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(100),
});

// POST /admin/songs/bulk-delete
export const handler = makeAuthHandler(async (body) => {
    const v = validate(BulkDeleteSchema, body);
    if (!v.success) return v;

    const results = await Promise.allSettled(
        v.data.ids.map((id) => songRepo.delete(id))
    );

    const summary = results.map((r, i) => ({
        id: v.data.ids[i],
        success: r.status === "fulfilled" && (r.value as any).success,
        error: r.status === "rejected" ? r.reason?.message : undefined,
    }));

    const succeeded = summary.filter((s) => s.success).length;
    const failed = summary.length - succeeded;

    const statusCode = failed === 0 ? 200 : succeeded === 0 ? 400 : 207;
    return {
        success: true,
        data: { results: summary, succeeded, failed },
        ...(statusCode !== 200 ? { code: statusCode } : {}),
    } as any;
}, "admin");
