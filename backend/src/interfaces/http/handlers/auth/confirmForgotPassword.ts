import { z } from "zod";
import { CognitoIdentityProviderClient, ConfirmForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
import { Resource } from "sst";
import { makeHandler } from "../../middlewares/makeHandler";
import { validate } from "../../../../shared/utils/validate";
import { Success, Failure } from "../../../../shared/utils/Result";
import { mapCognitoError } from "../../../../shared/utils/cognitoErrorMapper";

const cognitoClient = new CognitoIdentityProviderClient({});

const Schema = z.object({
    email: z.email({ message: "Email không hợp lệ" }),
    code: z.string().min(1, "Mã OTP không được để trống").trim(),
    newPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

// POST /auth/confirm-forgot-password (public)
export const handler = makeHandler(async (body) => {
    const normalized = {
        email: (body?.email ?? "").toLowerCase().trim(),
        code: (body?.code ?? "").trim(),
        newPassword: body?.newPassword ?? "",
    };
    const v = validate(Schema, normalized);
    if (!v.success) return v;

    try {
        await cognitoClient.send(new ConfirmForgotPasswordCommand({
            ClientId: Resource.SpotifyUserPoolClient.id,
            Username: v.data.email,
            ConfirmationCode: v.data.code,
            Password: v.data.newPassword,
        }));
    } catch (error: any) {
        const mapped = mapCognitoError(error.name);
        return Failure(mapped.message, mapped.httpCode);
    }

    return Success({ message: "Đặt lại mật khẩu thành công" });
});
