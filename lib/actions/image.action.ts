"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import User from "../database/models/user.model";
import Image from "../database/models/image.model";
import { redirect } from "next/navigation";
import { v2 as cloudinary } from 'cloudinary';
import { Document, Types } from "mongoose";

// Define explicit types for database models
interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  clerkId: string;
}

interface IImage extends Document {
  _id: Types.ObjectId;
  title: string;
  author: Types.ObjectId | IUser;
  publicId?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  color?: string;
  prompt?: string;
  [key: string]: unknown;
}

interface CloudinaryResource {
  public_id: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

interface ImageQueryParams {
  limit?: number;
  page?: number;
  searchQuery?: string;
}

interface UserImagesParams extends ImageQueryParams {
  userId: string;
}

// Typed version of populate function
const populateUser = (query: Document<unknown, {}, IImage>) => 
  query.populate<{ author: IUser }>({
    path: 'author',
    model: User,
    select: '_id firstName lastName clerkId'
  });

// Add image
export async function addImage({
  image, 
  userId, 
  path
}: {
  image: Partial<IImage>;
  userId: string;
  path: string;
}) {
  try {
    await connectToDatabase();

    const author = await User.findById(userId) as IUser;

    if (!author) {
      throw new Error("User not found");
    }

    const newImage = await Image.create({
      ...image,
      author: author._id,
    });

    revalidatePath(path);

    return JSON.parse(JSON.stringify(newImage));
  } catch (error) {
    handleError(error);
    return null;
  }
}

// Update image
export async function updateImage({
  image, 
  userId, 
  path
}: {
  image: IImage & { _id: string };
  userId: string;
  path: string;
}) {
  try {
    await connectToDatabase();

    const imageToUpdate = await Image.findById(image._id);

    if (!imageToUpdate || imageToUpdate.author.toString() !== userId) {
      throw new Error("Unauthorized or image not found");
    }

    const updatedImage = await Image.findByIdAndUpdate(
      imageToUpdate._id,
      image,
      { new: true }
    );

    revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedImage));
  } catch (error) {
    handleError(error);
    return null;
  }
}

// Delete image
export async function deleteImage(imageId: string) {
  try {
    await connectToDatabase();

    await Image.findByIdAndDelete(imageId);

  } catch (error) {
    handleError(error);
  } finally {
    redirect('/');
  }
}

// Get image by ID
export async function getImageById(imageId: string) {
  try {
    await connectToDatabase();

    const image = await populateUser(Image.findById(imageId) as Document<unknown, {}, IImage>);

    if (!image) throw new Error("Image not found");
    
    return JSON.parse(JSON.stringify(image));
  } catch (error) {
    handleError(error);
    return null;
  }
}

// Get all images
export async function getAllImages({
  limit = 9, 
  page = 1, 
  searchQuery = ''
}: ImageQueryParams) {
  try {
    await connectToDatabase();

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    let expression = 'folder=artifyai';

    if (searchQuery) {
      expression += ` AND ${searchQuery}`;
    }

    const { resources } = await cloudinary.search
      .expression(expression)
      .execute() as { resources: CloudinaryResource[] };

    const resourceIds = resources.map((resource) => resource.public_id);

    const query: Record<string, unknown> = searchQuery 
      ? { publicId: { $in: resourceIds } }
      : {};

    const skipAmount = (Number(page) - 1) * limit;

    const images = await populateUser(Image.find(query) as Document<unknown, {}, IImage>)
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const totalImages = await Image.find(query).countDocuments();
    const savedImages = await Image.find().countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPage: Math.ceil(totalImages / limit),
      savedImages,
    };
  } catch (error) {
    handleError(error);
    return null;
  }
}

// Get user images
export async function getUserImages({
  limit = 9,
  page = 1,
  userId,
}: UserImagesParams) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;

    const images = await populateUser(Image.find({ author: userId }) as Document<unknown, {}, IImage>)
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const totalImages = await Image.find({ author: userId }).countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPages: Math.ceil(totalImages / limit),
    };
  } catch (error) {
    handleError(error);
    return null;
  }
}