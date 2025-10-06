import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Document from "@/models/Document";
import { writeFile, mkdir } from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";
import mammoth from "mammoth";

export async function POST(request) {
    console.log("📤 Document upload started (memory-optimized)");
    
    try {
        const { userId } = getAuth(request);
        console.log("👤 User ID:", userId);

        if (!userId) {
            console.log("❌ No user ID found");
            return NextResponse.json({ 
                success: false, 
                message: "Unauthorized" 
            }, { status: 401 });
        }

        console.log("📋 Getting form data...");
        const formData = await request.formData();
        const file = formData.get("file");
        console.log("📄 File received:", file?.name, file?.type, file?.size);

        if (!file) {
            console.log("❌ No file in form data");
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
            console.log("❌ Invalid file type:", file.type);
            return NextResponse.json({ 
                success: false, 
                message: "Currently supporting DOCX, DOC, and TXT files only. PDF support coming soon!" 
            }, { status: 400 });
        }

        console.log("📁 Creating uploads directory...");
        const uploadsDir = path.join(process.cwd(), "uploads");
        try {
            await mkdir(uploadsDir, { recursive: true });
            console.log("✅ Uploads directory ready");
        } catch (error) {
            console.log("📁 Uploads directory already exists or error:", error.message);
        }

        console.log("💾 Saving file...");
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${file.name}`;
        const filepath = path.join(uploadsDir, filename);
        
        await writeFile(filepath, buffer);
        console.log("✅ File saved to:", filepath);

        console.log("🔍 Extracting text...");
        let extractedText = "";
        
        try {
            if (file.type.includes("word") || file.type.includes("document")) {
                console.log("📝 Processing Word document...");
                extractedText = await extractWordText(filepath);
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
            console.log("❌ No text extracted");
            return NextResponse.json({ 
                success: false, 
                message: "Could not extract text from the document" 
            }, { status: 400 });
        }

        console.log("🔪 Chunking document (optimized)...");
        const chunks = chunkTextOptimized(extractedText);
        console.log("✅ Created", chunks.length, "chunks");

        console.log("🧠 Generating simple embeddings...");
        const chunksWithEmbeddings = await generateMemoryEfficientEmbeddings(chunks);
        console.log("✅ Embeddings generated");

        console.log("💽 Saving to database...");
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
        console.log("✅ Document saved to database with ID:", document._id);

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
        console.error("❌ Document upload error:", error);
        console.error("❌ Error stack:", error.stack);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Failed to upload document",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

// Helper function to extract text from Word documents
async function extractWordText(filepath) {
    try {
        console.log("📝 Reading Word document...");
        const result = await mammoth.extractRawText({ path: filepath });
        console.log("✅ Word document parsed successfully, text length:", result.value.length);
        return result.value;
    } catch (error) {
        console.error("❌ Word extraction error:", error);
        throw new Error(`Failed to extract text from Word document: ${error.message}`);
    }
}

// Memory-optimized chunking (dynamic sizing for large documents)
function chunkTextOptimized(text, chunkSize = 300, overlap = 50) {
    const textLength = text.length;
    let finalChunkSize = chunkSize;
    let maxChunks = 20;
    
    // Adjust for very large documents
    if (textLength > 100000) { // 100K+ characters (like your 377K document)
        finalChunkSize = 2000; // Larger chunks for better context
        maxChunks = Math.min(100, Math.floor(textLength / finalChunkSize)); // More chunks
        console.log(`📄 Large document detected (${textLength} chars), using ${finalChunkSize} char chunks, max ${maxChunks} chunks`);
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
            
        console.log(`📚 Found ${words.length} total words`);
        
        // Get most frequent words from the document itself
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        const vocabulary = Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20) // Use top 20 words instead of 10
            .map(([word]) => word);
            
        console.log(`🔤 Using vocabulary: ${vocabulary.slice(0, 5).join(', ')}... (${vocabulary.length} words)`);
        
        const chunksWithEmbeddings = chunks.map((chunk, index) => {
            console.log(`🔢 Processing chunk ${index + 1}/${chunks.length}`);
            
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
        
        console.log("✅ Memory-efficient embeddings generated");
        return chunksWithEmbeddings;
    } catch (error) {
        console.error("❌ Embedding generation error:", error);
        throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
}