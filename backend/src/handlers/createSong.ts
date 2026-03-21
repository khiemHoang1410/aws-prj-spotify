import { SongSchema } from "../domain/entities/Song";
import { SongRepository } from "../infrastructure/database/SongRepository";

const songRepo = new SongRepository();

export const handler = async (event: any) => {
    try {
        const body = JSON.parse(event.body);

        // 1. Dùng cái "vũ khí" Zod của Ngài để ép kiểu và validate
        const validatedSong = SongSchema.parse(body);

        // 2. Lưu vào DB thông qua Repository
        await songRepo.save(validatedSong);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Lụm lúa! Bài hát đã được lưu chuyên nghiệp.",
                data: validatedSong
            }),
        };
    } catch (error: any) {
        console.error(error);

        // Trả về lỗi chuyên nghiệp nếu Zod bắt được dữ liệu láo
        if (error.name === "ZodError") {
            return {
                statusCode: 400,
                body: JSON.stringify({ errors: error.errors }),
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Server gặp sự cố rồi Ngài ơi!" }),
        };
    }
};