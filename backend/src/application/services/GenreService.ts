import { GenreRepository } from "../../infrastructure/database/GenreRepository";
import { GenreSchema, Genre } from "../../domain/entities/Genre";
import { Result, Success, Failure } from "../../shared/utils/Result";

const DEFAULT_GENRES: Array<{ id: string; name: string; color: string }> = [
    { id: "vpop",   name: "V-Pop",      color: "bg-red-500" },
    { id: "pop",    name: "Pop",         color: "bg-blue-600" },
    { id: "kpop",   name: "K-Pop",       color: "bg-pink-500" },
    { id: "ballad", name: "Ballad",      color: "bg-orange-800" },
    { id: "rap",    name: "Rap/Hip-Hop", color: "bg-orange-500" },
    { id: "indie",  name: "Indie",       color: "bg-purple-600" },
    { id: "rnb",    name: "R&B",         color: "bg-indigo-600" },
    { id: "edm",    name: "EDM",         color: "bg-teal-500" },
];

export class GenreService {
    constructor(private readonly genreRepo: GenreRepository) {}

    async list(): Promise<Result<Genre[]>> {
        const result = await this.genreRepo.findAllSorted();
        if (!result.success) return result;
        return Success(result.data);
    }

    /** Seeds the 8 default genres if none exist. Idempotent. */
    async seed(): Promise<Result<void>> {
        const existing = await this.genreRepo.findAllSorted();
        if (!existing.success) return existing;
        if (existing.data.length > 0) return Success(undefined);

        const now = new Date().toISOString();
        for (const defaults of DEFAULT_GENRES) {
            const genre: Genre = {
                id: defaults.id,
                name: defaults.name,
                color: defaults.color,
                imageUrl: null,
                songCount: 0,
                createdAt: now,
                updatedAt: now,
            };
            const saveResult = await this.genreRepo.save(genre);
            if (!saveResult.success) return saveResult;
        }

        return Success(undefined);
    }

    async create(data: any, role: string): Promise<Result<Genre>> {
        if (role !== "admin") return Failure("Không có quyền thực hiện thao tác này", 403);

        const parsed = GenreSchema.omit({ createdAt: true, updatedAt: true }).safeParse(data);
        if (!parsed.success) return Failure(parsed.error.issues[0].message, 400);

        const existing = await this.genreRepo.findBySlug(parsed.data.id);
        if (!existing.success) return existing;
        if (existing.data !== null) return Failure("Thể loại đã tồn tại", 409);

        const now = new Date().toISOString();
        const genre: Genre = {
            ...parsed.data,
            songCount: parsed.data.songCount ?? 0,
            createdAt: now,
            updatedAt: now,
        };

        return this.genreRepo.save(genre);
    }

    async update(id: string, data: any, role: string): Promise<Result<Genre>> {
        if (role !== "admin") return Failure("Không có quyền thực hiện thao tác này", 403);

        const existing = await this.genreRepo.findBySlug(id);
        if (!existing.success) return existing;
        if (existing.data === null) return Failure("Thể loại không tồn tại", 404);

        const updateSchema = GenreSchema.pick({ name: true, color: true, imageUrl: true }).partial();
        const parsed = updateSchema.safeParse(data);
        if (!parsed.success) return Failure(parsed.error.issues[0].message, 400);
        if (Object.keys(parsed.data).length === 0) return Failure("Cần ít nhất một trường để cập nhật", 400);

        const merged: Genre = {
            ...existing.data,
            ...parsed.data,
            updatedAt: new Date().toISOString(),
        };

        return this.genreRepo.save(merged);
    }

    async delete(id: string, role: string): Promise<Result<void>> {
        if (role !== "admin") return Failure("Không có quyền thực hiện thao tác này", 403);

        const existing = await this.genreRepo.findBySlug(id);
        if (!existing.success) return existing;
        if (existing.data === null) return Failure("Thể loại không tồn tại", 404);

        if ((existing.data.songCount ?? 0) > 0) return Failure("Không thể xóa thể loại đang có bài hát", 409);

        return this.genreRepo.hardDelete(id);
    }
}
