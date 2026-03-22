//src/application/services/SongService.ts
import { Song, SongSchema } from "../../domain/entities/Song";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { Result, Success, Failure } from "../../shared/utils/Result";
import { Guard } from "../../shared/utils/Guard";
import { ArtistRepository } from "@/infrastructure/database/ArtistRepository";

export class SongService {
    constructor(
        private readonly songRepo: SongRepository,
        private readonly artistRepo: ArtistRepository
    ) { }

    async createSong(rawData: any): Promise<Result<Song>> {
        try {
            // 1. Validate đầu vào (Bỏ qua các trường server tự sinh)
            const validation = SongSchema.safeParse(rawData);
            if (!validation.success) {
                return Failure(validation.error.issues[0].message, 400);
            }

            const songData = validation.data;

            // 2. Check Artist tồn tại
            const artistResult = await this.artistRepo.findById(String(songData.artistId));
            if (!artistResult.success) {
                return Failure(`Nghệ sĩ không tồn tại!`, 404);
            }

            // 3. Thực hiện lưu (BaseRepo sẽ tự gán id, createdAt nếu bạn đã code ở đó)
            return await this.songRepo.save(songData);

        } catch (error: any) {
            return Failure(`Lỗi SongService: ${error.message}`, 500);
        }
    }
}
