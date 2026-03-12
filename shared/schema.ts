import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  folder: text("folder").notNull(),
  url: text("url").notNull(),
  isVideo: boolean("is_video").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  createdAt: true,
});

export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;
