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
    // 1. Hạ tầng cơ bản
    const table = new sst.aws.Dynamo("SpotifyTable", {
      fields: { pk: "string", sk: "string" },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
    });

    const bucket = new sst.aws.Bucket("SpotifyMedia", {
      cors: {
        allowMethods: ["GET", "POST", "PUT", "DELETE"],
        allowOrigins: ["*"], // Cho phép mọi Domain gọi vào (Phù hợp để test)
      }
    });


    // 2. API Gateway với cấu hình VPC
    const api = new sst.aws.ApiGatewayV2("MyApi", {
      transform: {
        route: {
          handler: {
            link: [table, bucket], // Để ở đây thì tất cả Route đều có quyền truy cập Table/Bucket
            // vpc: {
            //   securityGroups: ["sg-025f66f667f5365b2"],
            //   privateSubnets: ["subnet-01c8103f393077241"], 
            // },
          },
        },
      },
    });

    // Bây giờ định nghĩa Route cực kỳ ngắn gọn
    api.route("GET /health", "src/handlers/health.handler");

    api.route("POST /songs/upload-url", "src/handlers/getUploadUrl.handler");

    
    return {
      api: api.url,
    };
  },
});