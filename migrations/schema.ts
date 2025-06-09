import { pgTable, serial, integer, text, varchar, boolean, unique, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



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
	isDiabetic: boolean("is_diabetic").default(false),
	isHypertensive: boolean("is_hypertensive").default(false),
	isSmoker: boolean("is_smoker").default(false),
	smokingAmount: text("smoking_amount"),
	smokingDuration: text("smoking_duration"),
	height: text(),
	weight: text(),
	isPregnant: boolean("is_pregnant").default(false),
	isSexuallyActive: boolean("is_sexually_active").default(false),
	sexualPartnerCount: varchar("sexual_partner_count", { length: 10 }),
});

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
	specialCode: text("special_code"),
});

export const familyMembers = pgTable("family_members", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: text().notNull(),
	relationship: text().notNull(),
	gender: varchar({ length: 10 }).notNull(),
	dateOfBirth: text("date_of_birth").notNull(),
	createdAt: text("created_at").notNull(),
	isDiabetic: boolean("is_diabetic").default(false),
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

export const adminUsers = pgTable("admin_users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lastLogin: timestamp("last_login", { mode: 'string' }),
}, (table) => [
	unique("admin_users_username_unique").on(table.username),
]);

export const educationalContent = pgTable("educational_content", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	category: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});
