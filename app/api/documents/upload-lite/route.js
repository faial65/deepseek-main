import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Document from "@/models/Document";
import mammoth from "mammoth";

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
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/plain"
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ 
                success: false, 
                message: "Currently supporting DOCX, DOC, and TXT files only. PDF support coming soon!" 
            }, { status: 400 });
        }

        console.log("� Extracting text directly from memory...");
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        let extractedText = "";
        
        try {
            if (file.type.includes("word") || file.type.includes("document")) {
                console.log("📝 Processing Word document from buffer...");
                const result = await mammoth.extractRawText({ buffer });
                extractedText = result.value;
                console.log("✅ Word document parsed successfully, text length:", extractedText.length);
            } else if (file.type === "text/plain") {
                console.log("📝 Processing text file...");
                extractedText = buffer.toString("utf-8");
            } else {
                throw new Error("Unsupported file type");
            }
            console.log("✅ Text extracted, length:", extractedText.length);
        } catch (extractError) {
            console.error("❌ Text extraction error:", extractError);
            return NextResponse.json({ 
                success: false, 
                message: `Failed to extract text: ${extractError.message}` 
            }, { status: 400 });
        }

        if (!extractedText.trim()) {
            return NextResponse.json({ 
                success: false, 
                message: "Could not extract text from the document" 
            }, { status: 400 });
        }

        const chunks = chunkTextOptimized(extractedText);

        const chunksWithEmbeddings = await generateMemoryEfficientEmbeddings(chunks);

        await connectDB();
        
        const document = new Document({
            userId,
            filename: file.name,
            originalFilename: file.name,
            filepath: `memory-${Date.now()}-${file.name}`, // Virtual path for serverless
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
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Failed to upload document",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

// Memory-optimized chunking (dynamic sizing for large documents)
function chunkTextOptimized(text, chunkSize = 300, overlap = 50) {
    const textLength = text.length;
    let finalChunkSize = chunkSize;
    let maxChunks = 20;
    
    // Adjust for very large documents
    if (textLength > 100000) { // 100K+ characters
        finalChunkSize = 2000; // Larger chunks for better context
        maxChunks = Math.min(100, Math.floor(textLength / finalChunkSize)); // More chunks
    } else if (textLength > 50000) { // 50K+ characters
        finalChunkSize = 1000;
        maxChunks = 30;
    }
    
    const chunks = [];
    let start = 0;
    
    while (start < text.length && chunks.length < maxChunks) {
        const end = Math.min(start + finalChunkSize, text.length);
        let chunk = text.slice(start, end);
        
        // Try to break at sentence boundaries for better context
        if (end < text.length && chunk.length > 100) {
            const lastSentence = chunk.lastIndexOf('.');
            const lastQuestion = chunk.lastIndexOf('?');
            const lastExclamation = chunk.lastIndexOf('!');
            const lastBreak = Math.max(lastSentence, lastQuestion, lastExclamation);
            
            if (lastBreak > chunk.length * 0.7) { // If we found a good break point
                chunk = chunk.slice(0, lastBreak + 1);
            }
        }
        
        if (chunk.trim().length > 10) { // Only add chunks with meaningful content
            chunks.push({
                text: chunk.trim(),
                index: chunks.length,
                startPos: start,
                endPos: start + chunk.length
            });
        }
        
        start = start + chunk.length - overlap;
    }
    
    console.log(`✅ Created ${chunks.length} chunks with average size ${Math.round(textLength/chunks.length)} chars`);
    return chunks;
}

// Super memory-efficient embeddings (multi-language support)
async function generateMemoryEfficientEmbeddings(chunks) {
    try {
        console.log("🧠 Starting memory-efficient embedding generation...");
        
        // Extract vocabulary from the actual document content (language-agnostic)
        const allText = chunks.map(chunk => chunk.text).join(' ');
        const words = allText.toLowerCase()
            .replace(/[^\w\s\u0600-\u06FF]/g, '') // Keep Arabic characters
            .split(/\s+/)
            .filter(word => word.length > 2);
        
        // Get most frequent words from the document itself
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        const vocabulary = Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20) // Use top 20 words instead of 10
            .map(([word]) => word);
        
        const chunksWithEmbeddings = chunks.map((chunk, index) => {
            // Create embedding based on word frequencies in this chunk
            const chunkWords = chunk.text.toLowerCase()
                .replace(/[^\w\s\u0600-\u06FF]/g, '')
                .split(/\s+/);
                
            const chunkWordCount = {};
            chunkWords.forEach(word => {
                chunkWordCount[word] = (chunkWordCount[word] || 0) + 1;
            });
            
            const embedding = vocabulary.map(word => {
                const count = chunkWordCount[word] || 0;
                return count / Math.max(chunkWords.length, 1);
            });
            
            return {
                ...chunk,
                embedding: embedding
            };
        });
        
        return chunksWithEmbeddings;
    } catch (error) {
        throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
}