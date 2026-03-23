export const handler = async () => {
    const spec = {
        openapi: "3.0.0",
        info: {
            title: "Spotify Clone API",
            version: "1.0.0",
            description: "API cho dự án Spotify Clone - AWS Serverless",
        },
        tags: [
            { name: "System", description: "Hệ thống" },
            { name: "Artists", description: "Quản lý nghệ sĩ" },
            { name: "Songs", description: "Quản lý bài hát" },
        ],
        paths: {
            "/health": {
                get: {
                    tags: ["System"],
                    summary: "Health check",
                    responses: {
                        "200": {
                            description: "Hệ thống hoạt động bình thường",
                            content: {
                                "application/json": {
                                    example: {
                                        status: "OK",
                                        message: "Hệ thống Spotify vẫn đang chạy vèo vèo!",
                                        timestamp: "2024-01-01T00:00:00.000Z",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            "/artists": {
                post: {
                    tags: ["Artists"],
                    summary: "Tạo nghệ sĩ mới",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["name"],
                                    properties: {
                                        name: { type: "string", example: "Sơn Tùng MTP" },
                                        bio: { type: "string", example: "Ca sĩ, nhạc sĩ người Việt Nam" },
                                        photoUrl: { type: "string", format: "uri", example: "https://example.com/photo.jpg" },
                                        backgroundUrl: { type: "string", format: "uri", example: "https://example.com/bg.jpg" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        "200": { description: "Tạo thành công", content: { "application/json": { schema: { "$ref": "#/components/schemas/Artist" } } } },
                        "400": { description: "Dữ liệu không hợp lệ" },
                    },
                },
                get: {
                    tags: ["Artists"],
                    summary: "Lấy danh sách tất cả nghệ sĩ",
                    responses: {
                        "200": {
                            description: "Danh sách nghệ sĩ",
                            content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Artist" } } } },
                        },
                    },
                },
            },
            "/artists/{id}": {
                get: {
                    tags: ["Artists"],
                    summary: "Lấy thông tin nghệ sĩ theo ID",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: {
                        "200": { description: "Thông tin nghệ sĩ", content: { "application/json": { schema: { "$ref": "#/components/schemas/Artist" } } } },
                        "404": { description: "Không tìm thấy nghệ sĩ" },
                    },
                },
            },
            "/artists/{id}/songs": {
                get: {
                    tags: ["Artists"],
                    summary: "Lấy danh sách bài hát của nghệ sĩ",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: {
                        "200": {
                            description: "Danh sách bài hát",
                            content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Song" } } } },
                        },
                    },
                },
            },
            "/songs/upload-url": {
                post: {
                    tags: ["Songs"],
                    summary: "Lấy presigned URL để upload file nhạc lên S3",
                    responses: {
                        "200": {
                            description: "Presigned URL",
                            content: {
                                "application/json": {
                                    example: {
                                        message: "Link upload",
                                        uploadUrl: "https://s3.amazonaws.com/...",
                                        fileUrl: "https://bucket.s3.amazonaws.com/raw/uuid.mp3",
                                        fileId: "uuid",
                                        key: "raw/uuid.mp3",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            "/songs": {
                post: {
                    tags: ["Songs"],
                    summary: "Tạo bài hát mới",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["title", "artistId", "duration", "fileUrl"],
                                    properties: {
                                        title: { type: "string", example: "Chúng Ta Của Tương Lai" },
                                        artistId: { type: "string", format: "uuid", example: "01234567-89ab-cdef-0123-456789abcdef" },
                                        albumId: { type: "string", format: "uuid", nullable: true },
                                        duration: { type: "integer", example: 240, description: "Thời lượng tính bằng giây" },
                                        fileUrl: { type: "string", format: "uri", example: "https://bucket.s3.amazonaws.com/raw/uuid.mp3" },
                                        coverUrl: { type: "string", format: "uri", nullable: true },
                                        lyrics: { type: "string", nullable: true },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        "200": { description: "Tạo thành công", content: { "application/json": { schema: { "$ref": "#/components/schemas/Song" } } } },
                        "400": { description: "Dữ liệu không hợp lệ" },
                        "404": { description: "Nghệ sĩ không tồn tại" },
                    },
                },
                get: {
                    tags: ["Songs"],
                    summary: "Lấy danh sách tất cả bài hát",
                    responses: {
                        "200": {
                            description: "Danh sách bài hát",
                            content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Song" } } } },
                        },
                    },
                },
            },
            "/songs/{id}": {
                get: {
                    tags: ["Songs"],
                    summary: "Lấy thông tin bài hát theo ID",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: {
                        "200": { description: "Thông tin bài hát", content: { "application/json": { schema: { "$ref": "#/components/schemas/Song" } } } },
                        "404": { description: "Không tìm thấy bài hát" },
                    },
                },
            },
        },
        components: {
            schemas: {
                Artist: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        bio: { type: "string", nullable: true },
                        photoUrl: { type: "string", format: "uri", nullable: true },
                        backgroundUrl: { type: "string", format: "uri", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                Song: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        artistId: { type: "string", format: "uuid" },
                        albumId: { type: "string", format: "uuid", nullable: true },
                        duration: { type: "integer" },
                        fileUrl: { type: "string", format: "uri" },
                        coverUrl: { type: "string", format: "uri", nullable: true },
                        lyrics: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
            },
        },
    };

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(spec),
    };
};
