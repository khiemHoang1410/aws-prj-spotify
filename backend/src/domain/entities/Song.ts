// path: src/domain/entities/Song.ts

export interface Song {
    songId: string;
    title: string;
    artistName: string;
    albumId: string;
    durationSeconds: number;
    fileUrl: string;
    createdAt: string;
}

// Interface dành riêng cho DynamoDB (Single Table Design)
export interface SongItem extends Song {
    pk: `SONG#${string}` | `PLAYLIST#${string}`; 
    sk: "METADATA" | `SONG#${string}`;
    entityType: "SONG"; // Nên có thêm trường này để dễ lọc (FilterExpression)
}
