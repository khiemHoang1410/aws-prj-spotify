import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ViewRepository } from "../../../../infrastructure/database/ViewRepository";
import { Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const songRepo = new SongRepository();
const viewRepo = new ViewRepository();

export const handler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const viewResult = await viewRepo.recordView(auth.userId, idResult.data);
    if (!viewResult.success) return viewResult;

    if (viewResult.data) {
        const incrementResult = await songRepo.incrementPlayCount(idResult.data);
        if (!incrementResult.success) return incrementResult;
    }

    return Success({ counted: viewResult.data });
}, "listener");
