import connectDB from "@/config/db";
import Document from "@/models/Document";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

        const documents = await Document.find(
            { userId, isActive: true },
            { extractedText: 0, "chunks.embedding": 0 } // Exclude large fields for list view
        ).sort({ uploadedAt: -1 });

        return NextResponse.json({
            success: true,
            data: documents
        });

    } catch (error) {
        console.error("Documents fetch error:", error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Failed to fetch documents" 
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                message: "Unauthorized" 
            }, { status: 401 });
        }

        await connectDB();

        const documents = await Document.find(
            { userId, isActive: true },
            { extractedText: 0, "chunks.embedding": 0 } // Exclude large fields for list view
        ).sort({ uploadedAt: -1 });

        return NextResponse.json({
            success: true,
            data: documents
        });

    } catch (error) {
        console.error("Documents fetch error:", error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Failed to fetch documents" 
        }, { status: 500 });
    }
}