// sst.config.ts

export default $config({
  app(input) {
    return {
      name: "spotify-backend",
      // Lambda/API Gateway vẫn remove được khi sst remove
      // Data resources (DynamoDB, S3) được bảo vệ riêng bằng tên cố định + deletion protection
      removal: input?.stage === "prod" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: process.env.AWS_DEPLOY_REGION || "ap-southeast-1",
        },
      },
    };
  },
  async run() {
    const { sstEnv } = await import("./sst.env.js");

    // 1. Load Routes
    const { songPublicRoutes, songProtectedRoutes } = await import("./src/infrastructure/routes/song.routes.js");
    const { artistPublicRoutes, artistProtectedRoutes } = await import("./src/infrastructure/routes/artist.routes.js");
    const { albumPublicRoutes, albumProtectedRoutes } = await import("./src/infrastructure/routes/album.routes.js");
    const { authRoutes } = await import("./src/infrastructure/routes/auth.routes.js");
    const { adminRoutes } = await import("./src/infrastructure/routes/admin.routes.js");
    const { playlistProtectedRoutes, playlistPublicRoutes } = await import("./src/infrastructure/routes/playlist.routes.js");
    const { userProtectedRoutes } = await import("./src/infrastructure/routes/user.routes.js");
    const { mediaProtectedRoutes } = await import("./src/infrastructure/routes/media.routes.js");
    const { searchPublicRoutes } = await import("./src/infrastructure/routes/search.routes.js");
    const { systemPublicRoutes } = await import("./src/infrastructure/routes/system.routes.js");

    // 2. Cognito User Pool
    const userPool = new sst.aws.CognitoUserPool("SpotifyUserPool", {
      usernames: ["email"],
      password: {
        minLength: sstEnv.passwordMinLength,
        requireNumbers: true,
        requireUppercase: false,
        requireSymbols: false,
      },
    });

    const userPoolClient = userPool.addClient("SpotifyUserPoolClient", {
      transform: {
        client: (args: any) => {
          args.explicitAuthFlows = [
            "ALLOW_USER_PASSWORD_AUTH",
            "ALLOW_USER_SRP_AUTH",
            "ALLOW_REFRESH_TOKEN_AUTH",
          ];
          args.accessTokenValidity = sstEnv.accessTokenValidityMin;
          args.idTokenValidity = sstEnv.idTokenValidityMin;
          args.refreshTokenValidity = sstEnv.refreshTokenValidityMin;
          args.tokenValidityUnits = {
            accessToken: "minutes",
            idToken: "minutes",
            refreshToken: "minutes",
          };
        },
      },
    });

    // 3. DynamoDB — tên cố định theo stage, không bị xóa khi sst remove
    const table = new sst.aws.Dynamo("SpotifyTable", {
      name: `spotify-${$app.stage}-table`,
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
      transform: {
        table: (args: any) => {
          // Bật deletion protection ở prod, dev thì tắt để dễ cleanup khi cần
          args.deletionProtectionEnabled = $app.stage === "prod";
          // Luôn retain table khi sst remove — không bao giờ tự xóa data
          args.retainOnDelete = true;
        },
      },
    });

    const bucket = new sst.aws.Bucket("SpotifyMedia", {
      name: `spotify-${$app.stage}-media`,
      cors: true,
      access: "public",
      transform: {
        bucket: (args: any) => {
          args.retainOnDelete = true;
        },
      },
    });

    // 4. API Gateway
    const isProd = $app.stage === "prod";
    const domain = isProd ? sstEnv.prodApiDomain : sstEnv.devApiDomain;

    // VPC config cho Lambda (chạy trong private subnet)
    const lambdaVpcConfig = {
        vpc: sstEnv.vpcId,
        vpcSubnets: [sstEnv.privateSubnetId],
        securityGroups: [sstEnv.lambdaSecurityGroupId],
    };

    const api = new sst.aws.ApiGatewayV2("MyApi", {
      link: [table, bucket, userPool, userPoolClient],
      cors: {
        allowOrigins: isProd ? sstEnv.prodCorsOrigins : ["*"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // 5. Cognito Authorizer
    const authorizer = api.addAuthorizer({
      name: "CognitoAuthorizer",
      jwt: {
        issuer: $interpolate`https://cognito-idp.${aws.getRegionOutput().name}.amazonaws.com/${userPool.id}`,
        audiences: [userPoolClient.id],
      },
    });

    // 6. Đăng ký Routes
    const jwtAuth = { auth: { jwt: { authorizer: authorizer.id } } };
    const withVpc = { transform: { function: (args: any) => { Object.assign(args, lambdaVpcConfig); } } };
    const withVpcAndAuth = { ...jwtAuth, ...withVpc };

    // Public routes
    Object.entries(songPublicRoutes).forEach(([route, handler]) => api.route(route, handler, withVpc));
    Object.entries(artistPublicRoutes).forEach(([route, handler]) => api.route(route, handler, withVpc));
    Object.entries(albumPublicRoutes).forEach(([route, handler]) => api.route(route, handler, withVpc));
    Object.entries(authRoutes).forEach(([route, handler]) => api.route(route, handler, withVpc));
    Object.entries(playlistPublicRoutes).forEach(([route, handler]) => api.route(route, handler, withVpc));
    Object.entries(searchPublicRoutes).forEach(([route, handler]) => api.route(route, handler, withVpc));
    Object.entries(systemPublicRoutes).forEach(([route, handler]) => api.route(route, handler, withVpc));

    // Protected routes
    Object.entries(songProtectedRoutes).forEach(([route, handler]) => api.route(route, handler, withVpcAndAuth));
    Object.entries(artistProtectedRoutes).forEach(([route, handler]) => api.route(route, handler, withVpcAndAuth));
    Object.entries(albumProtectedRoutes).forEach(([route, handler]) => api.route(route, handler, withVpcAndAuth));
    Object.entries(playlistProtectedRoutes).forEach(([route, handler]) => api.route(route, handler, withVpcAndAuth));
    Object.entries(adminRoutes).forEach(([route, handler]) => api.route(route, handler, withVpcAndAuth));
    Object.entries(userProtectedRoutes).forEach(([route, handler]) => api.route(route, handler, withVpcAndAuth));
    Object.entries(mediaProtectedRoutes).forEach(([route, handler]) => api.route(route, handler, withVpcAndAuth));

    return {
      api: api.url,
      bucketName: bucket.name,
      tableName: table.name,
      userPoolId: userPool.id,
      userPoolClientId: userPoolClient.id,
    };
  },
});
