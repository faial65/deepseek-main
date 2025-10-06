export const maxDuration = 60;
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import Document from "@/models/Document";
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
        const { chatId, prompt, documentId } = await req.json();

        console.log("Groq API: Received request for chatId:", chatId, "from userId:", userId);
        console.log("Groq API: Document ID:", documentId);

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

        // Connect to DB
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

        // Add user message to chat
        const userMessage = {
            role: "user",
            content: prompt,
            timestamp: new Date()
        };
        data.messages.push(userMessage);

        let messages = [...data.messages];

        // Perform free RAG if document is selected
        let contextFromDocuments = "";
        if (documentId) {
            console.log("Groq API: Performing free RAG with document:", documentId);
            contextFromDocuments = await performFreeRAG(documentId, prompt, userId);
        }

        // Clean messages for Groq API (remove MongoDB fields like _id, timestamp)
        const cleanMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        if (contextFromDocuments) {
            // Enhance the prompt with document context
            const enhancedPrompt = `You have access to relevant content from the user's document. Use this context to provide accurate and specific answers.

DOCUMENT CONTEXT:
${contextFromDocuments}

USER QUESTION: ${prompt}

Please provide a comprehensive answer based on the document context. If the answer cannot be found in the provided context, please mention that.`;

            // Use only the enhanced prompt for better focus
            cleanMessages.splice(0, cleanMessages.length, { role: "user", content: enhancedPrompt });
        }

        console.log("Groq API: Calling Groq API...");

        // Call the Groq API to get a chat completion
        const completion = await groq.chat.completions.create({
            messages: cleanMessages,
            model: "llama-3.1-8b-instant",
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

// FREE RAG Helper Function using local embeddings
async function performFreeRAG(documentId, query, userId) {
    try {
        console.log("Free RAG: Starting retrieval for query:", query);
        
        // Find the document
        const document = await Document.findOne({ 
            _id: documentId, 
            userId, 
            isActive: true 
        });
        
        if (!document) {
            console.log("Free RAG: Document not found");
            return "";
        }
        
        console.log("Free RAG: Found document with", document.chunks.length, "chunks");
        
        // Generate query embedding using the same approach as upload-lite (multi-language)
        const allChunks = document.chunks;
        const allText = allChunks.map(chunk => chunk.text).join(' ');
        const words = allText.toLowerCase()
            .replace(/[^\w\s\u0600-\u06FF]/g, '') // Keep Arabic characters
            .split(/\s+/)
            .filter(word => word.length > 2);
        
        // Use the same vocabulary extraction as upload-lite (top 20 words)
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        const vocabulary = Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20)
            .map(([word]) => word);
        
        console.log("Free RAG: Using vocabulary:", vocabulary.slice(0, 5), "...");
        
        // Create query embedding - try both original query and translated keywords
        const queryWords = query.toLowerCase().split(/\s+/);
        const queryEmbedding = generateSimpleEmbedding(query, vocabulary);
        
        // Also try with common user guide keywords in Arabic
        const userGuideKeywords = ['دليل', 'قسم', 'فصل', 'شرح', 'استخدام', 'إرشادات'];
        const keywordEmbedding = generateSimpleEmbedding(userGuideKeywords.join(' '), vocabulary);
        
        console.log("Free RAG: Query embedding:", queryEmbedding.slice(0, 5));
        console.log("Free RAG: Keyword embedding:", keywordEmbedding.slice(0, 5));
        
        // Calculate cosine similarity for each chunk using both embeddings
        const similarities = document.chunks.map((chunk, index) => {
            const querySim = cosineSimilarity(queryEmbedding, chunk.embedding);
            const keywordSim = cosineSimilarity(keywordEmbedding, chunk.embedding);
            const maxSim = Math.max(querySim, keywordSim);
            
            return {
                index,
                chunk,
                similarity: maxSim
            };
        });
        
        // Sort by similarity and get top 5 chunks
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topChunks = similarities.slice(0, 5);
        
        console.log("Free RAG: Top similarities:", topChunks.map(c => c.similarity));
        
        // Combine relevant chunks (very low threshold for simple embeddings)
        const relevantContext = topChunks
            .filter(item => item.similarity > 0.001) // Even lower threshold
            .map(item => item.chunk.text)
            .join('\n\n');
            
        // If no content found with similarity, try taking first few chunks as fallback
        if (relevantContext.length === 0) {
            console.log("Free RAG: No similar content found, using first 3 chunks as fallback");
            const fallbackContext = document.chunks.slice(0, 3)
                .map(chunk => chunk.text)
                .join('\n\n');
            console.log("Free RAG: Fallback context length:", fallbackContext.length);
            return fallbackContext;
        }
            
        console.log("Free RAG: Retrieved context length:", relevantContext.length);
        
        return relevantContext;
        
    } catch (error) {
        console.error("Free RAG Error:", error);
        return "";
    }
}

// Simple embedding generation (same as upload-lite) - supports Arabic
function generateSimpleEmbedding(text, vocabulary) {
    const words = text.toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF]/g, '') // Keep Arabic characters
        .split(/\s+/)
        .filter(word => word.length > 2);
    
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return vocabulary.map(word => wordCount[word] || 0);
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vectorA, vectorB) {
    // Ensure both vectors have the same length
    const maxLength = Math.max(vectorA.length, vectorB.length);
    
    // Pad shorter vector with zeros
    while (vectorA.length < maxLength) vectorA.push(0);
    while (vectorB.length < maxLength) vectorB.push(0);
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
}