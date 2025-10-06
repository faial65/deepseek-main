import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        filename: { type: String, required: true },
        originalFilename: { type: String, required: true },
        filepath: { type: String, required: true },
        fileSize: { type: Number, required: true },
        mimeType: { type: String, required: true },
        extractedText: { type: String, required: true },
        chunks: [{
            text: { type: String, required: true },
            index: { type: Number, required: true },
            startPos: { type: Number, required: true },
            endPos: { type: Number, required: true },
            embedding: [{ type: Number }] // Array of numbers for vector embedding
        }],
        uploadedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Index for efficient similarity search
DocumentSchema.index({ userId: 1, isActive: 1 });
DocumentSchema.index({ "chunks.embedding": 1 });

const Document = mongoose.models.Document || mongoose.model("Document", DocumentSchema);

export default Document;