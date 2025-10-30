import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try{
        console.log("CREATE CHAT: Route called");
        const {userId} = getAuth(request);

        console.log("CREATE CHAT: UserId:", userId);

        if(!userId){
            console.log("CREATE CHAT: No userId - Unauthorized");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        //prepare the chat data to be saved in the database

        const chatData={
            userId,
            messages: [],
            name:"New Chat",
        };

        console.log("CREATE CHAT: Connecting to DB...");
        await connectDB();
        console.log("CREATE CHAT: DB connected, creating chat...");
        const newChat = await Chat.create(chatData);
        console.log("CREATE CHAT: Chat created successfully:", newChat._id);

        return NextResponse.json({ 
            success: true, 
            message: "Chat created successfully", 
            data: newChat 
        });
    }catch(error){
        console.error("CREATE CHAT ERROR:", error);
        return NextResponse.json({ success: false, error: error.message });
    }
}