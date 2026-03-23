import { makeAuthHandler } from "../../middlewares/withAuth";
import { Success } from "../../../../shared/utils/Result";

export const handler = makeAuthHandler(async (_body, _params, auth) => {
    return Success({
        userId: auth.userId,
        email: auth.email,
        role: auth.role,
    });
});
