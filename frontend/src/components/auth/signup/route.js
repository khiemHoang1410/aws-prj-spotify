import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { email, password, passwordStrength } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Check password strength
    if (passwordStrength === "weak") {
      return NextResponse.json({ message: "Password is too weak" }, { status: 400 })
    }

    // Connect to database
    const db = await connectToDatabase()
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    const newUser = {
      email,
      password: hashedPassword,
      createdAt: new Date(),
    }

    // Insert user into database
    await usersCollection.insertOne(newUser)

    // Return success response
    return NextResponse.json({
      message: "User registered successfully",
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "An error occurred during signup" }, { status: 500 })
  }
}

