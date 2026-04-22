import { makeHandler } from "../../middlewares/makeHandler";
import { Success } from "../../../../shared/utils/Result";
import { CategoryService } from "../../../../application/services/CategoryService";
import { CategoryRepository } from "../../../../infrastructure/database/CategoryRepository";

const DEFAULT_CATEGORIES = [
    { id: "vpop",   name: "V-Pop",       color: "bg-red-500" },
    { id: "pop",    name: "Pop",          color: "bg-blue-600" },
    { id: "kpop",   name: "K-Pop",        color: "bg-pink-500" },
    { id: "ballad", name: "Ballad",       color: "bg-orange-800" },
    { id: "rap",    name: "Rap/Hip-Hop",  color: "bg-orange-500" },
    { id: "indie",  name: "Indie",        color: "bg-purple-600" },
    { id: "rnb",    name: "R&B",          color: "bg-indigo-600" },
    { id: "edm",    name: "EDM",          color: "bg-teal-500" },
];

const service = new CategoryService(new CategoryRepository());

export const handler = makeHandler(async () => {
    // Seed defaults on first deploy (idempotent — no-op if already seeded)
    await service.seed();

    const result = await service.list();

    // Fall back to hardcoded defaults if DB returns empty or errors
    if (!result.success || result.data.length === 0) {
        return Success(DEFAULT_CATEGORIES);
    }

    return Success(result.data);
});
