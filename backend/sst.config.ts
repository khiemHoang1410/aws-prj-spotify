// sst.config.ts

export default $config({
  app(input) {
    return {
      name: "spotify-backend",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    // 1. Load Routes (Dùng dynamic import)
    const { songRoutes } = await import("./src/infrastructure/routes/song.routes.js");
    const { artistRoutes } = await import("./src/infrastructure/routes/artist.routes.js");

    // 2. Hạ tầng cơ bản
    const table = new sst.aws.Dynamo("SpotifyTable", {
      // ÉP TÊN VẬT LÝ TẠI ĐÂY
      // Nó sẽ hiện đúng tên này trên AWS Console
      name: "Spotify-MainTable",
      fields: {
        pk: "string",
        sk: "string",
        name: "string",
        artistId: "string",
        entityType: "string",
      },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      globalIndexes: {
        NameIndex: { hashKey: "name" },
        ArtistIdIndex: { hashKey: "artistId", rangeKey: "sk" },
        EntityTypeIndex: { hashKey: "entityType", rangeKey: "sk" },
      },
    });

    const bucket = new sst.aws.Bucket("SpotifyMedia", {
      cors: true
    });

    // 3. API Gateway với cấu hình VPC (Giữ lại để dành)
    const api = new sst.aws.ApiGatewayV2("MyApi", {
      // Cách này ngắn gọn và cấp quyền link cho mọi route bạn add vào sau đó
      link: [table, bucket],

      // Nếu bạn CẦN dùng VPC (khi nào dùng RDS hoặc ElastiCache mới cần mở cái này)
      /*
      transform: {
        route: {
          handler: {
            vpc: {
              securityGroups: ["sg-025f66f667f5365b2"],
              privateSubnets: ["subnet-01c8103f393077241"], 
            },
          },
        },
      },
      */
    });

    // 4. Đăng ký Routes từ file cấu hình (Dùng vòng lặp sạch sẽ)

    Object.entries(songRoutes).forEach(([route, handler]) => api.route(route, handler));
    Object.entries(artistRoutes).forEach(([route, handler]) => api.route(route, handler));

    // 5. Đăng ký Health Check và Docs
    api.route("GET /health", "src/interfaces/http/handlers/system/health.handler");
    api.route("GET /docs", "src/interfaces/http/handlers/system/docs.handler");
    api.route("GET /docs/spec", "src/interfaces/http/handlers/system/spec.handler");

    return {
      api: api.url,
      bucketName: bucket.name,
      tableName: table.name,
    };
  },
});
