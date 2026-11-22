import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { createAuthOptions } from "./auth-options";

const mongodbUri = process.env.MONGODB_URI?.trim();
if (!mongodbUri) {
    throw new Error("MONGODB_URI must be configured for Better Auth.");
}

const client = new MongoClient(mongodbUri);
const db = client.db();

export const auth = betterAuth(
    createAuthOptions(mongodbAdapter(db, { client })),
);
