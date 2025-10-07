import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Document from "@/models/Document";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                message: "Unauthorized" 
            }, { status: 401 });
        }

        await connectDB();
        
        // Get the most recent document for this user
        // In a fixed-document system, you could hardcode a specific document ID
        const document = await Document.findOne({ 
            userId, 
            isActive: true 
        }).sort({ createdAt: -1 });

        if (!document) {
            return NextResponse.json({
                success: false,
                message: "No default document found. Please upload your 400-page document first."
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            document: {
                _id: document._id,
                filename: document.filename,
                uploadedAt: document.uploadedAt,
                chunks: document.chunks?.length || 0
            }
        });

    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Failed to load default document"
        }, { status: 500 });
    }
}