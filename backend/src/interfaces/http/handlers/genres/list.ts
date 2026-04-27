import { makeHandler } from "../../middlewares/makeHandler";
import { Success } from "../../../../shared/utils/Result";
import { GenreService } from "../../../../application/services/GenreService";
import { GenreRepository } from "../../../../infrastructure/database/GenreRepository";

const DEFAULT_GENRES = [
    { id: "vpop",   name: "V-Pop",       color: "bg-red-500" },
    { id: "pop",    name: "Pop",          color: "bg-blue-600" },
    { id: "kpop",   name: "K-Pop",        color: "bg-pink-500" },
    { id: "ballad", name: "Ballad",       color: "bg-orange-800" },
    { id: "rap",    name: "Rap/Hip-Hop",  color: "bg-orange-500" },
    { id: "indie",  name: "Indie",        color: "bg-purple-600" },
    { id: "rnb",    name: "R&B",          color: "bg-indigo-600" },
    { id: "edm",    name: "EDM",          color: "bg-teal-500" },
];

const service = new GenreService(new GenreRepository());

export const handler = makeHandler(async () => {
    await service.seed();
    const result = await service.list();
    if (!result.success || result.data.length === 0) return Success(DEFAULT_GENRES);
    return Success(result.data);
});
