/**
 * Script tạo admin account và Cognito groups
 * Usage: npx tsx scripts/seed-admin.ts
 */
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    CreateGroupCommand,
    AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-1" });

// Lấy từ sst dev output
const USER_POOL_ID = process.env.USER_POOL_ID || "";
const ADMIN_EMAIL = "admin@spotify.local";
const ADMIN_PASSWORD = "Admin@12345";

async function seed() {
    console.log("🌱 Seeding admin account...");
    console.log("USER_POOL_ID:", USER_POOL_ID);

    // 1. Tạo groups
    for (const group of ["admin", "artist"]) {
        try {
            await client.send(new CreateGroupCommand({
                UserPoolId: USER_POOL_ID,
                GroupName: group,
                Description: `${group} group`,
            }));
            console.log(`✅ Created group: ${group}`);
        } catch (e: any) {
            if (e.name === "GroupExistsException") {
                console.log(`⚠️  Group already exists: ${group}`);
            } else throw e;
        }
    }

    // 2. Tạo admin user
    try {
        await client.send(new AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: ADMIN_EMAIL,
            UserAttributes: [
                { Name: "email", Value: ADMIN_EMAIL },
                { Name: "email_verified", Value: "true" },
                { Name: "name", Value: "Admin" },
            ],
            MessageAction: "SUPPRESS", // không gửi email
        }));
        console.log(`✅ Created user: ${ADMIN_EMAIL}`);
    } catch (e: any) {
        if (e.name === "UsernameExistsException") {
            console.log(`⚠️  User already exists: ${ADMIN_EMAIL}`);
        } else throw e;
    }

    // 3. Set permanent password
    await client.send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: ADMIN_EMAIL,
        Password: ADMIN_PASSWORD,
        Permanent: true,
    }));
    console.log(`✅ Set password for: ${ADMIN_EMAIL}`);

    // 4. Add to admin group
    await client.send(new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: ADMIN_EMAIL,
        GroupName: "admin",
    }));
    console.log(`✅ Added to admin group`);

    console.log("\n🎉 Done!");
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
}

seed().catch(console.error);
