import { makeAuthHandler } from "../../middlewares/withAuth";
import { Failure, Success } from "../../../../shared/utils/Result";

// Play history chưa có DynamoDB table riêng — trả về empty list
// TODO: implement khi có PlayHistoryRepository
export const handler = makeAuthHandler(async (_body, params, auth) => {
    const { id } = params;
    if (!id) return Failure("Thiếu user ID", 400);

    // Chỉ cho phép xem history của chính mình hoặc admin
    if (auth.userId !== id && auth.role !== "admin") {
        return Failure("Forbidden", 403);
    }

    return Success({ items: [], nextCursor: undefined });
});
