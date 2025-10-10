import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Document from "@/models/Document";

export async function GET(request) {
    try {
        await connectDB();
        
        // Get all documents to verify what exists
        const documents = await Document.find({}).sort({ createdAt: -1 });
        
        const documentInfo = documents.map(doc => ({
            _id: doc._id,
            filename: doc.filename,
            userId: doc.userId,
            isActive: doc.isActive,
            createdAt: doc.createdAt,
            chunks: doc.chunks?.length || 0,
            size: doc.chunks ? doc.chunks.reduce((total, chunk) => total + chunk.text.length, 0) : 0
        }));

        return NextResponse.json({
            success: true,
            message: `Found ${documents.length} documents`,
            documents: documentInfo,
            activeDocument: documents.find(doc => doc.isActive) ? {
                filename: documents.find(doc => doc.isActive).filename,
                id: documents.find(doc => doc.isActive)._id,
                chunks: documents.find(doc => doc.isActive).chunks?.length || 0
            } : null
        });

    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Failed to check documents"
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        
        const { action, documentId } = await request.json();
        
        if (action === "activate") {
            // Deactivate all documents first
            await Document.updateMany({}, { isActive: false });
            
            // Activate the specified document
            const result = await Document.findByIdAndUpdate(
                documentId, 
                { isActive: true }, 
                { new: true }
            );
            
            if (!result) {
                return NextResponse.json({
                    success: false,
                    message: "Document not found"
                }, { status: 404 });
            }
            
            return NextResponse.json({
                success: true,
                message: `Document "${result.filename}" is now active`,
                activeDocument: {
                    id: result._id,
                    filename: result.filename,
                    chunks: result.chunks?.length || 0
                }
            });
        }
        
        return NextResponse.json({
            success: false,
            message: "Invalid action"
        }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Failed to manage documents"
        }, { status: 500 });
    }
}