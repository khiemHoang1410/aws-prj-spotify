import { CategoryRepository } from "../../infrastructure/database/CategoryRepository";
import { CategorySchema, Category } from "../../domain/entities/Category";
import { Result, Success, Failure } from "../../shared/utils/Result";

const DEFAULT_CATEGORIES: Array<{ id: string; name: string; color: string }> = [
    { id: "vpop",   name: "V-Pop",      color: "bg-red-500" },
    { id: "pop",    name: "Pop",         color: "bg-blue-600" },
    { id: "kpop",   name: "K-Pop",       color: "bg-pink-500" },
    { id: "ballad", name: "Ballad",      color: "bg-orange-800" },
    { id: "rap",    name: "Rap/Hip-Hop", color: "bg-orange-500" },
    { id: "indie",  name: "Indie",       color: "bg-purple-600" },
    { id: "rnb",    name: "R&B",         color: "bg-indigo-600" },
    { id: "edm",    name: "EDM",         color: "bg-teal-500" },
];

export class CategoryService {
    constructor(private readonly categoryRepo: CategoryRepository) {}

    /**
     * Returns all active categories sorted by name ascending, with songCount.
     * Requirements: 3.2, 3.5
     */
    async list(): Promise<Result<Category[]>> {
        const result = await this.categoryRepo.findAllSorted();
        if (!result.success) return result;
        return Success(result.data);
    }

    /**
     * Seeds the 8 default categories if none exist. Idempotent.
     * Requirements: 3.3, 3.4
     */
    async seed(): Promise<Result<void>> {
        const existing = await this.categoryRepo.findAllSorted();
        if (!existing.success) return existing;

        // Already seeded — nothing to do
        if (existing.data.length > 0) return Success(undefined);

        const now = new Date().toISOString();
        for (const defaults of DEFAULT_CATEGORIES) {
            const category: Category = {
                id: defaults.id,
                name: defaults.name,
                color: defaults.color,
                imageUrl: null,
                songCount: 0,
                createdAt: now,
                updatedAt: now,
            };
            const saveResult = await this.categoryRepo.save(category);
            if (!saveResult.success) return saveResult;
        }

        return Success(undefined);
    }

    /**
     * Creates a new category. Requires admin role.
     * Requirements: 7.2, 7.3, 7.7
     */
    async create(data: any, role: string): Promise<Result<Category>> {
        if (role !== "admin") {
            return Failure("Không có quyền thực hiện thao tác này", 403);
        }

        const parsed = CategorySchema.omit({ createdAt: true, updatedAt: true }).safeParse(data);
        if (!parsed.success) {
            return Failure(parsed.error.issues[0].message, 400);
        }

        // Check slug uniqueness
        const existing = await this.categoryRepo.findBySlug(parsed.data.id);
        if (!existing.success) return existing;
        if (existing.data !== null) {
            return Failure("Thể loại đã tồn tại", 409);
        }

        const now = new Date().toISOString();
        const category: Category = {
            ...parsed.data,
            songCount: parsed.data.songCount ?? 0,
            createdAt: now,
            updatedAt: now,
        };

        return this.categoryRepo.save(category);
    }

    /**
     * Updates an existing category. Requires admin role.
     * Requirements: 7.4, 7.7
     */
    async update(id: string, data: any, role: string): Promise<Result<Category>> {
        if (role !== "admin") {
            return Failure("Không có quyền thực hiện thao tác này", 403);
        }

        const existing = await this.categoryRepo.findBySlug(id);
        if (!existing.success) return existing;
        if (existing.data === null) {
            return Failure("Thể loại không tồn tại", 404);
        }

        // Validate partial update fields
        const updateSchema = CategorySchema
            .pick({ name: true, color: true, imageUrl: true })
            .partial();
        const parsed = updateSchema.safeParse(data);
        if (!parsed.success) {
            return Failure(parsed.error.issues[0].message, 400);
        }
        if (Object.keys(parsed.data).length === 0) {
            return Failure("Cần ít nhất một trường để cập nhật", 400);
        }

        const merged: Category = {
            ...existing.data,
            ...parsed.data,
            updatedAt: new Date().toISOString(),
        };

        return this.categoryRepo.save(merged);
    }

    /**
     * Deletes a category. Requires admin role and songCount === 0.
     * Requirements: 7.5, 7.6, 7.7
     */
    async delete(id: string, role: string): Promise<Result<void>> {
        if (role !== "admin") {
            return Failure("Không có quyền thực hiện thao tác này", 403);
        }

        const existing = await this.categoryRepo.findBySlug(id);
        if (!existing.success) return existing;
        if (existing.data === null) {
            return Failure("Thể loại không tồn tại", 404);
        }

        if ((existing.data.songCount ?? 0) > 0) {
            return Failure("Không thể xóa thể loại đang có bài hát", 409);
        }

        return this.categoryRepo.hardDelete(id);
    }
}
