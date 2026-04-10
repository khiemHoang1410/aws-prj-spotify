import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    InitiateAuthCommand,
    ConfirmSignUpCommand,
    AdminAddUserToGroupCommand,
    GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { Resource } from "sst";
import { UserRepository } from "../../infrastructure/database/UserRepository";
import { Result, Success, Failure } from "../../shared/utils/Result";
import { v7 as uuidv7 } from "uuid";
import { User } from "../../domain/entities/User";

const cognitoClient = new CognitoIdentityProviderClient({});

export class AuthService {
    constructor(private readonly userRepo: UserRepository) { }

    async register(email: string, password: string, displayName: string): Promise<Result<{ message: string }>> {
        try {
            // 1. Đăng ký với Cognito
            const signUpResult = await cognitoClient.send(new SignUpCommand({
                ClientId: Resource.SpotifyUserPoolClient.id,
                Username: email,
                Password: password,
                UserAttributes: [
                    { Name: "email", Value: email },
                    { Name: "name", Value: displayName },
                ],
            }));

            // 2. Lưu user vào DynamoDB (dùng Cognito sub làm id)
            const userId = signUpResult.UserSub || uuidv7();
            const user: User = {
                id: userId,
                email,
                displayName,
                role: "listener",
                isBanned: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await this.userRepo.save(user);

            return Success({ message: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản." });
        } catch (error: any) {
            if (error.name === "UsernameExistsException") {
                return Failure("Email đã được sử dụng", 409);
            }
            return Failure(`Lỗi đăng ký: ${error.message}`, 500);
        }
    }

    async confirmEmail(email: string, code: string): Promise<Result<{ message: string }>> {
        try {
            await cognitoClient.send(new ConfirmSignUpCommand({
                ClientId: Resource.SpotifyUserPoolClient.id,
                Username: email,
                ConfirmationCode: code,
            }));
            return Success({ message: "Xác nhận email thành công! Bạn có thể đăng nhập." });
        } catch (error: any) {
            if (error.name === "CodeMismatchException") return Failure("Mã xác nhận không đúng", 400);
            if (error.name === "ExpiredCodeException") return Failure("Mã xác nhận đã hết hạn", 400);
            return Failure(`Lỗi xác nhận: ${error.message}`, 500);
        }
    }

    async login(email: string, password: string): Promise<Result<{ accessToken: string; idToken: string; refreshToken: string }>> {
        try {
            const response = await cognitoClient.send(new InitiateAuthCommand({
                AuthFlow: "USER_PASSWORD_AUTH",
                ClientId: Resource.SpotifyUserPoolClient.id,
                AuthParameters: { USERNAME: email, PASSWORD: password },
            }));

            const tokens = response.AuthenticationResult;
            if (!tokens?.AccessToken || !tokens?.IdToken || !tokens?.RefreshToken) {
                return Failure("Đăng nhập thất bại", 401);
            }

            return Success({
                accessToken: tokens.AccessToken,
                idToken: tokens.IdToken,
                refreshToken: tokens.RefreshToken,
            });
        } catch (error: any) {
            if (error.name === "NotAuthorizedException") return Failure("Email hoặc mật khẩu không đúng", 401);
            if (error.name === "UserNotConfirmedException") return Failure("Tài khoản chưa được xác nhận email", 403);
            return Failure(`Lỗi đăng nhập: ${error.message}`, 500);
        }
    }

    async refresh(refreshToken: string): Promise<Result<{ accessToken: string; idToken: string }>> {
        try {
            const response = await cognitoClient.send(new InitiateAuthCommand({
                AuthFlow: "REFRESH_TOKEN_AUTH",
                ClientId: Resource.SpotifyUserPoolClient.id,
                AuthParameters: { REFRESH_TOKEN: refreshToken },
            }));

            const tokens = response.AuthenticationResult;
            if (!tokens?.AccessToken || !tokens?.IdToken) {
                return Failure("Refresh token không hợp lệ", 401);
            }

            return Success({ accessToken: tokens.AccessToken, idToken: tokens.IdToken });
        } catch (error: any) {
            if (error.name === "NotAuthorizedException") return Failure("Refresh token hết hạn hoặc không hợp lệ", 401);
            return Failure(`Lỗi refresh token: ${error.message}`, 500);
        }
    }

    async logout(accessToken: string): Promise<Result<{ message: string }>> {
        try {
            await cognitoClient.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
            return Success({ message: "Đăng xuất thành công" });
        } catch (error: any) {
            return Failure(`Lỗi đăng xuất: ${error.message}`, 500);
        }
    }

    async addUserToGroup(userPoolId: string, email: string, groupName: string): Promise<void> {
        await cognitoClient.send(new AdminAddUserToGroupCommand({
            UserPoolId: userPoolId,
            Username: email,
            GroupName: groupName,
        }));
    }
}
