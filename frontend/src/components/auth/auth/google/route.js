import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { OAuth2Client } from "google-auth-library"

// Google OAuth configuration
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
)

export async function GET(request) {
  // Generate Google OAuth URL
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    prompt: "consent",
  })

  // Redirect to Google OAuth
  return NextResponse.redirect(authUrl)
}

export async function POST(request) {
  try {
    const { code } = await request.json()

    // Exchange code for tokens
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Get user info
    const oauth2 = client.oauth2
    const userInfoResponse = await oauth2.userinfo.get()
    const userInfo = userInfoResponse.data

    // Connect to database
    const db = await connectToDatabase()
    const usersCollection = db.collection("users")

    // Check if user exists
    let user = await usersCollection.findOne({ email: userInfo.email })

    if (!user) {
      // Create new user if doesn't exist
      const newUser = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        googleId: userInfo.id,
        createdAt: new Date(),
      }

      const result = await usersCollection.insertOne(newUser)
      user = {
        id: result.insertedId,
        email: newUser.email,
        name: newUser.name,
        picture: newUser.picture,
      }
    } else {
      // Update existing user with Google info if needed
      user = {
        id: user._id,
        email: user.email,
        name: user.name || userInfo.name,
        picture: user.picture || userInfo.picture,
      }
    }

    // Return user data
    return NextResponse.json({
      message: "Google authentication successful",
      user,
    })
  } catch (error) {
    console.error("Google auth error:", error)
    return NextResponse.json({ message: "An error occurred during Google authentication" }, { status: 500 })
  }
}

