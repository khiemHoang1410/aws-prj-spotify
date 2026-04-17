import { v7 as uuidv7 } from "uuid";
import { ArtistRequest, ArtistRequestSchema } from "../../domain/entities/ArtistRequest";
import { ArtistRequestRepository } from "../../infrastructure/database/ArtistRequestRepository";
import { ArtistRepository } from "../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../infrastructure/database/UserRepository";
import { AuthService } from "./AuthService";
import { Result, Success, Failure } from "../../shared/utils/Result";
import { Artist } from "../../domain/entities/Artist";
import { Resource } from "sst";
import {
    CognitoIdentityProviderClient,
    AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});

export class ArtistRequestService {
    constructor(
        private readonly requestRepo: ArtistRequestRepository,
        private readonly artistRepo: ArtistRepository,
        private readonly userRepo: UserRepository,
    ) { }

    async submitRequest(userId: string, rawData: any): Promise<Result<ArtistRequest>> {
        try {
            // Check xem đã có request pending chưa
            const existing = await this.requestRepo.findByUserId(userId);
            if (existing.success && existing.data) {
                const status = existing.data.status;
                if (status === "pending") return Failure("Bạn đã có request đang chờ duyệt", 409);
                if (status === "approved") return Failure("Bạn đã là nghệ sĩ rồi", 409);
            }

            const validation = ArtistRequestSchema
                .omit({ id: true, status: true, adminNote: true, createdAt: true, updatedAt: true })
                .safeParse({ ...rawData, userId });

            if (!validation.success) return Failure(validation.error.issues[0].message, 400);

            const requestData: ArtistRequest = {
                ...validation.data,
                id: uuidv7(),
                status: "pending",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            return await this.requestRepo.save(requestData);
        } catch (error: any) {
            return Failure(`Lỗi submit request: ${error.message}`, 500);
        }
    }

    async getPendingRequests(): Promise<Result<ArtistRequest[]>> {
        return await this.requestRepo.findAllPending();
    }

    async approveRequest(requestId: string, adminNote?: string): Promise<Result<Artist>> {
        try {
            // 1. Lấy request
            const reqResult = await this.requestRepo.findById(requestId);
            if (!reqResult.success || !reqResult.data) return Failure("Request không tồn tại", 404);
            const request = reqResult.data;
            if (request.status !== "pending") return Failure("Request này đã được xử lý", 409);

            // 2. Tạo Artist profile
            const artist: Artist = {
                id: uuidv7(),
                userId: request.userId,
                name: request.stageName,
                bio: request.bio,
                photoUrl: request.photoUrl,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await this.artistRepo.save(artist);

            // 3. Cập nhật request status
            await this.requestRepo.updateStatus(requestId, "approved", adminNote);

            // 4. Update User record: set artistId + promote role + mark verified
            // Lấy user từ DynamoDB trước để có email (dùng cho Cognito group add)
            const userResult = await this.userRepo.findById(request.userId);
            if (!userResult.success || !userResult.data) {
                return Failure("Không tìm thấy user để cập nhật", 404);
            }
            await this.userRepo.update(request.userId, {
                artistId: artist.id,
                role: "artist",
                isVerified: true,
            } as any);

            // 5. Thêm user vào Cognito group "artist"
            // Dùng email từ DynamoDB — Cognito pool dùng email làm username,
            // KHÔNG phải UUID sub. AdminGetUserCommand({ Username: sub }) sẽ throw.
            const email = userResult.data.email;
            if (email) {
                await cognitoClient.send(new AdminAddUserToGroupCommand({
                    UserPoolId: Resource.SpotifyUserPool.id,
                    Username: email,
                    GroupName: "artist",
                }));
            }

            return Success(artist);
        } catch (error: any) {
            return Failure(`Lỗi approve request: ${error.message}`, 500);
        }
    }

    async rejectRequest(requestId: string, adminNote: string): Promise<Result<{ message: string }>> {
        try {
            const reqResult = await this.requestRepo.findById(requestId);
            if (!reqResult.success || !reqResult.data) return Failure("Request không tồn tại", 404);
            if (reqResult.data.status !== "pending") return Failure("Request này đã được xử lý", 409);

            await this.requestRepo.updateStatus(requestId, "rejected", adminNote);
            return Success({ message: "Đã từ chối request" });
        } catch (error: any) {
            return Failure(`Lỗi reject request: ${error.message}`, 500);
        }
    }
}
