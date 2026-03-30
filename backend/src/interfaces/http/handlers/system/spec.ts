const paginationParams = [
    { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 }, description: "Số lượng kết quả mỗi trang" },
    { name: "cursor", in: "query", schema: { type: "string" }, description: "Con trỏ phân trang (lấy từ nextCursor của response trước)" },
];

const paginatedResponse = (itemSchema: any) => ({
    type: "object",
    properties: {
        items: { type: "array", items: itemSchema },
        nextCursor: { type: "string", nullable: true, description: "Truyền vào cursor để lấy trang tiếp theo" },
    },
});

export const handler = async () => {
    const spec = {
        openapi: "3.0.0",
        info: { title: "Spotify Clone API", version: "1.1.0", description: "API cho dự án Spotify Clone - AWS Serverless" },
        tags: [
            { name: "System", description: "Hệ thống" },
            { name: "Auth", description: "Xác thực người dùng" },
            { name: "Media", description: "Upload file" },
            { name: "Artists", description: "Quản lý nghệ sĩ" },
            { name: "Albums", description: "Quản lý album" },
            { name: "Songs", description: "Quản lý bài hát" },
            { name: "Playlists", description: "Quản lý playlist" },
            { name: "Search", description: "Tìm kiếm" },
            { name: "Admin", description: "Quản trị viên" },
            { name: "Users", description: "Người dùng & lịch sử nghe" },
            { name: "Notifications", description: "Thông báo" },
        ],
        components: {
            securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
            schemas: {
                Artist: { type: "object", properties: { id: { type: "string", format: "uuid" }, userId: { type: "string" }, name: { type: "string" }, bio: { type: "string", nullable: true }, photoUrl: { type: "string", format: "uri", nullable: true }, backgroundUrl: { type: "string", format: "uri", nullable: true }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } } },
                Song: { type: "object", properties: { id: { type: "string", format: "uuid" }, title: { type: "string" }, artistId: { type: "string", format: "uuid" }, albumId: { type: "string", format: "uuid", nullable: true }, duration: { type: "integer" }, fileUrl: { type: "string", format: "uri" }, coverUrl: { type: "string", format: "uri", nullable: true }, lyrics: { type: "string", nullable: true }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } } },
                Album: { type: "object", properties: { id: { type: "string", format: "uuid" }, title: { type: "string" }, artistId: { type: "string", format: "uuid" }, coverUrl: { type: "string", format: "uri", nullable: true }, releaseDate: { type: "string", nullable: true }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } } },
                Playlist: { type: "object", properties: { id: { type: "string", format: "uuid" }, userId: { type: "string" }, name: { type: "string" }, description: { type: "string", nullable: true }, coverUrl: { type: "string", format: "uri", nullable: true }, isPublic: { type: "boolean" }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } } },
                ArtistRequest: { type: "object", properties: { id: { type: "string", format: "uuid" }, userId: { type: "string" }, stageName: { type: "string" }, bio: { type: "string", nullable: true }, photoUrl: { type: "string", format: "uri", nullable: true }, status: { type: "string", enum: ["pending", "approved", "rejected"] }, adminNote: { type: "string", nullable: true }, createdAt: { type: "string", format: "date-time" } } },
                User: { type: "object", properties: { id: { type: "string" }, email: { type: "string", format: "email" }, displayName: { type: "string" }, avatarUrl: { type: "string", format: "uri", nullable: true }, role: { type: "string", enum: ["listener", "artist", "admin"] }, artistId: { type: "string", format: "uuid", nullable: true }, createdAt: { type: "string", format: "date-time" } } },
                Error: { type: "object", properties: { error: { type: "string" } } },
            },
        },
        paths: {
            // ─── SYSTEM ───────────────────────────────────────────
            "/health": { get: { tags: ["System"], summary: "Health check", responses: { "200": { description: "OK" } } } },

            // ─── AUTH ─────────────────────────────────────────────
            "/auth/register": {
                post: {
                    tags: ["Auth"], summary: "Đăng ký tài khoản",
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password", "displayName"], properties: { email: { type: "string", format: "email" }, password: { type: "string", example: "Password123" }, displayName: { type: "string", example: "Nguyễn Văn A" } } } } } },
                    responses: { "200": { description: "Đăng ký thành công" }, "409": { description: "Email đã tồn tại" } },
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
                    responses: { "200": { description: "Đăng nhập thành công", content: { "application/json": { schema: { type: "object", properties: { accessToken: { type: "string" }, idToken: { type: "string" }, refreshToken: { type: "string" } } } } } }, "401": { description: "Sai email hoặc mật khẩu" } },
                },
            },
            "/auth/refresh": {
                post: {
                    tags: ["Auth"], summary: "Refresh access token",
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["refreshToken"], properties: { refreshToken: { type: "string" } } } } } },
                    responses: { "200": { description: "Token mới", content: { "application/json": { schema: { type: "object", properties: { accessToken: { type: "string" }, idToken: { type: "string" } } } } } }, "401": { description: "Refresh token hết hạn hoặc không hợp lệ" } },
                },
            },
            "/auth/logout": {
                post: {
                    tags: ["Auth"], summary: "Đăng xuất (revoke tất cả tokens)",
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["accessToken"], properties: { accessToken: { type: "string" } } } } } },
                    responses: { "200": { description: "Đăng xuất thành công" } },
                },
            },
            "/me": {
                get: {
                    tags: ["Users"], summary: "Lấy thông tin user hiện tại",
                    security: [{ bearerAuth: [] }],
                    responses: { "200": { description: "Thông tin user", content: { "application/json": { schema: { "$ref": "#/components/schemas/User" } } } } },
                },
                put: {
                    tags: ["Users"], summary: "Cập nhật thông tin cá nhân",
                    security: [{ bearerAuth: [] }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { displayName: { type: "string" }, avatarUrl: { type: "string", format: "uri", nullable: true } } } } } },
                    responses: { "200": { description: "Cập nhật thành công" } },
                },
            },
            "/me/artist-request": {
                get: {
                    tags: ["Users"], summary: "Lấy trạng thái artist request của user hiện tại",
                    security: [{ bearerAuth: [] }],
                    responses: { "200": { description: "OK", content: { "application/json": { schema: { "$ref": "#/components/schemas/ArtistRequest" }, nullable: true } } } },
                },
                post: {
                    tags: ["Users"], summary: "Gửi request trở thành nghệ sĩ",
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["stageName"], properties: { stageName: { type: "string", example: "Sơn Tùng MTP" }, bio: { type: "string", nullable: true }, photoUrl: { type: "string", format: "uri", nullable: true } } } } } },
                    responses: { "200": { description: "Gửi request thành công" }, "409": { description: "Đã có request pending hoặc đã là nghệ sĩ" } },
                },
            },

            // ─── PLAY HISTORY ─────────────────────────────────────
            "/users/{id}/play-history": {
                get: {
                    tags: ["Users"], summary: "Lấy lịch sử nghe của user",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "User ID" },
                        { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 100 }, description: "Số lượng kết quả" },
                        { name: "cursor", in: "query", schema: { type: "string" }, description: "Con trỏ phân trang" },
                    ],
                    responses: {
                        "200": { description: "OK", content: { "application/json": { schema: paginatedResponse({ type: "object", properties: { userId: { type: "string" }, songId: { type: "string", format: "uuid" }, playedAt: { type: "string", format: "date-time" } } }) } } },
                        "403": { description: "Không có quyền" },
                    },
                },
            },
            "/me/play-history": {
                post: {
                    tags: ["Users"], summary: "Ghi lại lượt nghe bài hát",
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["songId"], properties: { songId: { type: "string", format: "uuid" }, playedAt: { type: "string", format: "date-time", nullable: true } } } } } },
                    responses: { "200": { description: "Ghi thành công" } },
                },
                delete: {
                    tags: ["Users"], summary: "Xóa toàn bộ lịch sử nghe",
                    security: [{ bearerAuth: [] }],
                    responses: { "200": { description: "Đã xóa" } },
                },
            },

            // ─── MEDIA ────────────────────────────────────────────
            "/media/upload-image": {
                post: {
                    tags: ["Media"], summary: "Lấy presigned URL upload ảnh (login required)",
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["contentType"], properties: { contentType: { type: "string", enum: ["image/jpeg", "image/png", "image/webp"] } } } } } },
                    responses: { "200": { description: "Presigned URL", content: { "application/json": { example: { uploadUrl: "https://s3.amazonaws.com/...", fileUrl: "https://bucket.s3.amazonaws.com/images/uuid.jpg", fileId: "uuid", key: "images/uuid.jpg" } } } } },
                },
            },
            "/songs/upload-url": {
                post: {
                    tags: ["Media"], summary: "Lấy presigned URL upload nhạc (artist/admin)",
                    security: [{ bearerAuth: [] }],
                    responses: { "200": { description: "Presigned URL", content: { "application/json": { example: { uploadUrl: "https://s3.amazonaws.com/...", fileUrl: "https://bucket.s3.amazonaws.com/raw/uuid.mp3", fileId: "uuid", key: "raw/uuid.mp3" } } } } },
                },
            },

            // ─── SEARCH ───────────────────────────────────────────
            "/search": {
                get: {
                    tags: ["Search"], summary: "Tìm kiếm artist, album, bài hát",
                    parameters: [
                        { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Từ khóa tìm kiếm" },
                        { name: "type", in: "query", schema: { type: "string", enum: ["song", "artist", "album", "all"] }, description: "Loại kết quả (mặc định: all)" },
                    ],
                    responses: { "200": { description: "Kết quả tìm kiếm", content: { "application/json": { example: { songs: [], artists: [], albums: [] } } } } },
                },
            },

            // ─── ARTISTS ──────────────────────────────────────────
            "/artists": {
                get: { tags: ["Artists"], summary: "Lấy danh sách nghệ sĩ (có phân trang)", parameters: paginationParams, responses: { "200": { description: "OK", content: { "application/json": { schema: paginatedResponse({ "$ref": "#/components/schemas/Artist" }) } } } } },
                post: { tags: ["Artists"], summary: "Tạo nghệ sĩ mới (admin)", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, bio: { type: "string", nullable: true }, photoUrl: { type: "string", format: "uri", nullable: true }, backgroundUrl: { type: "string", format: "uri", nullable: true } } } } } }, responses: { "200": { description: "Tạo thành công" } } },
            },
            "/artists/{id}": {
                get: { tags: ["Artists"], summary: "Lấy thông tin nghệ sĩ", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK", content: { "application/json": { schema: { "$ref": "#/components/schemas/Artist" } } } }, "404": { description: "Không tìm thấy" } } },
                put: { tags: ["Artists"], summary: "Cập nhật nghệ sĩ", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, bio: { type: "string" }, photoUrl: { type: "string", format: "uri" }, backgroundUrl: { type: "string", format: "uri" } } } } } }, responses: { "200": { description: "OK" }, "404": { description: "Không tìm thấy" } } },
                delete: { tags: ["Artists"], summary: "Xóa nghệ sĩ", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" }, "404": { description: "Không tìm thấy" } } },
            },
            "/artists/{id}/songs": { get: { tags: ["Artists"], summary: "Lấy bài hát của nghệ sĩ", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Song" } } } } } } } },
            "/artists/{id}/albums": { get: { tags: ["Artists"], summary: "Lấy albums của nghệ sĩ", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Album" } } } } } } } },
            "/artists/{id}/stats": { get: { tags: ["Artists"], summary: "Lấy thống kê nghệ sĩ", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK", content: { "application/json": { example: { totalSongs: 10, totalPlays: 5000, followers: 200, monthlyListeners: 1500 } } } }, "404": { description: "Không tìm thấy" } } } },
            "/artists/{id}/follow": { post: { tags: ["Artists"], summary: "Follow/unfollow nghệ sĩ (toggle)", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK", content: { "application/json": { example: { following: true, message: "Đã theo dõi" } } } }, "404": { description: "Không tìm thấy" } } } },
            "/artists/followed": { get: { tags: ["Artists"], summary: "Lấy danh sách nghệ sĩ đang follow", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Artist" } } } } } } } },
            "/albums": {
                get: { tags: ["Albums"], summary: "Lấy danh sách album (có phân trang)", parameters: paginationParams, responses: { "200": { description: "OK", content: { "application/json": { schema: paginatedResponse({ "$ref": "#/components/schemas/Album" }) } } } } },
                post: { tags: ["Albums"], summary: "Tạo album mới (artist/admin)", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title", "artistId"], properties: { title: { type: "string" }, artistId: { type: "string", format: "uuid" }, coverUrl: { type: "string", format: "uri", nullable: true }, releaseDate: { type: "string", nullable: true } } } } } }, responses: { "200": { description: "Tạo thành công" }, "404": { description: "Nghệ sĩ không tồn tại" } } },
            },
            "/albums/{id}": {
                get: { tags: ["Albums"], summary: "Lấy thông tin album", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK", content: { "application/json": { schema: { "$ref": "#/components/schemas/Album" } } } }, "404": { description: "Không tìm thấy" } } },
                put: { tags: ["Albums"], summary: "Cập nhật album", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, coverUrl: { type: "string", format: "uri" }, releaseDate: { type: "string" } } } } } }, responses: { "200": { description: "OK" }, "404": { description: "Không tìm thấy" } } },
                delete: { tags: ["Albums"], summary: "Xóa album", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" }, "404": { description: "Không tìm thấy" } } },
            },
            "/albums/{id}/songs": {
                get: { tags: ["Albums"], summary: "Lấy bài hát trong album", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Song" } } } } } } },
                post: { tags: ["Albums"], summary: "Thêm bài hát vào album (artist/admin)", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["song_id"], properties: { song_id: { type: "string", format: "uuid" } } } } } }, responses: { "200": { description: "OK" }, "404": { description: "Album hoặc bài hát không tồn tại" } } },
            },
            "/albums/{id}/songs/{songId}": { delete: { tags: ["Albums"], summary: "Xóa bài hát khỏi album", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }, { name: "songId", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" }, "400": { description: "Bài hát không thuộc album này" } } } },

            // ─── SONGS ────────────────────────────────────────────
            "/songs": {
                get: { tags: ["Songs"], summary: "Lấy danh sách bài hát (có phân trang)", parameters: paginationParams, responses: { "200": { description: "OK", content: { "application/json": { schema: paginatedResponse({ "$ref": "#/components/schemas/Song" }) } } } } },
                post: { tags: ["Songs"], summary: "Tạo bài hát mới (artist/admin)", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title", "artistId", "duration", "fileUrl"], properties: { title: { type: "string" }, artistId: { type: "string", format: "uuid" }, albumId: { type: "string", format: "uuid", nullable: true }, duration: { type: "integer" }, fileUrl: { type: "string", format: "uri" }, coverUrl: { type: "string", format: "uri", nullable: true }, lyrics: { type: "string", nullable: true } } } } } }, responses: { "200": { description: "Tạo thành công" }, "404": { description: "Nghệ sĩ không tồn tại" } } },
            },
            "/songs/{id}": {
                get: { tags: ["Songs"], summary: "Lấy thông tin bài hát", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK", content: { "application/json": { schema: { "$ref": "#/components/schemas/Song" } } } }, "404": { description: "Không tìm thấy" } } },
                put: { tags: ["Songs"], summary: "Cập nhật bài hát", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, duration: { type: "integer" }, coverUrl: { type: "string", format: "uri" }, lyrics: { type: "string" } } } } } }, responses: { "200": { description: "OK" }, "404": { description: "Không tìm thấy" } } },
                delete: { tags: ["Songs"], summary: "Xóa bài hát", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" }, "404": { description: "Không tìm thấy" } } },
            },
            "/songs/{id}/lyrics": { get: { tags: ["Songs"], summary: "Lấy lời bài hát", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK", content: { "application/json": { example: { lyrics: "00:00 Dòng đầu tiên\n00:05 Dòng tiếp theo" } } } }, "404": { description: "Không tìm thấy" } } } },
            "/songs/{id}/report": { post: { tags: ["Songs"], summary: "Báo cáo bài hát vi phạm", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["reason"], properties: { reason: { type: "string", example: "Vi phạm bản quyền" }, description: { type: "string", nullable: true } } } } } }, responses: { "200": { description: "Báo cáo thành công" }, "404": { description: "Bài hát không tồn tại" } } } },

            // ─── PLAYLISTS ────────────────────────────────────────
            "/playlists": { post: { tags: ["Playlists"], summary: "Tạo playlist mới", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string", nullable: true }, coverUrl: { type: "string", format: "uri", nullable: true }, isPublic: { type: "boolean", default: true } } } } } }, responses: { "200": { description: "Tạo thành công" } } } },
            "/playlists/me": { get: { tags: ["Playlists"], summary: "Lấy danh sách playlist của tôi", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Playlist" } } } } } } } },
            "/playlists/{id}": {
                get: { tags: ["Playlists"], summary: "Lấy thông tin playlist", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" }, "404": { description: "Không tìm thấy" } } },
                delete: { tags: ["Playlists"], summary: "Xóa playlist", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" }, "403": { description: "Không có quyền" } } },
            },
            "/playlists/{id}/songs": {
                get: { tags: ["Playlists"], summary: "Lấy bài hát trong playlist", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" } } },
                post: { tags: ["Playlists"], summary: "Thêm bài hát vào playlist", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["songId"], properties: { songId: { type: "string", format: "uuid" } } } } } }, responses: { "200": { description: "OK" }, "409": { description: "Bài hát đã có trong playlist" } } },
            },
            "/playlists/{id}/songs/{songId}": { delete: { tags: ["Playlists"], summary: "Xóa bài hát khỏi playlist", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }, { name: "songId", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" }, "403": { description: "Không có quyền" } } } },

            // ─── ADMIN ────────────────────────────────────────────
            "/admin/artist-requests": { get: { tags: ["Admin"], summary: "Lấy danh sách artist requests pending", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/ArtistRequest" } } } } } } } },
            "/admin/artist-requests/{id}/approve": { post: { tags: ["Admin"], summary: "Approve artist request", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { adminNote: { type: "string", nullable: true } } } } } }, responses: { "200": { description: "Approved" }, "404": { description: "Không tìm thấy" } } } },
            "/admin/artist-requests/{id}/reject": { post: { tags: ["Admin"], summary: "Reject artist request", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["adminNote"], properties: { adminNote: { type: "string" } } } } } }, responses: { "200": { description: "Rejected" }, "404": { description: "Không tìm thấy" } } } },
            "/admin/reports": { get: { tags: ["Admin"], summary: "Lấy danh sách báo cáo pending", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { type: "object", properties: { id: { type: "string" }, songId: { type: "string", format: "uuid" }, userId: { type: "string" }, reason: { type: "string" }, description: { type: "string", nullable: true }, status: { type: "string", enum: ["pending", "resolved"] }, createdAt: { type: "string", format: "date-time" } } } } } } } } } },
            "/admin/reports/{id}/resolve": { post: { tags: ["Admin"], summary: "Đánh dấu báo cáo đã giải quyết", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" }, "404": { description: "Không tìm thấy" } } } },
            "/admin/songs/{id}": { delete: { tags: ["Admin"], summary: "Gỡ bài hát vi phạm", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" }, "404": { description: "Không tìm thấy" } } } },

            // ─── NOTIFICATIONS ────────────────────────────────────
            "/notifications": {
                get: { tags: ["Notifications"], summary: "Lấy danh sách thông báo của user", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK", content: { "application/json": { example: [{ id: "uuid", type: "new_song", message: "...", is_read: false, createdAt: "..." }] } } } } },
                post: { tags: ["Notifications"], summary: "Tạo thông báo mới", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["type", "message"], properties: { type: { type: "string", example: "new_song" }, message: { type: "string" }, artistName: { type: "string", nullable: true }, songTitle: { type: "string", nullable: true }, imageUrl: { type: "string", nullable: true } } } } } }, responses: { "200": { description: "Tạo thành công" } } },
            },
            "/notifications/read-all": { put: { tags: ["Notifications"], summary: "Đánh dấu tất cả đã đọc", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
            "/notifications/{id}/read": { put: { tags: ["Notifications"], summary: "Đánh dấu một thông báo đã đọc", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "OK" }, "404": { description: "Không tìm thấy" } } } },
        },
    };

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(spec),
    };
};
