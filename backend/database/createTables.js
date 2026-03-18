const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

// Cấu hình AWS Client (Sẽ tự lấy credentials từ ~/.aws/credentials mà bạn đã setup aws configure)
// Nếu bạn muốn test với DynamoDB Local (qua SAM/Docker), bạn đổi endpoint. Hiện tại mình cấu hình để tạo thẳng lên AWS thật.
const client = new DynamoDBClient({ region: "ap-southeast-1" }); // Đổi region nếu bạn dùng region khác

const tablesToCreate = [
  {
    TableName: "Spotify_Users",
    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }], // HASH = Partition Key
    AttributeDefinitions: [{ AttributeName: "userId", AttributeType: "S" }], // S = String
    BillingMode: "PAY_PER_REQUEST", // Khuyên dùng cho dự án mới để tiết kiệm chi phí
  },
  {
    TableName: "Spotify_Songs",
    KeySchema: [{ AttributeName: "songId", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "songId", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Spotify_Playlists",
    KeySchema: [
      { AttributeName: "playlistId", KeyType: "HASH" }, // HASH = PK
      { AttributeName: "songId", KeyType: "RANGE" },    // RANGE = SK
    ],
    AttributeDefinitions: [
      { AttributeName: "playlistId", AttributeType: "S" },
      { AttributeName: "songId", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Spotify_UserInteractions",
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "interactionId", KeyType: "RANGE" }, // SK: Ví dụ "LIKE#SONG_123"
    ],
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "interactionId", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Spotify_Messages", // Bảng cho chức năng Chat trong tương lai
    KeySchema: [
      { AttributeName: "conversationId", KeyType: "HASH" },
      { AttributeName: "timestamp", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "conversationId", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "S" }, // Dùng chuẩn ISO 8601 String cho dễ đọc
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
];

const createTables = async () => {
  console.log("Bắt đầu tạo các bảng DynamoDB...");
  
  for (const table of tablesToCreate) {
    try {
      const command = new CreateTableCommand(table);
      const response = await client.send(command);
      console.log(`✅ Khởi tạo thành công bảng: ${table.TableName}`);
    } catch (error) {
      if (error.name === "ResourceInUseException") {
        console.log(`⚠️ Bảng ${table.TableName} đã tồn tại, bỏ qua.`);
      } else {
        console.error(`❌ Lỗi khi tạo bảng ${table.TableName}:`, error.message);
      }
    }
  }
};

// Chạy hàm
createTables();