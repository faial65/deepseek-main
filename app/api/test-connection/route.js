import connectDB from "@/config/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        console.log("Testing database connection...");
        
        // Test database connection
        await connectDB();
        console.log("Database connected successfully");
        
        // Get all users from database
        const users = await User.find({}).limit(10);
        console.log(`Found ${users.length} users in database`);
        
        return NextResponse.json({
            success: true,
            message: "Database connection test completed",
            userCount: users.length,
            users: users,
            webhookEndpoint: "/api/clerk",
            mongoConnectionString: process.env.MONGODB_URI ? "Connected to: " + process.env.MONGODB_URI.split('@')[1]?.split('?')[0] : "Not configured"
        });
        
    } catch (error) {
        console.error("Database test error:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: "Database test failed",
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}

// Test webhook simulation
export async function POST(request) {
    try {
        const { testType } = await request.json();
        
        await connectDB();
        
        if (testType === "create") {
            const testUser = await User.create({
                _id: `test_${Date.now()}`,
                name: "Test User",
                email: `test_${Date.now()}@example.com`,
                image: ""
            });

            return NextResponse.json({
                success: true,
                message: "Test user created successfully",
                user: testUser
            });
        }
        
        return NextResponse.json({
            success: false,
            message: "Invalid test type"
        });
        
    } catch (error) {
        console.error("Test user creation error:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: "Test user creation failed",
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}
