<<<<<<< HEAD
import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Song } from "../../domain/entities/Song";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export class SongRepository {
    private readonly tableName = Resource.SpotifyTable.name;

    async save(song: Song): Promise<void> {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: {
                pk: `SONG#${song.id}`, // Partition Key: Phân loại dữ liệu
                sk: "METADATA",        // Sort Key: Chi tiết dữ liệu
                ...song,               // Lưu toàn bộ dữ liệu từ Schema của Ngài
            },
        });

        await docClient.send(command);
    }

    async findById(id: string): Promise<Song | null> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                pk: `SONG#${id}`,
                sk: "METADATA",
            },
        });

        const response = await docClient.send(command);
        return (response.Item as Song) || null;
    }
}
=======
import { BaseRepository } from "./BaseRepository";
import { Song } from "../../domain/entities/Song";

// Chỉ cần kế thừa và định nghĩa Prefix, mọi thứ khác Base lo hết
export class SongRepository extends BaseRepository<Song> {
    protected readonly entityPrefix = "SONG";

    // Nếu sau này bạn cần tìm bài hát theo ArtistId (GSI), 
    // bạn mới cần viết thêm hàm riêng ở đây.
}
>>>>>>> khiem
