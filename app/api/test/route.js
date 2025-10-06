import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request) {
    try {
        console.log("🧪 Test endpoint called");
        
        const { userId } = getAuth(request);
        console.log("👤 User ID:", userId);

        return NextResponse.json({
            success: true,
            message: "Test endpoint working",
            userId: userId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("❌ Test endpoint error:", error);
        return NextResponse.json({ 
            success: false, 
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        console.log("🧪 Test POST endpoint called");
        
        const { userId } = getAuth(request);
        console.log("👤 User ID:", userId);

        // Test form data parsing
        const formData = await request.formData();
        const file = formData.get("file");
        
        console.log("📄 File received:", {
            name: file?.name,
            type: file?.type,
            size: file?.size
        });

        return NextResponse.json({
            success: true,
            message: "Test upload endpoint working",
            userId: userId,
            fileInfo: file ? {
                name: file.name,
                type: file.type,
                size: file.size
            } : null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("❌ Test POST endpoint error:", error);
        return NextResponse.json({ 
            success: false, 
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}