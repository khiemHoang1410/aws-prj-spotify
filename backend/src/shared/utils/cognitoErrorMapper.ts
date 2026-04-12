/**
 * Maps Cognito error names to user-friendly Vietnamese messages and HTTP status codes.
 * UserNotFoundException is intentionally NOT in this map — handlers must treat it as success (200)
 * to prevent user enumeration attacks.
 */
export const mapCognitoError = (errorName: string): { message: string; httpCode: number } => {
    switch (errorName) {
        case "CodeMismatchException":
            return { message: "Mã xác nhận không chính xác", httpCode: 400 };
        case "ExpiredCodeException":
            return { message: "Mã xác nhận đã hết hạn, vui lòng yêu cầu mã mới", httpCode: 400 };
        case "InvalidPasswordException":
            return { message: "Mật khẩu không đủ độ phức tạp (tối thiểu 8 ký tự, có chữ hoa, chữ thường và số)", httpCode: 400 };
        case "LimitExceededException":
            return { message: "Quá nhiều yêu cầu, vui lòng thử lại sau", httpCode: 429 };
        case "TooManyFailedAttemptsException":
            return { message: "Quá nhiều lần thử sai, vui lòng yêu cầu mã mới", httpCode: 429 };
        case "NotAuthorizedException":
            return { message: "Yêu cầu không hợp lệ", httpCode: 400 };
        default:
            return { message: "Đã có lỗi xảy ra, vui lòng thử lại", httpCode: 500 };
    }
};
