import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        console.log("🔄 Webhook received");

        const wh = new Webhook(process.env.SIGNING_SECRET);
        const headerPayload = await headers();
        const svixHeaders = {
            "svix-id": headerPayload.get("svix-id"),
            "svix-timestamp": headerPayload.get("svix-timestamp"),
            "svix-signature": headerPayload.get("svix-signature"),
        };

        // Get the payload and verify it
        const payload = await req.json();
        const body = JSON.stringify(payload);
        const { data, type } = wh.verify(body, svixHeaders);

        console.log("🎯 Webhook type:", type);
        console.log("👤 Raw user data:", data);

        // Defensive extraction of email, name, image and id
        let email = "";
        if (Array.isArray(data?.email_addresses) && data.email_addresses.length > 0) {
            // Clerk uses objects with email_address
            const first = data.email_addresses[0];
            email = first?.email_address ?? (typeof first === "string" ? first : "");
        } else if (data?.email) {
            email = data.email;
        } else if (data?.primary_email_address) {
            email = data.primary_email_address;
        }

        const name = `${data?.first_name || ""} ${data?.last_name || ""}`.trim() || data?.name || "Unknown User";
        const image = data?.image_url || data?.avatar_url || "";
        const id = data?.id || data?.user_id || (email ? `user_${email}` : `user_${Date.now()}`);

        const userData = {
            _id: id,
            email,
            name,
            image,
        };

        console.log("💾 Prepared user data:", userData);

        await connectDB();

        switch (type) {
            case "user.created":
                console.log("✅ Creating new user", userData._id);
                // Use upsert protection if duplicate keys
                try {
                    await User.create(userData);
                } catch (e) {
                    console.warn("User create failed (maybe exists):", e.message);
                }
                break;

            case "user.updated":
                console.log("🔄 Updating user", userData._id);
                await User.findByIdAndUpdate(userData._id, userData, { upsert: true, new: true });
                break;

            case "user.deleted":
                console.log("🗑️ Deleting user", userData._id);
                await User.findByIdAndDelete(userData._id);
                break;

            default:
                console.log("❓ Unknown webhook type:", type);
                break;
        }

        return NextResponse.json({
            message: "Event processed successfully",
            type: type,
            userId: userData._id,
        });
    } catch (error) {
        console.error("❌ Webhook error:", error);
        return NextResponse.json({ error: "Webhook processing failed", details: error?.message ?? String(error) }, { status: 500 });
    }
}
