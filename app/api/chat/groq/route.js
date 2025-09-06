export const maxDuration = 60;
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const groq = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY
});

export async function POST(req) {
    try {
        // Check if API key is configured
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({
                success: false,
                message: "Groq API key not configured"
            }, { status: 500 });
        }

        const { userId } = getAuth(req);

        // Extract chatId and prompt from the request body
        const { chatId, prompt } = await req.json();

        console.log("Groq API: Received request for chatId:", chatId, "from userId:", userId);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized"
            }, { status: 401 });
        }

        if (!chatId || !prompt) {
            return NextResponse.json({
                success: false,
                message: "Missing chatId or prompt"
            }, { status: 400 });
        }

        // Connect to database
        await connectDB();

        // Find the chat
        const data = await Chat.findById(chatId);
        if (!data) {
            return NextResponse.json({
                success: false,
                message: "Chat not found"
            }, { status: 404 });
        }

        console.log("Groq API: Found chat with", data.messages.length, "existing messages");

        // Update chat name if this is the first message (before adding new message)
        const isFirstMessage = data.messages.length === 0;

        // Create user message
        const userMessage = {
            role: "user",
            content: prompt,
            timestamp: new Date()
        };

        // Add user message to chat
        data.messages.push(userMessage);

        // Update chat name if it's the first message
        if (isFirstMessage) {
            data.name = prompt.slice(0, 50) + (prompt.length > 50 ? "..." : "");
            console.log("Groq API: Updated chat name to:", data.name);
        }

        console.log("Groq API: Calling Groq API...");

        // Call the Groq API to get a chat completion
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant", // Updated to supported model
            temperature: 0.7,
            max_tokens: 1024
        });

        const message = completion.choices[0].message;
        console.log("Groq API: Received response:", message.content);

        // Create AI message
        const aiMessage = {
            role: "assistant",
            content: message.content,
            timestamp: new Date()
        };

        // Add AI message to chat
        data.messages.push(aiMessage);

        // Save the updated chat
        await data.save();

        console.log("Groq API: Successfully saved messages to chat");

        return NextResponse.json({
            success: true,
            message: aiMessage.content
        });

    } catch (error) {
        console.error("Groq API Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Internal server error"
        }, { status: 500 });
    }
}
