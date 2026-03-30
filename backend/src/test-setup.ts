/**
 * Vitest global setup — mock SST Resource để test chạy được mà không cần sst dev
 */
import { vi } from "vitest";

vi.mock("sst", () => ({
    Resource: new Proxy({}, {
        get: (_target, prop) => {
            // Trả về object với các property thường dùng
            return new Proxy({}, {
                get: (_t, p) => {
                    if (p === "name") return `test-${String(prop)}`;
                    if (p === "id") return `test-id-${String(prop)}`;
                    return `test-${String(prop)}-${String(p)}`;
                },
            });
        },
    }),
}));
