/**
 * Handler cho API GET /songs
 */
exports.handler = async (event) => {
    try {
        // Sau này đoạn này sẽ gọi tới DynamoDB
        const songs = [
            { id: 1, title: "Lạc Trôi", artist: "Sơn Tùng M-TP" },
            { id: 2, title: "Waiting For You", artist: "MONO" }
        ];

        return {
            statusCode: 200,
            headers: {
                // Rất quan trọng để frontend ReactJS gọi được API mà không bị lỗi CORS
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(songs),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Lỗi server nội bộ" }),
        };
    }
};