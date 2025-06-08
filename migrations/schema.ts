import { pgTable, serial, text, integer, boolean, unique, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const screenings = pgTable("screenings", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	genderApplicable: text("gender_applicable").notNull(),
	startAge: integer("start_age").notNull(),
	endAge: integer("end_age"),
	frequencyYears: integer("frequency_years").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	iconUrl: text("icon_url"),
	priority: text().default('recommended').notNull(),
});

export const userScreenings = pgTable("user_screenings", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	screeningId: integer("screening_id").notNull(),
	lastCompleted: text("last_completed"),
	nextDue: text("next_due").notNull(),
	status: text().notNull(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	password: text().default('temp_password').notNull(),
	gender: varchar({ length: 10 }).notNull(),
	dateOfBirth: text("date_of_birth").notNull(),
	isAdmin: boolean("is_admin").default(false).notNull(),
	createdAt: text("created_at").notNull(),
	username: text(),
}, (table) => [
	unique("users_username_key").on(table.username),
]);

export const familyMembers = pgTable("family_members", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: text().notNull(),
	relationship: text().notNull(),
	gender: varchar({ length: 10 }).notNull(),
	dateOfBirth: text("date_of_birth").notNull(),
	createdAt: text("created_at").notNull(),
});

export const familyMemberScreenings = pgTable("family_member_screenings", {
	id: serial().primaryKey().notNull(),
	familyMemberId: integer("family_member_id").notNull(),
	screeningId: integer("screening_id").notNull(),
	lastCompleted: text("last_completed"),
	nextDue: text("next_due").notNull(),
	status: text().notNull(),
	createdAt: text("created_at").notNull(),
});
