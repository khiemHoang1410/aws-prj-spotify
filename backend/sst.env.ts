/**
 * Config cho SST infrastructure (build-time).
 * Khác với src/shared/config.ts (runtime của Lambda).
 * Override bằng env var trước khi chạy sst deploy.
 */
export const sstEnv = {
    // AWS
    region: process.env.AWS_DEPLOY_REGION || "ap-southeast-1",

    // VPC
    vpcId: process.env.VPC_ID || "vpc-0f48709b027d2c28a",
    privateSubnetId: process.env.PRIVATE_SUBNET_ID || "subnet-01c8103f393077241",  // 10.0.1.0/24
    publicSubnetId: process.env.PUBLIC_SUBNET_ID || "subnet-0019b6c4b78790035",    // 10.0.2.0/24
    lambdaSecurityGroupId: process.env.LAMBDA_SG_ID || "sg-025f66f667f5365b2",



    // CORS (prod)
    prodCorsOrigins: (process.env.PROD_CORS_ORIGINS || "https://hskhiem.io.vn,https://www.hskhiem.io.vn").split(","),

    // Cognito password policy
    passwordMinLength: Number(process.env.PASSWORD_MIN_LENGTH) || 8,

    // Token validity (đơn vị: phút)
    accessTokenValidityMin: Number(process.env.ACCESS_TOKEN_VALIDITY_MIN) || 60,       // 1 giờ
    idTokenValidityMin: Number(process.env.ID_TOKEN_VALIDITY_MIN) || 60,               // 1 giờ
    refreshTokenValidityMin: Number(process.env.REFRESH_TOKEN_VALIDITY_MIN) || 43200,  // 30 ngày
};
