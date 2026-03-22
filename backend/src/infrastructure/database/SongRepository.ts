import { BaseRepository } from "./BaseRepository";
import { Song } from "../../domain/entities/Song";

// Chỉ cần kế thừa và định nghĩa Prefix, mọi thứ khác Base lo hết
export class SongRepository extends BaseRepository<Song> {
    protected readonly entityPrefix = "SONG";

    // Nếu sau này bạn cần tìm bài hát theo ArtistId (GSI), 
    // bạn mới cần viết thêm hàm riêng ở đây.
}
