import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Document from "@/models/Document";
import { writeFile, mkdir } from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";

// Initialize OpenAI for embeddings (using OpenAI's embedding model)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // You'll need to add this to your .env
});

export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                message: "Unauthorized" 
            }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ 
                success: false, 
                message: "No file uploaded" 
            }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/plain"
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ 
                success: false, 
                message: "Unsupported file type. Please upload PDF, DOCX, DOC, or TXT files." 
            }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "uploads");
        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (error) {
            console.log("Uploads directory already exists or couldn't be created:", error.message);
        }

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${file.name}`;
        const filepath = path.join(uploadsDir, filename);
        
        await writeFile(filepath, buffer);

        // Extract text based on file type
        let extractedText = "";
        
        if (file.type === "application/pdf") {
            extractedText = await extractPDFText(filepath);
        } else if (file.type.includes("word") || file.type.includes("document")) {
            extractedText = await extractWordText(filepath);
        } else if (file.type === "text/plain") {
            extractedText = buffer.toString("utf-8");
        }

        if (!extractedText.trim()) {
            return NextResponse.json({ 
                success: false, 
                message: "Could not extract text from the document" 
            }, { status: 400 });
        }

        // Chunk the document
        const chunks = chunkText(extractedText, 1000); // 1000 characters per chunk

        // Generate embeddings for chunks
        const chunksWithEmbeddings = await generateEmbeddings(chunks);

        // Save document to database
        await connectDB();
        
        const document = new Document({
            userId,
            filename: file.name,
            originalFilename: file.name,
            filepath: filename,
            fileSize: file.size,
            mimeType: file.type,
            extractedText,
            chunks: chunksWithEmbeddings,
            uploadedAt: new Date()
        });

        await document.save();

        return NextResponse.json({
            success: true,
            message: "Document uploaded and processed successfully",
            data: {
                documentId: document._id,
                filename: file.name,
                chunksCount: chunks.length,
                textLength: extractedText.length
            }
        });

    } catch (error) {
        console.error("Document upload error:", error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Failed to upload document" 
        }, { status: 500 });
    }
}

// Helper function to extract text from PDF
async function extractPDFText(filepath) {
    try {
        const dataBuffer = await readFile(filepath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error("PDF extraction error:", error);
        throw new Error("Failed to extract text from PDF");
    }
}

// Helper function to extract text from Word documents
async function extractWordText(filepath) {
    try {
        const result = await mammoth.extractRawText({ path: filepath });
        return result.value;
    } catch (error) {
        console.error("Word extraction error:", error);
        throw new Error("Failed to extract text from Word document");
    }
}

// Helper function to chunk text
function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end);
        
        chunks.push({
            text: chunk.trim(),
            index: chunks.length,
            startPos: start,
            endPos: end
        });
        
        start = end - overlap; // Overlap between chunks
    }
    
    return chunks;
}

// Helper function to generate embeddings
async function generateEmbeddings(chunks) {
    try {
        const chunksWithEmbeddings = [];
        
        // Process chunks in batches to avoid rate limits
        const batchSize = 10;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            
            const embeddings = await openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: batch.map(chunk => chunk.text)
            });
            
            batch.forEach((chunk, index) => {
                chunksWithEmbeddings.push({
                    ...chunk,
                    embedding: embeddings.data[index].embedding
                });
            });
            
            // Add delay to respect rate limits
            if (i + batchSize < chunks.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        return chunksWithEmbeddings;
    } catch (error) {
        console.error("Embedding generation error:", error);
        throw new Error("Failed to generate embeddings");
    }
}