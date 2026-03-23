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
    // 1. Load Routes
    const { songPublicRoutes, songProtectedRoutes } = await import("./src/infrastructure/routes/song.routes.js");
    const { artistPublicRoutes, artistProtectedRoutes } = await import("./src/infrastructure/routes/artist.routes.js");
    const { albumPublicRoutes, albumProtectedRoutes } = await import("./src/infrastructure/routes/album.routes.js");
    const { authRoutes } = await import("./src/infrastructure/routes/auth.routes.js");
    const { adminRoutes } = await import("./src/infrastructure/routes/admin.routes.js");
    const { playlistRoutes } = await import("./src/infrastructure/routes/playlist.routes.js");

    // 2. Cognito User Pool
    const userPool = new sst.aws.CognitoUserPool("SpotifyUserPool", {
      usernames: ["email"],
      password: {
        minLength: 8,
        requireNumbers: true,
        requireUppercase: false,
        requireSymbols: false,
      },
    });

    const userPoolClient = userPool.addClient("SpotifyUserPoolClient", {
      transform: {
        client: (args) => {
          args.explicitAuthFlows = [
            "ALLOW_USER_PASSWORD_AUTH",
            "ALLOW_USER_SRP_AUTH",
            "ALLOW_REFRESH_TOKEN_AUTH",
          ];
        },
      },
    });

    // 3. DynamoDB
    const table = new sst.aws.Dynamo("SpotifyTable", {
      name: "Spotify-MainTable",
      fields: {
        pk: "string",
        sk: "string",
        name: "string",
        artistId: "string",
        entityType: "string",
        userId: "string",
      },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      globalIndexes: {
        NameIndex: { hashKey: "name" },
        ArtistIdIndex: { hashKey: "artistId", rangeKey: "sk" },
        EntityTypeIndex: { hashKey: "entityType", rangeKey: "sk" },
        UserIdIndex: { hashKey: "userId", rangeKey: "sk" },
      },
    });

    const bucket = new sst.aws.Bucket("SpotifyMedia", {
      cors: true,
    });

    // 4. API Gateway
    const api = new sst.aws.ApiGatewayV2("MyApi", {
      transform: {
        route: {
          handler: {
            link: [table, bucket], 
            /* 
            vpc: {
              securityGroups: ["sg-025f66f667f5365b2"],
              privateSubnets: ["subnet-01c8103f393077241"], 
            },
            */
          },
        },
      },
    });

    // 6. Đăng ký Routes
    // Public routes (không cần JWT)
    Object.entries(songPublicRoutes).forEach(([route, handler]) => api.route(route, handler));
    Object.entries(artistPublicRoutes).forEach(([route, handler]) => api.route(route, handler));
    Object.entries(albumPublicRoutes).forEach(([route, handler]) => api.route(route, handler));

    // Auth routes (public)
    Object.entries(authRoutes).forEach(([route, handler]) => api.route(route, handler));

    // Protected routes - cần JWT
    const jwtAuth = { auth: { jwt: { authorizer: authorizer.id } } };

    Object.entries(songProtectedRoutes).forEach(([route, handler]) => api.route(route, handler, jwtAuth));
    Object.entries(artistProtectedRoutes).forEach(([route, handler]) => api.route(route, handler, jwtAuth));
    Object.entries(albumProtectedRoutes).forEach(([route, handler]) => api.route(route, handler, jwtAuth));
    Object.entries(playlistRoutes).forEach(([route, handler]) => api.route(route, handler, jwtAuth));
    Object.entries(adminRoutes).forEach(([route, handler]) => api.route(route, handler, jwtAuth));

    api.route("GET /me", "src/interfaces/http/handlers/users/me.handler", jwtAuth);
    api.route("POST /me/artist-request", "src/interfaces/http/handlers/users/artistRequest.handler", jwtAuth);

    // System routes
    api.route("GET /health", "src/interfaces/http/handlers/system/health.handler");
    api.route("GET /docs", "src/interfaces/http/handlers/system/docs.handler");
    api.route("GET /docs/spec", "src/interfaces/http/handlers/system/spec.handler");

    return {
      api: api.url,
      bucketName: bucket.name,
      tableName: table.name,
      userPoolId: userPool.id,
      userPoolClientId: userPoolClient.id,
    };
  },
});
