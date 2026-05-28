import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const siteSettings = pgTable("site_settings", {
  id: serial().primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const translations = pgTable("translations", {
  id: serial().primaryKey(),
  lang: text("lang").notNull(),
  translationKey: text("translation_key").notNull(),
  translationValue: text("translation_value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
