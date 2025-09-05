import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/dist/types/server";

export async function GET(req) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return NextResponse.json({
              success:false,
              message:"User not authenticated"  
            });
        }

        await connectDB();

        const chats = await Chat.find({ userId });

        return NextResponse.json({ success: true, chats });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}