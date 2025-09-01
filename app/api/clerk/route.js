import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        console.log("🔄 Webhook received");
        
        const wh = new Webhook(process.env.SIGNING_SECRET);
        const headerPayload = await headers();
        const svixHeaders = {
            "svix-id": headerPayload.get("svix-id"),
            "svix-timestamp": headerPayload.get("svix-timestamp"),
            "svix-signature": headerPayload.get("svix-signature")
        };

        // Get the payload and verify it
        const payload = await request.json();
        const body = JSON.stringify(payload);
        const { data, type } = wh.verify(body, svixHeaders);

        console.log("🎯 Webhook type:", type);
        console.log("👤 User data:", data);

        // Prepare the user data to be saved in the database
        const userData = {
            _id: data.id,
            email: data.email_addresses?.[0]?.email_address || "",
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "Unknown User",
            image: data.image_url || "",
        };

        console.log("💾 Saving user data:", userData);

        await connectDB();

        switch (type) {
            case "user.created":
                console.log("✅ Creating new user");
                const newUser = await User.create(userData);
                console.log("🎉 User created successfully:", newUser);
                break;
            case "user.updated":
                console.log("🔄 Updating user");
                await User.findByIdAndUpdate(userData._id, userData, { upsert: true });
                console.log("✅ User updated successfully");
                break;
            case "user.deleted":
                console.log("🗑️ Deleting user");
                await User.findByIdAndDelete(userData._id);
                console.log("✅ User deleted successfully");
                break;
            default:
                console.log("❓ Unknown webhook type:", type);
                break;
        }

        return NextResponse.json({ 
            message: "Event processed successfully", 
            type: type,
            userId: userData._id 
        });

    } catch (error) {
        console.error("❌ Webhook error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed", details: error.message }, 
            { status: 500 }
        );
    }
}
