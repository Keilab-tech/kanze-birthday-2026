import { eq } from "drizzle-orm";
import { db } from "./db";
import { mediaFiles } from "../shared/schema";
import type { InsertMediaFile, MediaFile } from "../shared/schema";

export interface IStorage {
  getMediaByFolder(folder: string): Promise<MediaFile[]>;
  addMedia(file: InsertMediaFile): Promise<MediaFile>;
  deleteMedia(id: number): Promise<void>;
}

class DatabaseStorage implements IStorage {
  async getMediaByFolder(folder: string): Promise<MediaFile[]> {
    return db.select().from(mediaFiles).where(eq(mediaFiles.folder, folder));
  }

  async addMedia(file: InsertMediaFile): Promise<MediaFile> {
    const [result] = await db.insert(mediaFiles).values(file).returning();
    return result;
  }

  async deleteMedia(id: number): Promise<void> {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
  }
}

export const storage = new DatabaseStorage();
