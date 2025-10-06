import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request) {
    console.log("🧪 Simple upload endpoint called");
    
    try {
        const { userId } = getAuth(request);
        console.log("👤 User ID:", userId);

        if (!userId) {
            console.log("❌ No user ID found");
            return NextResponse.json({ 
                success: false, 
                message: "Unauthorized" 
            }, { status: 401 });
        }

        console.log("📋 Getting form data...");
        const formData = await request.formData();
        const file = formData.get("file");
        console.log("📄 File received:", file?.name, file?.type, file?.size);

        if (!file) {
            console.log("❌ No file in form data");
            return NextResponse.json({ 
                success: false, 
                message: "No file uploaded" 
            }, { status: 400 });
        }

        // Just return basic info for now - no processing
        return NextResponse.json({
            success: true,
            message: "File received successfully (basic test)",
            data: {
                filename: file.name,
                fileSize: file.size,
                mimeType: file.type
            }
        });

    } catch (error) {
        console.error("❌ Simple upload error:", error);
        console.error("❌ Error stack:", error.stack);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Failed to process request",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}