import { z, ZodSchema } from "zod";
import { Result, Failure } from "./Result";

/**
 * Validate data với Zod schema, trả về Result pattern
 */
export const validate = <T>(schema: ZodSchema<T>, data: unknown): Result<T> => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const msg = result.error.issues.map(i => i.message).join(", ");
        return Failure(msg, 400);
    }
    return { success: true, data: result.data };
};

/**
 * Validate UUID format cho path params
 */
export const validateUUID = (value: string | undefined, fieldName: string): Result<string> => {
    if (!value) return Failure(`Thiếu ${fieldName}`, 400);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) return Failure(`${fieldName} không đúng định dạng UUID`, 400);
    return { success: true, data: value };
};

// Schemas dùng chung cho update (tất cả fields optional, nhưng ít nhất 1 field)
export const requireAtLeastOneField = (fields: Record<string, any>): Result<Record<string, any>> => {
    const defined = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(defined).length === 0) {
        return Failure("Cần ít nhất một trường để cập nhật", 400);
    }
    return { success: true, data: defined };
};
