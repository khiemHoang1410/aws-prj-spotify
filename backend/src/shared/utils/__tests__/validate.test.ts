import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validate, validateUUID, requireAtLeastOneField } from "../validate";

describe("validate", () => {
    const schema = z.object({ name: z.string().min(1), age: z.number().int().min(0) });

    it("trả về data khi hợp lệ", () => {
        const result = validate(schema, { name: "Test", age: 25 });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toEqual({ name: "Test", age: 25 });
    });

    it("trả về lỗi 400 khi không hợp lệ", () => {
        const result = validate(schema, { name: "", age: -1 }) as any;
        expect(result.success).toBe(false);
        expect(result.code).toBe(400);
    });

    it("trả về message lỗi từ schema", () => {
        const result = validate(schema, { name: "Test", age: -1 });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toBeTruthy();
    });
});

describe("validateUUID", () => {
    it("trả về UUID hợp lệ", () => {
        const result = validateUUID("019d19f9-1834-71fa-aeaf-e8c515a2c40c", "ID");
        expect(result.success).toBe(true);
    });

    it("trả về lỗi khi undefined", () => {
        const result = validateUUID(undefined, "artist ID") as any;
        expect(result.success).toBe(false);
        expect(result.code).toBe(400);
    });

    it("trả về lỗi khi không phải UUID", () => {
        const result = validateUUID("not-a-uuid", "artist ID") as any;
        expect(result.success).toBe(false);
        expect(result.code).toBe(400);
    });
});

describe("requireAtLeastOneField", () => {
    it("trả về fields khi có ít nhất 1 field", () => {
        const result = requireAtLeastOneField({ name: "Test", bio: undefined });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toEqual({ name: "Test" });
    });

    it("trả về lỗi khi tất cả fields đều undefined", () => {
        const result = requireAtLeastOneField({ name: undefined, bio: undefined }) as any;
        expect(result.success).toBe(false);
        expect(result.code).toBe(400);
    });

    it("strip undefined fields", () => {
        const result = requireAtLeastOneField({ name: "Test", bio: undefined, age: 25 });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual({ name: "Test", age: 25 });
            expect(result.data.bio).toBeUndefined();
        }
    });
});
