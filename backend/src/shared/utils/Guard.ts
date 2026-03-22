export class Guard {
    // Check tồn tại và trả về giá trị (thường dùng cho FindById)
    static exists<T>(value: T | null | undefined, message: string): T {
        if (value === null || value === undefined) {
            throw new Error(message); // Sau này thay bằng NotFoundError
        }
        return value;
    }

    // Check chuỗi rỗng và trả về chuỗi đã trim
    static againstEmpty(value: string | null | undefined, message: string): string {
        if (!value || value.trim().length === 0) {
            throw new Error(message);
        }
        return value.trim();
    }

    // Check logic nghiệp vụ
    static ensure(condition: boolean, message: string): void {
        if (!condition) {
            throw new Error(message);
        }
    }

    // Check UUID nhanh (nếu không muốn dùng Zod ở mọi nơi)
    static isUUID(id: string, message: string): void {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            throw new Error(message);
        }
    }
}
