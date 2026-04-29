import { makeAuthHandler } from "../../middlewares/withAuth";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { Success } from "../../../../shared/utils/Result";

const userRepo = new UserRepository();
const artistRepo = new ArtistRepository();

export const handler = makeAuthHandler(async (_body, _params, auth) => {
    const result = await userRepo.findByUserId(auth.userId);
    if (!result.success) return result;

    // Auto-create user record nếu chưa có (Cognito user chưa từng gọi PUT /me)
    if (!result.data) {
        const newUser = {
            id: auth.userId,
            email: auth.email,
            displayName: auth.name || auth.email,
            role: (auth.role as any) || "listener",
            isVerified: false,
            isBanned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await userRepo.save(newUser);
        return Success(newUser);
    }

    const user = result.data;

    // Backfill artistId: nếu user là artist nhưng chưa có artistId trong record
    // (xảy ra với seed data hoặc user được promote role trực tiếp)
    if (user.role === "artist" && !user.artistId) {
        const artistResult = await artistRepo.findByUserId(auth.userId);
        if (artistResult.success && artistResult.data) {
            const artistId = artistResult.data.id;
            // Persist để lần sau không cần lookup nữa
            await userRepo.update(auth.userId, { artistId } as any);
            return Success({ ...user, artistId });
        }
    }

    return result;
});
