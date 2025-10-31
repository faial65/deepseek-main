import connectDB from "@/config/db";
import Document from "@/models/Document";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const url = new URL(req.url);
        const documentId = url.searchParams.get('documentId');

        if (!documentId) {
            return NextResponse.json({ success: false, message: 'Missing documentId' }, { status: 400 });
        }

        const doc = await Document.findOne({ _id: documentId, userId, isActive: true });

        if (!doc) {
            return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: doc });
    } catch (error) {
        console.error('Get document error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Failed to fetch document' }, { status: 500 });
    }
}
