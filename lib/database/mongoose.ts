import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL;

interface MongooseConnection {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

// Define a custom type for the global object to include mongoose
interface GlobalWithMongoose {
    mongoose?: MongooseConnection;
}

// Use const since cached is never reassigned
const cached: MongooseConnection = (global as unknown as GlobalWithMongoose).mongoose || { conn: null, promise: null };

if (!cached) {
    (global as unknown as GlobalWithMongoose).mongoose = {
        conn: null,
        promise: null
    };
}

export const connectToDatabase = async () => {
    if (cached.conn) return cached.conn;

    if (!MONGODB_URL) throw new Error('missing mongodburl');

    cached.promise =
        cached.promise ||
        mongoose.connect(MONGODB_URL, {
            dbName: 'artifyai', bufferCommands: false
        });

    cached.conn = await cached.promise;

    return cached.conn;
}