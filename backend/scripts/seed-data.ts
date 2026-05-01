/**
 * Seed artists, songs và albums vào DynamoDB
 * Usage: TABLE_NAME=<table> npx tsx scripts/seed-data.ts
 * Hoặc tự đọc từ .sst/outputs.json nếu không truyền TABLE_NAME
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v7 as uuidv7 } from "uuid";
import { readFileSync } from "fs";
import { join } from "path";

const BASE_DIR = process.cwd();

const region = "ap-southeast-1";
const client = new DynamoDBClient({ region });
const db = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

// Tự đọc table name từ outputs.json nếu không có env
function getTableName(): string {
    if (process.env.TABLE_NAME) return process.env.TABLE_NAME;
    try {
        const outputs = JSON.parse(
            readFileSync(join(BASE_DIR, ".sst/outputs.json"), "utf-8")
        );
        return outputs.tableName;
    } catch {
        throw new Error("Không tìm thấy TABLE_NAME. Truyền qua env hoặc chạy sst dev trước.");
    }
}

const TABLE_NAME = getTableName();
const now = new Date().toISOString();

// ─── IDs (UUID v7) ──────────────────────────────────────────────────────────
// Cố định để script idempotent — chạy lại sẽ overwrite cùng records
const IDS = {
    // Artists
    sonTung:   "01966000-0001-7000-8000-000000000001",
    mono:      "01966000-0002-7000-8000-000000000002",
    denVau:    "01966000-0003-7000-8000-000000000003",
    hoangThuyLinh: "01966000-0004-7000-8000-000000000004",
    tangDuyTan:    "01966000-0005-7000-8000-000000000005",
    myTam:     "01966000-0006-7000-8000-000000000006",
    bichPhuong: "01966000-0007-7000-8000-000000000007",
    vuCatTuong: "01966000-0008-7000-8000-000000000008",

    // Songs
    chayNgayDi:       "01966001-0001-7000-8000-000000000001",
    waitingForYou:    "01966001-0002-7000-8000-000000000002",
    muonRoiMaSaoCon:  "01966001-0003-7000-8000-000000000003",
    mangTienVeChoMe:  "01966001-0004-7000-8000-000000000004",
    yeuDuocKhong:     "01966001-0005-7000-8000-000000000005",
    // Thêm songs cho album
    hayCuoiLen:       "01966001-0006-7000-8000-000000000006",
    lacTroi:          "01966001-0007-7000-8000-000000000007",
    nguoiLa:          "01966001-0008-7000-8000-000000000008",

    // Albums
    albumSkyTour:     "01966002-0001-7000-8000-000000000001",
    albumMonoStory:   "01966002-0002-7000-8000-000000000002",
};

const artists = [
    {
        id: IDS.sonTung,
        name: "Sơn Tùng M-TP",
        bio: "Ca sĩ, nhạc sĩ V-Pop nổi tiếng.",
        photoUrl: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1",
        backgroundUrl: "https://i.scdn.co/image/ab67618600001016c50961b7b7be0034ea366052",
        monthlyListeners: "5815953",
        followers: 2300000,
        isVerified: true,
    },
    {
        id: IDS.mono,
        name: "MONO",
        bio: "Nghệ sĩ indie V-Pop, em trai Sơn Tùng M-TP.",
        photoUrl: "https://i.scdn.co/image/ab6761610000e5eb9d0e2f5b6b668d71231f24e9",
        backgroundUrl: "",
        monthlyListeners: "1234567",
        followers: 890000,
        isVerified: true,
    },
    {
        id: IDS.denVau,
        name: "Đen Vâu",
        bio: "Rapper nổi tiếng với phong cách bình dị, gần gũi.",
        photoUrl: "https://i.scdn.co/image/ab6761610000e5eb69ca93f21a6abb0c22c2cd8f",
        backgroundUrl: "",
        monthlyListeners: "2100000",
        followers: 1500000,
        isVerified: true,
    },
    {
        id: IDS.hoangThuyLinh,
        name: "Hoàng Thùy Linh",
        bio: "Ca sĩ, diễn viên đa tài của V-Pop.",
        photoUrl: "https://i.pravatar.cc/300?img=47",
        backgroundUrl: "",
        monthlyListeners: "1800000",
        followers: 1200000,
        isVerified: true,
    },
    {
        id: IDS.tangDuyTan,
        name: "Tăng Duy Tân",
        bio: "Ca sĩ trẻ với nhiều bản hit V-Pop.",
        photoUrl: "https://i.pravatar.cc/300?img=12",
        backgroundUrl: "",
        monthlyListeners: "950000",
        followers: 650000,
        isVerified: true,
    },
    {
        id: IDS.myTam,
        name: "Mỹ Tâm",
        bio: "Diva nhạc Việt với sự nghiệp hơn 20 năm.",
        photoUrl: "https://i.pravatar.cc/300?img=32",
        backgroundUrl: "",
        monthlyListeners: "3200000",
        followers: 2800000,
        isVerified: true,
    },
    {
        id: IDS.bichPhuong,
        name: "Bích Phương",
        bio: "Ca sĩ V-Pop với nhiều bản hit đình đám.",
        photoUrl: "https://i.pravatar.cc/300?img=44",
        backgroundUrl: "",
        monthlyListeners: "1600000",
        followers: 1100000,
        isVerified: true,
    },
    {
        id: IDS.vuCatTuong,
        name: "Vũ Cát Tường",
        bio: "Ca sĩ kiêm nhạc sĩ tài năng của V-Pop.",
        photoUrl: "https://i.pravatar.cc/300?img=56",
        backgroundUrl: "",
        monthlyListeners: "1100000",
        followers: 780000,
        isVerified: true,
    },
];

const songs = [
    {
        id: IDS.chayNgayDi,
        title: "Chạy Ngay Đi",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 245,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        lyrics: null,
        albumId: IDS.albumSkyTour,
        playCount: 1250000,
        categories: ["vpop", "pop"],
    },
    {
        id: IDS.waitingForYou,
        title: "Waiting For You",
        artistId: IDS.mono,
        artistName: "MONO",
        duration: 300,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b27361421c970b552bb73238618e",
        lyrics: null,
        albumId: IDS.albumMonoStory,
        playCount: 890000,
        categories: ["ballad", "indie"],
    },
    {
        id: IDS.muonRoiMaSaoCon,
        title: "Muộn Rồi Mà Sao Còn",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 287,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        lyrics: null,
        albumId: IDS.albumSkyTour,
        playCount: 2100000,
        categories: ["vpop", "ballad"],
    },
    {
        id: IDS.mangTienVeChoMe,
        title: "Mang Tiền Về Cho Mẹ",
        artistId: IDS.denVau,
        artistName: "Đen Vâu",
        duration: 258,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273a2e0e66e40af40424e05779f",
        lyrics: null,
        albumId: null,
        playCount: 3200000,
        categories: ["rap", "vpop"],
    },
    {
        id: IDS.yeuDuocKhong,
        title: "Yêu Được Không",
        artistId: IDS.mono,
        artistName: "MONO",
        duration: 241,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b27361421c970b552bb73238618e",
        lyrics: null,
        albumId: IDS.albumMonoStory,
        playCount: 670000,
        categories: ["ballad", "indie"],
    },
    {
        id: IDS.hayCuoiLen,
        title: "Hãy Cười Lên",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 220,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        lyrics: null,
        albumId: IDS.albumSkyTour,
        playCount: 980000,
        categories: ["vpop", "pop"],
    },
    {
        id: IDS.lacTroi,
        title: "Lạc Trôi",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 265,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        lyrics: null,
        albumId: IDS.albumSkyTour,
        playCount: 1800000,
        categories: ["vpop", "pop"],
    },
    {
        id: IDS.nguoiLa,
        title: "Người Lạ Ơi",
        artistId: IDS.mono,
        artistName: "MONO",
        duration: 235,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b27361421c970b552bb73238618e",
        lyrics: null,
        albumId: IDS.albumMonoStory,
        playCount: 750000,
        categories: ["ballad", "indie"],
    },
];

// Albums với songIds là UUID hợp lệ
const albums = [
    {
        id: IDS.albumSkyTour,
        title: "Sky Tour",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        releaseDate: "2019-07-20",
        songIds: [IDS.chayNgayDi, IDS.muonRoiMaSaoCon, IDS.hayCuoiLen, IDS.lacTroi],
    },
    {
        id: IDS.albumMonoStory,
        title: "MONO Story",
        artistId: IDS.mono,
        artistName: "MONO",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b27361421c970b552bb73238618e",
        releaseDate: "2022-10-21",
        songIds: [IDS.waitingForYou, IDS.yeuDuocKhong, IDS.nguoiLa],
    },
];

async function seed() {
    console.log(`\n🌱 Seeding data vào table: ${TABLE_NAME}\n`);

    // Seed artists
    for (const artist of artists) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `ARTIST#${artist.id}`,
                sk: "METADATA",
                entityType: "ARTIST",
                id: artist.id,
                name: artist.name,
                bio: artist.bio,
                photoUrl: artist.photoUrl,
                backgroundUrl: artist.backgroundUrl,
                monthlyListeners: artist.monthlyListeners,
                followers: artist.followers,
                isVerified: artist.isVerified,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`✅ Artist: ${artist.name}`);
    }

    // Seed songs
    for (const song of songs) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `SONG#${song.id}`,
                sk: "METADATA",
                entityType: "SONG",
                id: song.id,
                title: song.title,
                artistId: song.artistId,
                artistName: song.artistName,
                duration: song.duration,
                fileUrl: song.fileUrl,
                coverUrl: song.coverUrl,
                lyrics: song.lyrics,
                albumId: song.albumId,
                playCount: song.playCount,
                categories: song.categories,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`✅ Song: ${song.title}`);
    }

    // Seed albums
    for (const album of albums) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `ALBUM#${album.id}`,
                sk: "METADATA",
                entityType: "ALBUM",
                id: album.id,
                title: album.title,
                artistId: album.artistId,
                artistName: album.artistName,
                coverUrl: album.coverUrl,
                releaseDate: album.releaseDate,
                songIds: album.songIds,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`✅ Album: ${album.title} (${album.songIds.length} bài)`);
    }

    console.log(`\n🎉 Done! Seeded ${artists.length} artists + ${songs.length} songs + ${albums.length} albums`);
}

seed().catch(console.error);
