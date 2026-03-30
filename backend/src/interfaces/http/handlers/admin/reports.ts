import { makeAuthHandler } from "../../middlewares/withAuth";
import { Success } from "../../../../shared/utils/Result";

// Report system chưa có trong DB schema — trả empty list để FE không crash
// TODO: implement khi có Report entity + repository

export const listHandler = makeAuthHandler(async () => {
    return Success([]);
}, "admin");

export const resolveHandler = makeAuthHandler(async (_body, params) => {
    if (!params.id) return Success({ success: true });
    // TODO: update report status khi có Report entity
    return Success({ success: true });
}, "admin");
