import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { validate } from "../../../../shared/utils/validate";

const reportRepo = new ReportRepository();

const BulkResolveSchema = z.object({
    ids: z.array(z.string()).min(1).max(100),
});

// POST /admin/reports/bulk-resolve
export const handler = makeAuthHandler(async (body) => {
    const v = validate(BulkResolveSchema, body);
    if (!v.success) return v;

    const results = await Promise.allSettled(
        v.data.ids.map((id) => reportRepo.resolve(id))
    );

    const summary = results.map((r, i) => ({
        id: v.data.ids[i],
        success: r.status === "fulfilled" && (r.value as any).success,
        error: r.status === "rejected" ? r.reason?.message : undefined,
    }));

    const succeeded = summary.filter((s) => s.success).length;
    const failed = summary.length - succeeded;

    return {
        success: true,
        data: { results: summary, succeeded, failed },
    } as any;
}, "admin");
