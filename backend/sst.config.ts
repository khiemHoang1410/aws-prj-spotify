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
      fields: { pk: "string", sk: "string" },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
    });

    const bucket = new sst.aws.Bucket("SpotifyMedia", {
      cors: true
    });

    // 3. API Gateway với cấu hình VPC (Giữ lại để dành)
    const api = new sst.aws.ApiGatewayV2("MyApi", {
      transform: {
        route: {
          handler: {
<<<<<<< HEAD
            link: [table, bucket], // Để ở đây thì tất cả Route đều có quyền truy cập Table/Bucket
            // vpc: {
            //   securityGroups: ["sg-025f66f667f5365b2"],
            //   privateSubnets: ["subnet-01c8103f393077241"], 
            // },
=======
            link: [table, bucket], 
            /* 
            vpc: {
              securityGroups: ["sg-025f66f667f5365b2"],
              privateSubnets: ["subnet-01c8103f393077241"], 
            },
            */
>>>>>>> khiem
          },
        },
      },
    });

    // 4. Đăng ký Routes từ file cấu hình (Dùng vòng lặp sạch sẽ)
    Object.entries(songRoutes).forEach(([route, handler]) => api.route(route, handler));
    Object.entries(artistRoutes).forEach(([route, handler]) => api.route(route, handler));

    // 5. Đăng ký Health Check (ĐỂ NGOÀI VÒNG LẶP)
    api.route("GET /health", "src/interfaces/http/handlers/system/health.handler");

    return {
      api: api.url,
      bucketName: bucket.name,
      tableName: table.name,
    };
  },
});
