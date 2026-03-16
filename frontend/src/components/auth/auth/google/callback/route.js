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
  try {
    // Get code from URL
    const url = new URL(request.url)
    const code = url.searchParams.get("code")

    if (!code) {
      return NextResponse.redirect("/login?error=No authorization code provided")
    }

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
    const user = await usersCollection.findOne({ email: userInfo.email })

    if (!user) {
      // Create new user if doesn't exist
      const newUser = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        googleId: userInfo.id,
        createdAt: new Date(),
      }

      await usersCollection.insertOne(newUser)
    } else {
      // Update existing user with Google info if needed
      await usersCollection.updateOne(
        { email: userInfo.email },
        {
          $set: {
            googleId: userInfo.id,
            name: user.name || userInfo.name,
            picture: user.picture || userInfo.picture,
            lastLogin: new Date(),
          },
        },
      )
    }

    // Create user object for client
    const userData = {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    }

    // Encode user data for URL
    const userDataParam = encodeURIComponent(JSON.stringify(userData))

    // Redirect to main page with user data
    return NextResponse.redirect(`/main?user=${userDataParam}`)
  } catch (error) {
    console.error("Google callback error:", error)
    return NextResponse.redirect("/login?error=Authentication failed")
  }
}

