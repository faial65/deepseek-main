import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
        console.log("🔄 Webhook received");
        
        const wh = new Webhook(process.env.SIGNING_SECRET);
        const headerPayload = await headers();
        const svixHeaders = {
            "svix-id": headerPayload.get("svix-id"),
            "svix-timestamp": headerPayload.get("svix-timestamp"),
            "svix-signature": headerPayload.get("svix-signature")
        };

        // Get the payload and verify it
        const payload = await req.json();
        const body = JSON.stringify(payload);
        const { data, type } = wh.verify(body, svixHeaders);

        console.log("🎯 Webhook type:", type);
        console.log("👤 User data:", data);

        // Prepare the user data to be saved in the database
        const userData = {
            _id: data.id,
            email: data.email_addresses[0],
            name: `${data.first_name} ${data.last_name}`,
            image: data.image_url,
        };

        console.log("💾 Saving user data:", userData);

        await connectDB();

        switch (type) {
            case 'user.created':
                await User.create(userData);
                break;
            case "user.updated":
                await User.findByIdAndUpdate(data.id, userData);
                break;
            case "user.deleted":
                await User.findByIdAndDelete(data);
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

}
