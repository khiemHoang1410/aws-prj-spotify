import { z } from "zod";
import { CognitoIdentityProviderClient, ForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
import { Resource } from "sst";
import { makeHandler } from "../../middlewares/makeHandler";
import { validate } from "../../../../shared/utils/validate";
import { Success, Failure } from "../../../../shared/utils/Result";
import { mapCognitoError } from "../../../../shared/utils/cognitoErrorMapper";

const cognitoClient = new CognitoIdentityProviderClient({});

const Schema = z.object({
    email: z.email({ message: "Email không hợp lệ" }),
});

// POST /auth/forgot-password (public)
export const handler = makeHandler(async (body) => {
    const normalized = { email: (body?.email ?? "").toLowerCase().trim() };
    const v = validate(Schema, normalized);
    if (!v.success) return v;

    try {
        await cognitoClient.send(new ForgotPasswordCommand({
            ClientId: Resource.SpotifyUserPoolClient.id,
            Username: v.data.email,
        }));
    } catch (error: any) {
        // UserNotFoundException: do NOT reveal whether email exists — return 200 anyway
        if (error.name === "UserNotFoundException") {
            return Success({ message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi đến email của bạn" });
        }
        const mapped = mapCognitoError(error.name);
        return Failure(mapped.message, mapped.httpCode);
    }

    return Success({ message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi đến email của bạn" });
});
