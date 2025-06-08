import { pgTable, text, serial, integer, boolean, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull().default("temp_password"),
  gender: varchar("gender", { length: 10 }).notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const screenings = pgTable("screenings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  genderApplicable: text("gender_applicable").notNull(), // 'male', 'female', 'both'
  startAge: integer("start_age").notNull(),
  endAge: integer("end_age"), // null means no end age
  frequencyYears: integer("frequency_years").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  iconUrl: text("icon_url"), // URL to uploaded icon
  priority: text("priority").notNull().default("recommended"), // 'strongly_recommended', 'recommended'
});

export const userScreenings = pgTable("user_screenings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  screeningId: integer("screening_id").notNull(),
  lastCompleted: text("last_completed"), // ISO date string or null
  nextDue: text("next_due").notNull(), // ISO date string
  status: text("status").notNull(), // 'overdue', 'due_soon', 'upcoming', 'completed'
});

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // The user who added this family member
  name: text("name").notNull(),
  relationship: text("relationship").notNull(), // 'father', 'mother', 'other'
  gender: varchar("gender", { length: 10 }).notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  createdAt: text("created_at").notNull(),
});

export const familyMemberScreenings = pgTable("family_member_screenings", {
  id: serial("id").primaryKey(),
  familyMemberId: integer("family_member_id").notNull(),
  screeningId: integer("screening_id").notNull(),
  lastCompleted: text("last_completed"), // ISO date string or null
  nextDue: text("next_due").notNull(), // ISO date string
  status: text("status").notNull(), // 'overdue', 'due_soon', 'upcoming', 'completed'
  createdAt: text("created_at").notNull(),
});

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
});

export const educationalContent = pgTable('educational_content', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertScreeningSchema = createInsertSchema(screenings).omit({
  id: true,
  isActive: true,
});

export const insertUserScreeningSchema = createInsertSchema(userScreenings).omit({
  id: true,
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  createdAt: true,
});

export const insertFamilyMemberScreeningSchema = createInsertSchema(familyMemberScreenings).omit({
  id: true,
  createdAt: true,
});

export const insertEducationalContentSchema = createInsertSchema(educationalContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Screening = typeof screenings.$inferSelect;
export type InsertScreening = z.infer<typeof insertScreeningSchema>;
export type UserScreening = typeof userScreenings.$inferSelect;
export type InsertUserScreening = z.infer<typeof insertUserScreeningSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMemberScreening = typeof familyMemberScreenings.$inferSelect;
export type InsertFamilyMemberScreening = z.infer<typeof insertFamilyMemberScreeningSchema>;
export type EducationalContent = typeof educationalContent.$inferSelect;
export type InsertEducationalContent = z.infer<typeof insertEducationalContentSchema>;
