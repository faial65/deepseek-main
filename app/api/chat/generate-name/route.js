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

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized"
            }, { status: 401 });
        }

        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({
                success: false,
                message: "Missing prompt"
            }, { status: 400 });
        }

        // Generate a concise chat name based on the user's prompt
        const nameGenerationPrompt = `Generate a short, concise title (maximum 4-6 words) for a chat conversation based on this user question or prompt. The title should capture the main topic or intent. Only respond with the title, nothing else.

User prompt: "${prompt}"

Title:`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: nameGenerationPrompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
            max_tokens: 20
        });

        let generatedName = completion.choices[0].message.content.trim();
        
        // Clean up the generated name (remove quotes, extra punctuation)
        generatedName = generatedName.replace(/['"]/g, '').replace(/[.!?]+$/, '');
        
        // Fallback if the generated name is too long or empty
        if (!generatedName || generatedName.length > 50) {
            generatedName = "New Chat";
        }

        return NextResponse.json({
            success: true,
            name: generatedName
        });

    } catch (error) {
        console.error("Error generating chat name:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to generate chat name",
            error: error.message
        }, { status: 500 });
    }
}