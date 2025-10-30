import mongoose from "mongoose";
import { cache } from "react";

let cached= global.mongoose || {conn:null,promise:null};

export default async function connectDB() {
    if(cached.conn) {
        console.log("DB: Using cached connection");
        return cached.conn;
    }
    if(!cached.promise) {
        console.log("DB: Creating new connection to MongoDB...");
        if(!process.env.MONGODB_URI) {
            console.error("DB: MONGODB_URI not found in environment!");
            throw new Error("MONGODB_URI is not defined");
        }
        cached.promise = mongoose.connect(process.env.MONGODB_URI).then((mongoose) => {
            console.log("DB: MongoDB connected successfully");
            return mongoose;
        });
    }
    try{
        cached.conn=await cached.promise;
    }catch(error){
        console.error("MongoDB connection error:", error);
        cached.promise = null; // Reset promise on error
        throw error;
    }
    return cached.conn;
}