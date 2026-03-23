import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { User } from "../../domain/entities/User";
import { Result, Failure } from "../../shared/utils/Result";

export class UserRepository extends BaseRepository<User> {
    protected readonly entityPrefix = "USER";

    async findByUserId(userId: string): Promise<Result<User | null>> {
        try {
            // userId chính là id của user (Cognito sub), dùng findById trực tiếp
            return await this.findById(userId);
        } catch (error: any) {
            return Failure(`Lỗi truy vấn user: ${error.message}`, 500);
        }
    }
}
