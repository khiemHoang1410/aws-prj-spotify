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
            { name: "Auth", description: "Xác thực người dùng" },
            { name: "Artists", description: "Quản lý nghệ sĩ" },
            { name: "Albums", description: "Quản lý album" },
            { name: "Songs", description: "Quản lý bài hát" },
            { name: "Playlists", description: "Quản lý playlist" },
            { name: "Admin", description: "Quản trị viên" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
            },
            schemas: {
                Artist: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string" },
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
                Album: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        artistId: { type: "string", format: "uuid" },
                        coverUrl: { type: "string", format: "uri", nullable: true },
                        releaseDate: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                Playlist: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        coverUrl: { type: "string", format: "uri", nullable: true },
                        isPublic: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                ArtistRequest: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string" },
                        stageName: { type: "string" },
                        bio: { type: "string", nullable: true },
                        photoUrl: { type: "string", format: "uri", nullable: true },
                        status: { type: "string", enum: ["pending", "approved", "rejected"] },
                        adminNote: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                Error: {
                    type: "object",
                    properties: { error: { type: "string" } },
                },
            },
        },
        paths: {
            // ─── SYSTEM ───────────────────────────────────────────
            "/health": {
                get: {
                    tags: ["System"], summary: "Health check",
                    responses: { "200": { description: "OK", content: { "application/json": { example: { status: "OK", timestamp: "2024-01-01T00:00:00.000Z" } } } } },
                },
            },

            // ─── AUTH ─────────────────────────────────────────────
            "/auth/register": {
                post: {
                    tags: ["Auth"], summary: "Đăng ký tài khoản",
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password", "displayName"], properties: { email: { type: "string", format: "email", example: "user@example.com" }, password: { type: "string", example: "Password123" }, displayName: { type: "string", example: "Nguyễn Văn A" } } } } } },
                    responses: { "200": { description: "Đăng ký thành công, kiểm tra email để xác nhận" }, "409": { description: "Email đã tồn tại" } },
                },
            },
            "/auth/confirm": {
                post: {
                    tags: ["Auth"], summary: "Xác nhận email",
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "code"], properties: { email: { type: "string", format: "email" }, code: { type: "string", example: "123456" } } } } } },
                    responses: { "200": { description: "Xác nhận thành công" }, "400": { description: "Mã không đúng hoặc hết hạn" } },
                },
            },
            "/auth/login": {
                post: {
                    tags: ["Auth"], summary: "Đăng nhập",
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string" } } } } } },
                    responses: {
                        "200": { description: "Đăng nhập thành công", content: { "application/json": { schema: { type: "object", properties: { accessToken: { type: "string" }, idToken: { type: "string" }, refreshToken: { type: "string" } } } } } },
                        "401": { description: "Sai email hoặc mật khẩu" },
                    },
                },
            },
            "/me": {
                get: {
                    tags: ["Auth"], summary: "Lấy thông tin user hiện tại",
                    security: [{ bearerAuth: [] }],
                    responses: { "200": { description: "Thông tin user", content: { "application/json": { schema: { type: "object", properties: { userId: { type: "string" }, email: { type: "string" }, role: { type: "string", enum: ["listener", "artist", "admin"] } } } } } } },
                },
            },
            "/me/artist-request": {
                post: {
                    tags: ["Auth"], summary: "Gửi request trở thành nghệ sĩ",
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["stageName"], properties: { stageName: { type: "string", example: "Sơn Tùng MTP" }, bio: { type: "string", nullable: true }, photoUrl: { type: "string", format: "uri", nullable: true } } } } } },
                    responses: { "200": { description: "Gửi request thành công" }, "409": { description: "Đã có request pending hoặc đã là nghệ sĩ" } },
                },
            },

            // ─── ARTISTS ──────────────────────────────────────────
            "/artists": {
                post: {
                    tags: ["Artists"], summary: "Tạo nghệ sĩ mới (admin)",
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name", "userId"], properties: { userId: { type: "string" }, name: { type: "string", example: "Sơn Tùng MTP" }, bio: { type: "string", nullable: true }, photoUrl: { type: "string", format: "uri", nullable: true }, backgroundUrl: { type: "string", format: "uri", nullable: true } } } } } },
                    responses: { "200": { description: "Tạo thành công", content: { "application/json": { schema: { "$ref": "#/components/schemas/Artist" } } } } },
                },
                get: {
                    tags: ["Artists"], summary: "Lấy danh sách nghệ sĩ",
                    responses: { "200": { description: "Danh sách nghệ sĩ", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Artist" } } } } } },
                },
            },
            "/artists/{id}": {
                get: {
                    tags: ["Artists"], summary: "Lấy thông tin nghệ sĩ",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "OK", content: { "application/json": { schema: { "$ref": "#/components/schemas/Artist" } } } }, "404": { description: "Không tìm thấy" } },
                },
                put: {
                    tags: ["Artists"], summary: "Cập nhật nghệ sĩ (artist/admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, bio: { type: "string" }, photoUrl: { type: "string", format: "uri" }, backgroundUrl: { type: "string", format: "uri" } } } } } },
                    responses: { "200": { description: "Cập nhật thành công" }, "403": { description: "Không có quyền" }, "404": { description: "Không tìm thấy" } },
                },
                delete: {
                    tags: ["Artists"], summary: "Xóa nghệ sĩ (artist/admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "Xóa thành công" }, "403": { description: "Không có quyền" }, "404": { description: "Không tìm thấy" } },
                },
            },
            "/artists/{id}/songs": {
                get: {
                    tags: ["Artists"], summary: "Lấy bài hát của nghệ sĩ",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "Danh sách bài hát", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Song" } } } } } },
                },
            },

            // ─── ALBUMS ───────────────────────────────────────────
            "/albums": {
                post: {
                    tags: ["Albums"], summary: "Tạo album mới (artist/admin)",
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title", "artistId"], properties: { title: { type: "string", example: "Sky Tour" }, artistId: { type: "string", format: "uuid" }, coverUrl: { type: "string", format: "uri", nullable: true }, releaseDate: { type: "string", example: "2019-08-08", nullable: true } } } } } },
                    responses: { "200": { description: "Tạo thành công", content: { "application/json": { schema: { "$ref": "#/components/schemas/Album" } } } }, "404": { description: "Nghệ sĩ không tồn tại" } },
                },
                get: {
                    tags: ["Albums"], summary: "Lấy danh sách album",
                    responses: { "200": { description: "Danh sách album", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Album" } } } } } },
                },
            },
            "/albums/{id}": {
                get: {
                    tags: ["Albums"], summary: "Lấy thông tin album",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "OK", content: { "application/json": { schema: { "$ref": "#/components/schemas/Album" } } } }, "404": { description: "Không tìm thấy" } },
                },
                put: {
                    tags: ["Albums"], summary: "Cập nhật album (artist/admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, coverUrl: { type: "string", format: "uri" }, releaseDate: { type: "string" } } } } } },
                    responses: { "200": { description: "Cập nhật thành công" }, "403": { description: "Không có quyền" }, "404": { description: "Không tìm thấy" } },
                },
                delete: {
                    tags: ["Albums"], summary: "Xóa album (artist/admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "Xóa thành công" }, "403": { description: "Không có quyền" }, "404": { description: "Không tìm thấy" } },
                },
            },
            "/albums/{id}/songs": {
                get: {
                    tags: ["Albums"], summary: "Lấy bài hát trong album",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "Danh sách bài hát", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Song" } } } } } },
                },
            },

            // ─── SONGS ────────────────────────────────────────────
            "/songs/upload-url": {
                post: {
                    tags: ["Songs"], summary: "Lấy presigned URL upload nhạc (artist/admin)",
                    security: [{ bearerAuth: [] }],
                    responses: { "200": { description: "Presigned URL", content: { "application/json": { example: { uploadUrl: "https://s3.amazonaws.com/...", fileUrl: "https://bucket.s3.amazonaws.com/raw/uuid.mp3", fileId: "uuid", key: "raw/uuid.mp3" } } } } },
                },
            },
            "/songs": {
                post: {
                    tags: ["Songs"], summary: "Tạo bài hát mới (artist/admin)",
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title", "artistId", "duration", "fileUrl"], properties: { title: { type: "string", example: "Chúng Ta Của Tương Lai" }, artistId: { type: "string", format: "uuid" }, albumId: { type: "string", format: "uuid", nullable: true }, duration: { type: "integer", example: 240 }, fileUrl: { type: "string", format: "uri" }, coverUrl: { type: "string", format: "uri", nullable: true }, lyrics: { type: "string", nullable: true } } } } } },
                    responses: { "200": { description: "Tạo thành công", content: { "application/json": { schema: { "$ref": "#/components/schemas/Song" } } } }, "404": { description: "Nghệ sĩ không tồn tại" } },
                },
                get: {
                    tags: ["Songs"], summary: "Lấy danh sách bài hát",
                    responses: { "200": { description: "Danh sách bài hát", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Song" } } } } } },
                },
            },
            "/songs/{id}": {
                get: {
                    tags: ["Songs"], summary: "Lấy thông tin bài hát",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "OK", content: { "application/json": { schema: { "$ref": "#/components/schemas/Song" } } } }, "404": { description: "Không tìm thấy" } },
                },
                put: {
                    tags: ["Songs"], summary: "Cập nhật bài hát (artist/admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, duration: { type: "integer" }, coverUrl: { type: "string", format: "uri" }, lyrics: { type: "string" } } } } } },
                    responses: { "200": { description: "Cập nhật thành công" }, "404": { description: "Không tìm thấy" } },
                },
                delete: {
                    tags: ["Songs"], summary: "Xóa bài hát (artist/admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "Xóa thành công" }, "404": { description: "Không tìm thấy" } },
                },
            },

            // ─── PLAYLISTS ────────────────────────────────────────
            "/playlists": {
                post: {
                    tags: ["Playlists"], summary: "Tạo playlist mới",
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string", example: "Nhạc buổi sáng" }, description: { type: "string", nullable: true }, coverUrl: { type: "string", format: "uri", nullable: true }, isPublic: { type: "boolean", default: true } } } } } },
                    responses: { "200": { description: "Tạo thành công", content: { "application/json": { schema: { "$ref": "#/components/schemas/Playlist" } } } } },
                },
            },
            "/playlists/me": {
                get: {
                    tags: ["Playlists"], summary: "Lấy danh sách playlist của tôi",
                    security: [{ bearerAuth: [] }],
                    responses: { "200": { description: "Danh sách playlist", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Playlist" } } } } } },
                },
            },
            "/playlists/{id}": {
                get: {
                    tags: ["Playlists"], summary: "Lấy thông tin playlist",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "OK", content: { "application/json": { schema: { "$ref": "#/components/schemas/Playlist" } } } }, "404": { description: "Không tìm thấy" } },
                },
                delete: {
                    tags: ["Playlists"], summary: "Xóa playlist",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "Xóa thành công" }, "403": { description: "Không có quyền" } },
                },
            },
            "/playlists/{id}/songs": {
                get: {
                    tags: ["Playlists"], summary: "Lấy bài hát trong playlist",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { "200": { description: "Danh sách bài hát" } },
                },
                post: {
                    tags: ["Playlists"], summary: "Thêm bài hát vào playlist",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["songId"], properties: { songId: { type: "string", format: "uuid" } } } } } },
                    responses: { "200": { description: "Thêm thành công" }, "409": { description: "Bài hát đã có trong playlist" } },
                },
            },
            "/playlists/{id}/songs/{songId}": {
                delete: {
                    tags: ["Playlists"], summary: "Xóa bài hát khỏi playlist",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                        { name: "songId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                    ],
                    responses: { "200": { description: "Xóa thành công" }, "403": { description: "Không có quyền" } },
                },
            },

            // ─── ADMIN ────────────────────────────────────────────
            "/admin/artist-requests": {
                get: {
                    tags: ["Admin"], summary: "Lấy danh sách artist requests đang pending",
                    security: [{ bearerAuth: [] }],
                    responses: { "200": { description: "Danh sách requests", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/ArtistRequest" } } } } } },
                },
            },
            "/admin/artist-requests/{id}/approve": {
                post: {
                    tags: ["Admin"], summary: "Approve artist request",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { adminNote: { type: "string", nullable: true } } } } } },
                    responses: { "200": { description: "Approved, Artist profile đã được tạo" }, "404": { description: "Request không tồn tại" } },
                },
            },
            "/admin/artist-requests/{id}/reject": {
                post: {
                    tags: ["Admin"], summary: "Reject artist request",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["adminNote"], properties: { adminNote: { type: "string", example: "Không đáp ứng yêu cầu" } } } } } },
                    responses: { "200": { description: "Rejected" }, "404": { description: "Request không tồn tại" } },
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
