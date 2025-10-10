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
        
        // Get the system document (pre-uploaded master document)
        let document = await Document.findOne({ 
            isActive: true 
        }).sort({ createdAt: -1 });

        // If no document exists, try to auto-setup from master file
        if (!document) {
            console.log("No active document found, attempting auto-setup...");
            
            try {
                // Call setup endpoint internally
                const setupResponse = await fetch(`${request.nextUrl.origin}/api/setup/document`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const setupResult = await setupResponse.json();
                
                if (setupResult.success) {
                    // Retry finding the document
                    document = await Document.findOne({ 
                        isActive: true 
                    }).sort({ createdAt: -1 });
                } else {
                    console.log("Auto-setup failed:", setupResult.message);
                }
            } catch (setupError) {
                console.log("Auto-setup error:", setupError.message);
            }
        }

        if (!document) {
            return NextResponse.json({
                success: false,
                message: "No knowledge base found. Please contact admin to upload the master document file."
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