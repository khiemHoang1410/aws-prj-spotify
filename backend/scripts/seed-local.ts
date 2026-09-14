/**
 * Seed full dataset into Local DynamoDB (artists, songs, albums, genres, users)
 * Usage: npx tsx scripts/seed-local.ts
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import fs from "fs";
import path from "path";

const lyricsDataPath = path.join(__dirname, "lyrics-data.json");
const lyricsData: Record<string, string> = fs.existsSync(lyricsDataPath)
    ? JSON.parse(fs.readFileSync(lyricsDataPath, "utf-8"))
    : {};

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
        fileUrl: "/audio/chay-ngay-di.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        albumId: IDS.albumSkyTour,
        playCount: 1250000,
        genre: "vpop",
        categories: ["vpop", "pop"],
        lyrics: lyricsData.chayNgayDi || "",
    },
    {
        id: IDS.emCuaNgayHomQua,
        title: "Em Của Ngày Hôm Qua",
        name: "Em Của Ngày Hôm Qua",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 232,
        fileUrl: "/audio/em-cua-ngay-hom-qua.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        albumId: IDS.albumMTP,
        playCount: 4500000,
        genre: "vpop",
        categories: ["vpop", "pop"],
        lyrics: lyricsData.emCuaNgayHomQua || "",
    },
    {
        id: IDS.lacTroi,
        title: "Lạc Trôi",
        name: "Lạc Trôi",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 265,
        fileUrl: "/audio/chay-ngay-di.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        albumId: IDS.albumSkyTour,
        playCount: 3800000,
        genre: "vpop",
        categories: ["vpop", "pop"],
        lyrics: lyricsData.lacTroi || "",
    },
    {
        id: IDS.noiNayCoAnh,
        title: "Nơi Này Có Anh",
        name: "Nơi Này Có Anh",
        artistId: IDS.sonTung,
        artistName: "Sơn Tùng M-TP",
        duration: 260,
        fileUrl: "/audio/em-cua-ngay-hom-qua.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        albumId: IDS.albumMTP,
        playCount: 3100000,
        genre: "pop",
        categories: ["vpop", "pop"],
        lyrics: lyricsData.noiNayCoAnh || "",
    },
    {
        id: IDS.waitingForYou,
        title: "Waiting For You",
        name: "Waiting For You",
        artistId: IDS.mono,
        artistName: "MONO",
        duration: 300,
        fileUrl: "/audio/chay-ngay-di.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b27361421c970b552bb73238618e",
        albumId: IDS.albumMonoStory,
        playCount: 2890000,
        genre: "indie",
        categories: ["ballad", "indie"],
        lyrics: lyricsData.waitingForYou || "",
    },
    {
        id: IDS.mangTienVeChoMe,
        title: "Mang Tiền Về Cho Mẹ",
        name: "Mang Tiền Về Cho Mẹ",
        artistId: IDS.denVau,
        artistName: "Đen Vâu",
        duration: 258,
        fileUrl: "/audio/em-cua-ngay-hom-qua.mp3",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273a2e0e66e40af40424e05779f",
        albumId: null,
        playCount: 3200000,
        genre: "rap",
        categories: ["rap", "vpop"],
        lyrics: lyricsData.mangTienVeChoMe || "",
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

const editorialPlaylists = [
    {
        id: "01966003-0001-7000-8000-000000000001",
        name: "V-Pop Hôm Nay",
        title: "V-Pop Hôm Nay",
        description: "Những giai điệu V-Pop thịnh hành và được yêu thích nhất hiện tại.",
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        songIds: [IDS.chayNgayDi, IDS.emCuaNgayHomQua, IDS.lacTroi, IDS.noiNayCoAnh, IDS.waitingForYou, IDS.mangTienVeChoMe],
        isPublic: true,
        status: "published",
    },
    {
        id: "01966003-0002-7000-8000-000000000002",
        name: "Chill & Relax",
        title: "Chill & Relax",
        description: "Thư giãn cùng những thanh âm êm dịu, xoa dịu tâm hồn bạn.",
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        songIds: [IDS.noiNayCoAnh, IDS.waitingForYou, IDS.mangTienVeChoMe],
        isPublic: true,
        status: "published",
    },
    {
        id: "01966003-0003-7000-8000-000000000003",
        name: "Top Hits Việt Nam",
        title: "Top Hits Việt Nam",
        description: "Bảng xếp hạng các bài hát có lượt nghe cao nhất trên nền tảng.",
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        songIds: [IDS.chayNgayDi, IDS.lacTroi, IDS.waitingForYou],
        isPublic: true,
        status: "published",
    },
];

const sampleUsers = [
    {
        id: "01966004-0001-7000-8000-000000000001",
        email: "listener@spotify.com",
        displayName: "Nguyễn Văn Listener",
        role: "listener",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    },
    {
        id: "01966004-0002-7000-8000-000000000002",
        email: "artist@spotify.com",
        displayName: "Sơn Tùng Official",
        role: "artist",
        avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    },
    {
        id: "01966004-0003-7000-8000-000000000003",
        email: "admin@spotify.com",
        displayName: "Super Admin",
        role: "admin",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
];

async function seed() {
    console.log(`\n🌱 Seeding data vào DynamoDB Local: ${TABLE_NAME}...\n`);

    // 0. Clean dummy scanner data
    try {
        const { QueryCommand, DeleteCommand } = await import("@aws-sdk/lib-dynamodb");
        const [songsRes, playlistsRes] = await Promise.all([
            db.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                ExpressionAttributeValues: { ":type": "SONG", ":sk": "METADATA" },
            })),
            db.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                ExpressionAttributeValues: { ":type": "PLAYLIST", ":sk": "METADATA" },
            })),
        ]);

        for (const item of (songsRes.Items || [])) {
            if (item.artistId === "scanner-admin-id" || item.title === "Untitled") {
                await db.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: item.pk, sk: item.sk } }));
                console.log(`🗑️ Đã xóa dummy song: ${item.pk}`);
            }
        }

        for (const item of (playlistsRes.Items || [])) {
            if (item.name === "Test" || item.name === "My Awesome Test Playlist" || item.title === "Test") {
                await db.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: item.pk, sk: item.sk } }));
                console.log(`🗑️ Đã xóa dummy playlist: ${item.pk}`);
            }
        }
    } catch (e: any) {
        console.warn("Lưu ý khi dọn dummy:", e.message);
    }

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
                lyrics: (s as any).lyrics || null,
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

    // 5. Editorial Playlists
    for (const ep of editorialPlaylists) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `PLAYLIST#${ep.id}`,
                sk: "METADATA",
                entityType: "PLAYLIST",
                id: ep.id,
                name: ep.name,
                title: ep.title,
                description: ep.description,
                coverUrl: ep.coverUrl,
                songIds: ep.songIds,
                isPublic: ep.isPublic,
                status: ep.status,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`✅ Editorial Playlist: ${ep.name}`);
    }

    // 6. Sample Users
    for (const u of sampleUsers) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `USER#${u.id}`,
                sk: "METADATA",
                entityType: "USER",
                id: u.id,
                email: u.email,
                displayName: u.displayName,
                role: u.role,
                avatarUrl: u.avatarUrl,
                isVerified: true,
                isBanned: false,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`✅ User: ${u.displayName} (${u.role})`);
    }

    console.log(`\n🎉 Seeding thành công toàn bộ dữ liệu sạch vào DynamoDB Local!`);
}

seed().catch(console.error);
