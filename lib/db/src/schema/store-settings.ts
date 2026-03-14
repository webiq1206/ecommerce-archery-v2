import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storeSettingsTable = pgTable("store_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertStoreSettingSchema = createInsertSchema(storeSettingsTable).omit({ id: true });
export type InsertStoreSetting = z.infer<typeof insertStoreSettingSchema>;
export type StoreSetting = typeof storeSettingsTable.$inferSelect;
