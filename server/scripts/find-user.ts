import "dotenv/config";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function findUser() {
    const user = await db.query.users.findFirst({
        where: eq(users.email, "test@example.com")
    });

    if (user) {
        console.log(`User found: ID ${user.id}`);
    } else {
        console.log("User not found");
    }
    process.exit(0);
}

findUser().catch(console.error);
