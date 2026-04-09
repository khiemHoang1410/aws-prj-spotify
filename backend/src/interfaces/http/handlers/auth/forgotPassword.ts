import { z } from "zod";
import { CognitoIdentityProviderClient, ForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
import { Resource } from "sst";
import { makeHandler } from "../../middlewares/makeHandler";
import { validate } from "../../../../shared/utils/validate";
import { Success, Failure } from "../../../../shared/utils/Result";

const cognitoClient = new CognitoIdentityProviderClient({});

const Schema = z.object({
    email: z.email({ message: "Email không hợp lệ" }),
});

// POST /auth/forgot-password
export const handler = makeHandler(async (body) => {
    const v = validate(Schema, body);
    if (!v.success) return v;

    try {
        await cognitoClient.send(new ForgotPasswordCommand({
            ClientId: Resource.SpotifyUserPoolClient.id,
            Username: v.data.email,
        }));
        return Success({ message: "Mã xác nhận đã được gửi đến email của bạn." });
    } catch (error: any) {
        if (error.name === "UserNotFoundException") return Failure("Email không tồn tại", 404);
        if (error.name === "LimitExceededException") return Failure("Quá nhiều yêu cầu, vui lòng thử lại sau", 429);
        return Failure(`Lỗi: ${error.message}`, 500);
    }
});
