import { v7 as uuidv7 } from "uuid";
import { Artist, ArtistSchema } from "../../domain/entities/Artist";
import { ArtistRepository } from "../../infrastructure/database/ArtistRepository";
import { Result, Success, Failure } from "../../shared/utils/Result";

export class ArtistService {
    constructor(private readonly artistRepo: ArtistRepository) { }

    /**
     * Tạo hồ sơ nghệ sĩ mới
     */
    async createArtist(rawData: any): Promise<Result<Artist>> {
        try {
            // 1. Validation kiểu dữ liệu (Zod)
            const validation = ArtistSchema.omit({ id: true }).safeParse(rawData);
            if (!validation.success) {
                return Failure(validation.error.issues[0].message);
            }
            const artistData = {
                ...validation.data,
                id: uuidv7(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as Artist;

            // 2. Logic "Flex": Ở đây Ngài có thể check xem Artist Name đã tồn tại chưa 
            // (Nhưng DynamoDB cần GSI để check cái này hiệu quả, tạm thời mình cứ lưu đã nhé!)

            // 3. Lưu vào Database
            return await this.artistRepo.save(artistData);
        } catch (error: any) {
            return Failure(`Lỗi ArtistService: ${error.message}`);
        }
    }

    async getArtist(id: string): Promise<Result<Artist | null>> {
        return await this.artistRepo.findById(id);
    }

    async getAllArtists(): Promise<Result<Artist[]>> {
        return await this.artistRepo.findAll();
    }
}