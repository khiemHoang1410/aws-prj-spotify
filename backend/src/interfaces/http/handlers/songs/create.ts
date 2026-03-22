import { makeHandler } from "../../middlewares/makeHandler";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";

// 1. Khởi tạo các phụ thuộc (Dependency Injection thủ công)
const songRepo = new SongRepository();
const artistRepo = new ArtistRepository();
const songService = new SongService(songRepo, artistRepo);

// 2. Định nghĩa logic xử lý
const createSongLogic = async (body: any) => {
    return await songService.createSong(body);
};

// 3. Xuất bản handler thông qua Quản gia
export const handler = makeHandler(createSongLogic);