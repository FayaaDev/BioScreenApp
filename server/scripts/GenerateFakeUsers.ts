import 'dotenv/config';
import { db } from "../db";
import { users } from "@shared/schema";
import { faker } from "@faker-js/faker";

async function generateTestUsers(count: number = 10) {
  const testUsers = [];

  for (let i = 0; i < count; i++) {
    const gender = faker.helpers.arrayElement(["male", "female"]);
    const dateOfBirth = faker.date.between({
      from: "1960-01-01",
      to: "1992-12-31"
    }).toISOString().split("T")[0];

    const user = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: "$2b$10$8tmUHETRr7Dku7rNeMQKm.64ZjRvKVKVJi4iOT9PWCd9g35k0sNVu", // Default password for test users
      gender,
      dateOfBirth,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      // Medical survey fields with random values
      isDiabetic: faker.datatype.boolean(),
      isHypertensive: faker.datatype.boolean(),
      isCholesterol: faker.datatype.boolean(),
      isSmoker: faker.datatype.boolean(),
      smokingAmount: faker.datatype.boolean() ? faker.helpers.arrayElement(["1-5", "6-10", "10+"]) : null,
      smokingDuration: faker.datatype.boolean() ? faker.helpers.arrayElement(["1-5 years", "6-10 years", "10+ years"]) : null,
      height: faker.number.int({ min: 150, max: 200 }).toString(),
      weight: faker.number.int({ min: 45, max: 120 }).toString(),
      isPregnant: gender === "female" ? faker.datatype.boolean() : false,
      isSexuallyActive: faker.datatype.boolean(),
      sexualPartnerCount: faker.datatype.boolean() ? faker.helpers.arrayElement(["0", "1", "2-5", "5+"]) : null,
    };

    testUsers.push(user);
  }

  try {
    const insertedUsers = await db.insert(users).values(testUsers).returning();
    console.log(`Successfully created ${insertedUsers.length} test users`);
    return insertedUsers;
  } catch (error) {
    console.error("Error creating test users:", error);
    throw error;
  }
}

// Run the script
generateTestUsers()
  .then(() => {
    console.log("Test user generation completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });