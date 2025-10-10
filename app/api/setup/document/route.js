import connectDB from "@/config/db";
import Document from "@/models/Document";
import { NextResponse } from "next/server";
import mammoth from "mammoth";
import fs from 'fs';
import path from 'path';

export async function POST(request) {
    try {
        console.log("Setup: Starting document setup...");
        
        await connectDB();
        
        // Check if document already exists
        const existingDocument = await Document.findOne({ isActive: true });
        if (existingDocument) {
            return NextResponse.json({
                success: true,
                message: "Document already exists",
                document: {
                    id: existingDocument._id,
                    filename: existingDocument.filename,
                    chunks: existingDocument.chunks?.length || 0
                }
            });
        }

        // Path to your pre-uploaded document in the public folder
        const documentPath = path.join(process.cwd(), 'public', 'master-document.docx');
        
        // Check if file exists
        if (!fs.existsSync(documentPath)) {
            return NextResponse.json({
                success: false,
                message: "Master document not found. Please place 'master-document.docx' in the public folder."
            }, { status: 404 });
        }

        console.log("Setup: Found master document, processing...");

        // Read and process the document
        const buffer = fs.readFileSync(documentPath);
        const result = await mammoth.extractRawText({ buffer });
        const fullText = result.value;

        console.log("Setup: Extracted text, length:", fullText.length);

        // Process the document same as upload-lite
        const chunks = chunkTextOptimized(fullText);
        console.log("Setup: Created", chunks.length, "chunks");

        // Generate embeddings
        const processedChunks = generateMemoryEfficientEmbeddings(chunks);
        console.log("Setup: Generated embeddings for all chunks");

        // Create the document in database
        const documentData = {
            filename: "Master Knowledge Base (400 pages)",
            content: fullText,
            chunks: processedChunks,
            uploadedAt: new Date(),
            isActive: true,
            userId: "system", // System document, not user-specific
            fileSize: buffer.length,
            processingTime: Date.now()
        };

        const savedDocument = await Document.create(documentData);
        console.log("Setup: Document saved with ID:", savedDocument._id);

        return NextResponse.json({
            success: true,
            message: "Master document setup completed successfully",
            document: {
                id: savedDocument._id,
                filename: savedDocument.filename,
                chunks: savedDocument.chunks.length,
                size: fullText.length
            }
        });

    } catch (error) {
        console.error("Setup Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Setup failed"
        }, { status: 500 });
    }
}

// Chunking function (same as upload-lite)
function chunkTextOptimized(text, chunkSize = 2000, overlap = 200) {
    const chunks = [];
    let start = 0;
    let chunkIndex = 0;
    
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        let chunkText = text.slice(start, end);
        
        // Try to break at sentence boundaries
        if (end < text.length) {
            const lastSentence = chunkText.lastIndexOf('.');
            const lastNewline = chunkText.lastIndexOf('\n');
            const breakPoint = Math.max(lastSentence, lastNewline);
            
            if (breakPoint > start + chunkSize * 0.7) {
                chunkText = text.slice(start, start + breakPoint + 1);
            }
        }
        
        chunks.push({
            text: chunkText.trim(),
            index: chunkIndex++,
            startPos: start,
            endPos: start + chunkText.length
        });
        
        // Move start position with overlap
        start += chunkText.length - overlap;
    }
    
    return chunks;
}

// Embedding function (same as upload-lite)
function generateMemoryEfficientEmbeddings(chunks) {
    console.log("Setup: Generating TF-IDF embeddings...");
    
    // Extract vocabulary from all chunks (Arabic + English support)
    const allText = chunks.map(chunk => chunk.text).join(' ');
    const words = allText.toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF]/g, '') // Keep Arabic characters
        .split(/\s+/)
        .filter(word => word.length > 2);
    
    // Count word frequencies
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Get top 20 most frequent words as vocabulary
    const vocabulary = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([word]) => word);
    
    console.log("Setup: Using vocabulary:", vocabulary.slice(0, 5), "...");
    
    // Generate embeddings for each chunk
    return chunks.map(chunk => ({
        ...chunk,
        embedding: generateSimpleEmbedding(chunk.text, vocabulary)
    }));
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