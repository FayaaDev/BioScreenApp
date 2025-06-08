import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // Will store hashed password
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
});
