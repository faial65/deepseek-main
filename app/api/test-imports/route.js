import { NextResponse } from "next/server";

export async function GET() {
    try {
        console.log("🧪 Testing library imports...");
        
        // Test mammoth import
        const mammoth = await import('mammoth');
        console.log("✅ Mammoth imported successfully");
        
        // Test other imports
        const mongoose = await import('mongoose');
        console.log("✅ Mongoose imported successfully");
        
        return NextResponse.json({
            success: true,
            message: "All libraries imported successfully",
            libraries: {
                mammoth: !!mammoth,
                mongoose: !!mongoose
            }
        });
        
    } catch (error) {
        console.error("❌ Library import error:", error);
        return NextResponse.json({
            success: false,
            message: "Library import failed",
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}