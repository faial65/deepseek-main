import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Document from "@/models/Document";
import { writeFile, mkdir } from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";
// import * as pdfjs from "pdfjs-dist/legacy/build/pdf.js"; // Temporarily disabled
import mammoth from "mammoth";

export async function POST(request) {
    console.log("📤 Document upload started");
    
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
            // "application/pdf", // Temporarily disabled
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
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "uploads");
        try {
            await mkdir(uploadsDir, { recursive: true });
            console.log("✅ Uploads directory ready");
        } catch (error) {
            console.log("📁 Uploads directory already exists or error:", error.message);
        }

        console.log("💾 Saving file...");
        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${file.name}`;
        const filepath = path.join(uploadsDir, filename);
        
        await writeFile(filepath, buffer);
        console.log("✅ File saved to:", filepath);

        console.log("🔍 Extracting text...");
        // Extract text based on file type
        let extractedText = "";
        
        try {
            if (file.type === "application/pdf") {
                console.log("📄 Processing PDF...");
                extractedText = await extractPDFText(filepath);
            } else if (file.type.includes("word") || file.type.includes("document")) {
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

        console.log("🔪 Chunking document...");
        // Chunk the document
        const chunks = chunkText(extractedText, 1000); // 1000 characters per chunk
        console.log("✅ Created", chunks.length, "chunks");

        console.log("🧠 Generating embeddings...");
        // Generate embeddings for chunks using local transformer
        const chunksWithEmbeddings = await generateLocalEmbeddings(chunks);
        console.log("✅ Embeddings generated");

        console.log("💽 Saving to database...");
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

// Helper function to extract text from PDF (temporarily disabled)
/*
async function extractPDFText(filepath) {
    try {
        console.log("📄 Reading PDF file...");
        const dataBuffer = await readFile(filepath);
        
        console.log("📄 Loading PDF document...");
        const pdf = await pdfjs.getDocument({
            data: dataBuffer,
            verbosity: 0 // Reduce logging
        }).promise;
        
        console.log("📄 PDF loaded, pages:", pdf.numPages);
        
        let fullText = '';
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            console.log(`📄 Processing page ${i}/${pdf.numPages}`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += pageText + '\n\n';
        }
        
        console.log("✅ PDF parsed successfully, text length:", fullText.length);
        return fullText.trim();
    } catch (error) {
        console.error("❌ PDF extraction error:", error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}
*/

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

// Helper function to chunk text
function chunkText(text, chunkSize = 500, overlap = 100) { // Reduced chunk size
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

// FREE Alternative: Local embeddings using simple TF-IDF approach (optimized)
async function generateLocalEmbeddings(chunks) {
    try {
        console.log("🧠 Starting optimized local embedding generation...");
        
        // Limit vocabulary size to prevent memory issues
        const MAX_VOCAB_SIZE = 50; // Much smaller vocabulary
        
        // Create a simple vocabulary from first few chunks only
        const sampleText = chunks.slice(0, Math.min(3, chunks.length))
            .map(chunk => chunk.text).join(' ');
        
        const words = sampleText.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2);
        
        // Get unique words (limited vocabulary)
        const vocabulary = [...new Set(words)].slice(0, MAX_VOCAB_SIZE);
        console.log("📚 Limited vocabulary size:", vocabulary.length);
        
        // Generate simpler embeddings for each chunk
        const chunksWithEmbeddings = chunks.map((chunk, index) => {
            console.log(`🔢 Generating embedding for chunk ${index + 1}/${chunks.length}`);
            const embedding = generateSimpleEmbedding(chunk.text, vocabulary);
            return {
                ...chunk,
                embedding: embedding
            };
        });
        
        console.log("✅ All embeddings generated successfully");
        return chunksWithEmbeddings;
    } catch (error) {
        console.error("❌ Local embedding generation error:", error);
        throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
}

// Simple TF-IDF embedding generation (free alternative)
function generateTFIDFEmbedding(text, vocabulary, allChunks) {
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2);
    
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Calculate TF-IDF for top 100 vocabulary words (to keep embedding size manageable)
    const topVocab = vocabulary.slice(0, 100);
    const embedding = topVocab.map(word => {
        const tf = (wordCount[word] || 0) / words.length;
        
        // Calculate IDF
        const docsWithWord = allChunks.filter(chunk => 
            chunk.text.toLowerCase().includes(word)
        ).length;
        const idf = Math.log(allChunks.length / (docsWithWord + 1));
        
        return tf * idf;
    });
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
}