import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || "spotify-local-jwt-secret-key-2026";
export const TABLE_NAME = process.env.TABLE_NAME || "spotify-dev-table";
export const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
process.env.DYNAMODB_ENDPOINT = DYNAMODB_ENDPOINT;
process.env.TABLE_NAME = TABLE_NAME;

const client = new DynamoDBClient({
    endpoint: DYNAMODB_ENDPOINT,
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: "localuser",
        secretAccessKey: "localpassword123",
    },
});

export const db = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

export interface AuthUser {
    sub: string;
    email: string;
    name?: string;
    role: "listener" | "artist" | "admin";
    "cognito:groups": string[];
}

export const generateTokens = (user: { id: string; email: string; name?: string; role: "listener" | "artist" | "admin" }) => {
    const payload: AuthUser = {
        sub: user.id,
        email: user.email,
        name: user.name || user.email.split("@")[0],
        role: user.role,
        "cognito:groups": [user.role],
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const idToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const refreshToken = `mock_refresh_${user.id}_${Date.now()}`;

    return { accessToken, idToken, refreshToken };
};

export const extractUser = (req: Request): AuthUser | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7);
    try {
        return jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch {
        return null;
    }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const user = extractUser(req);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized: Vui lòng đăng nhập" });
    }
    (req as any).user = user;
    next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = extractUser(req);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized: Vui lòng đăng nhập" });
    }
    if (user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Yêu cầu quyền quản trị viên" });
    }
    (req as any).user = user;
    next();
};

export const cleanItem = (item: any) => {
    if (!item) return item;
    const { pk, sk, entityType, ...rest } = item;
    const id = rest.id || (pk ? pk.split("#")[1] : undefined);
    return { ...rest, id };
};
