/**
 * Seed full dataset into Local DynamoDB (artists, songs, albums, genres, users)
 * Usage: npx tsx scripts/seed-local.ts
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const endpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
const region = "ap-southeast-1";

const client = new DynamoDBClient({
    endpoint,
    region,
    credentials: {
        accessKeyId: "localuser",
        secretAccessKey: "localpassword123",
    },
});

const db = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TABLE_NAME || "spotify-dev-table";
const now = new Date().toISOString();

const IDS = {
    // Artists
    sonTung: "01966000-0001-7000-8000-000000000001",
    mono: "01966000-0002-7000-8000-000000000002",
    denVau: "01966000-0003-7000-8000-000000000003",
    hoangThuyLinh: "01966000-0004-7000-8000-000000000004",
    tangDuyTan: "01966000-0005-7000-8000-000000000005",
    myTam: "01966000-0006-7000-8000-000000000006",
    bichPhuong: "01966000-0007-7000-8000-000000000007",
    vuCatTuong: "01966000-0008-7000-8000-000000000008",

    // Songs
    chayNgayDi: "01966001-0001-7000-8000-000000000001",
    waitingForYou: "01966001-0002-7000-8000-000000000002",
    muonRoiMaSaoCon: "01966001-0003-7000-8000-000000000003",
    mangTienVeChoMe: "01966001-0004-7000-8000-000000000004",
    yeuDuocKhong: "01966001-0005-7000-8000-000000000005",
    hayCuoiLen: "01966001-0006-7000-8000-000000000006",
    lacTroi: "01966001-0007-7000-8000-000000000007",
    nguoiLa: "01966001-0008-7000-8000-000000000008",
    emCuaNgayHomQua: "01966001-0009-7000-8000-000000000009",
    noiNayCoAnh: "01966001-0010-7000-8000-000000000010",

    // Albums
    albumSkyTour: "01966002-0001-7000-8000-000000000001",
    albumMonoStory: "01966002-0002-7000-8000-000000000002",
    albumMTP: "01966002-0003-7000-8000-000000000003",
};

const artists = [
    {
        id: IDS.sonTung,
        name: "Sơn Tùng M-TP",
        bio: "Ca sĩ, nhạc sĩ V-Pop hàng đầu Việt Nam.",
        photoUrl: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1",
        backgroundUrl: "https://i.scdn.co/image/ab67618600001016c50961b7b7be0034ea366052",
        monthlyListeners: "5815953",
        followers: 2300000,
        isVerified: true,
    },
    {
        id: IDS.mono,
        name: "MONO",
        bio: "Nghệ sĩ trẻ đầy tài năng với phong cách âm nhạc hiện đại.",
        photoUrl: "https://i.scdn.co/image/ab6761610000e5eb9d0e2f5b6b668d71231f24e9",
        backgroundUrl: "",
        monthlyListeners: "1234567",
        followers: 890000,
        isVerified: true,
    },
    {
        id: IDS.denVau,
        name: "Đen Vâu",
        bio: "Rapper nổi tiếng với phong cách bình dị, mộc mạc và sâu sắc.",
        photoUrl: "https://i.scdn.co/image/ab6761610000e5eb69ca93f21a6abb0c22c2cd8f",
        backgroundUrl: "",
        monthlyListeners: "2100000",
        followers: 1500000,
        isVerified: true,
    },
    {
        id: IDS.hoangThuyLinh,
        name: "Hoàng Thùy Linh",
        bio: "Nữ ca sĩ tiên phong mang âm hưởng văn hóa dân gian vào nhạc đương đại.",
        photoUrl: "https://i.pravatar.cc/300?img=47",
        backgroundUrl: "",
        monthlyListeners: "1800000",
        followers: 1200000,
        isVerified: true,
    },
    {
        id: IDS.tangDuyTan,
        name: "Tăng Duy Tân",
        bio: "Nhạc sĩ / Ca sĩ với loạt ca khúc hit V-Pop gây bão toàn Châu Á.",
        photoUrl: "https://i.pravatar.cc/300?img=12",
        backgroundUrl: "",
        monthlyListeners: "950000",
        followers: 650000,
        isVerified: true,
    },
];

const songs = [
    {
        id: IDS.chayNgayDi,
        title: "Chạy Ngay Đi",
        name: "Chạy Ngay Đi",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 245,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        albumId: IDS.albumSkyTour,
        playCount: 1250000,
        genre: "vpop",
        categories: ["vpop", "pop"],
    },
    {
        id: IDS.emCuaNgayHomQua,
        title: "Em Của Ngày Hôm Qua",
        name: "Em Của Ngày Hôm Qua",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 232,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        albumId: IDS.albumMTP,
        playCount: 4500000,
        genre: "vpop",
        categories: ["vpop", "pop"],
    },
    {
        id: IDS.lacTroi,
        title: "Lạc Trôi",
        name: "Lạc Trôi",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 265,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        albumId: IDS.albumSkyTour,
        playCount: 3800000,
        genre: "vpop",
        categories: ["vpop", "pop"],
    },
    {
        id: IDS.noiNayCoAnh,
        title: "Nơi Này Có Anh",
        name: "Nơi Này Có Anh",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 260,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        albumId: IDS.albumMTP,
        playCount: 3100000,
        genre: "pop",
        categories: ["vpop", "pop"],
    },
    {
        id: IDS.waitingForYou,
        title: "Waiting For You",
        name: "Waiting For You",
        artistId: IDS.mono,
        artistName: "MONO",
        duration: 300,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b27361421c970b552bb73238618e",
        albumId: IDS.albumMonoStory,
        playCount: 2890000,
        genre: "indie",
        categories: ["ballad", "indie"],
    },
    {
        id: IDS.mangTienVeChoMe,
        title: "Mang Tiền Về Cho Mẹ",
        name: "Mang Tiền Về Cho Mẹ",
        artistId: IDS.denVau,
        artistName: "Đen Vâu",
        duration: 258,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273a2e0e66e40af40424e05779f",
        albumId: null,
        playCount: 3200000,
        genre: "rap",
        categories: ["rap", "vpop"],
    },
];

const albums = [
    {
        id: IDS.albumSkyTour,
        title: "Sky Tour 2019",
        name: "Sky Tour 2019",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        releaseDate: "2019-07-20",
        songIds: [IDS.chayNgayDi, IDS.lacTroi],
    },
    {
        id: IDS.albumMTP,
        title: "m-tp M-TP",
        name: "m-tp M-TP",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        releaseDate: "2017-04-01",
        songIds: [IDS.emCuaNgayHomQua, IDS.noiNayCoAnh],
    },
    {
        id: IDS.albumMonoStory,
        title: "22",
        name: "22",
        artistId: IDS.mono,
        artistName: "MONO",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b27361421c970b552bb73238618e",
        releaseDate: "2022-10-21",
        songIds: [IDS.waitingForYou],
    },
];

const genres = [
    { id: "vpop", name: "V-Pop", color: "#1DB954" },
    { id: "pop", name: "Pop", color: "#E91429" },
    { id: "rap", name: "Rap Việt", color: "#BA5D07" },
    { id: "ballad", name: "Ballad", color: "#1E3264" },
    { id: "indie", name: "Indie", color: "#8D67AB" },
    { id: "acoustic", name: "Acoustic", color: "#D84000" },
];

async function seed() {
    console.log(`\n🌱 Seeding data vào DynamoDB Local: ${TABLE_NAME}...\n`);

    // 1. Artists
    for (const a of artists) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `ARTIST#${a.id}`,
                sk: "METADATA",
                entityType: "ARTIST",
                id: a.id,
                name: a.name,
                bio: a.bio,
                photoUrl: a.photoUrl,
                backgroundUrl: a.backgroundUrl,
                monthlyListeners: a.monthlyListeners,
                followers: a.followers,
                isVerified: a.isVerified,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`✅ Artist: ${a.name}`);
    }

    // 2. Songs
    for (const s of songs) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `SONG#${s.id}`,
                sk: "METADATA",
                entityType: "SONG",
                id: s.id,
                title: s.title,
                name: s.name,
                artistId: s.artistId,
                artistName: s.artistName,
                duration: s.duration,
                fileUrl: s.fileUrl,
                coverUrl: s.coverUrl,
                albumId: s.albumId,
                playCount: s.playCount,
                genre: s.genre,
                categories: s.categories,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`✅ Song: ${s.title}`);
    }

    // 3. Albums
    for (const alb of albums) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `ALBUM#${alb.id}`,
                sk: "METADATA",
                entityType: "ALBUM",
                id: alb.id,
                title: alb.title,
                name: alb.name,
                artistId: alb.artistId,
                artistName: alb.artistName,
                coverUrl: alb.coverUrl,
                releaseDate: alb.releaseDate,
                songIds: alb.songIds,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`✅ Album: ${alb.title}`);
    }

    // 4. Genres
    for (const g of genres) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `GENRE#${g.id}`,
                sk: "METADATA",
                entityType: "GENRE",
                id: g.id,
                name: g.name,
                color: g.color,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`✅ Genre: ${g.name}`);
    }

    console.log(`\n🎉 Seeding thành công toàn bộ dữ liệu vào DynamoDB Local!`);
}

seed().catch(console.error);
