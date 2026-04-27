import { makeHandler } from "../../middlewares/makeHandler";
import { Success } from "../../../../shared/utils/Result";

export const handler = makeHandler(async () => {
    return Success({
        status: "OK",
        message: "Hệ thống Spotify vẫn đang chạy vèo vèo!",
        timestamp: new Date().toISOString()
    });
});
