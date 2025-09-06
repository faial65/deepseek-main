import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try{
        const {userId} = getAuth(request);

        if(!userId){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        //prepare the chat data to be saved in the database

        const chatData={
            userId,
            messages: [],
            name:"New Chat",
        };

        await connectDB();
        const newChat = await Chat.create(chatData);

        return NextResponse.json({ 
            success: true, 
            message: "Chat created successfully", 
            data: newChat 
        });
    }catch(error){
        return NextResponse.json({ success: false, error: error.message });
    }
}