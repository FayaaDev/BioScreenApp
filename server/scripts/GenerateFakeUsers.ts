import 'dotenv/config';
import { db } from "../db";
import { users } from "@shared/schema";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import { storage } from "../storage";

async function generateTestUsers(count: number = 3) {
  const testUsers = [];

  for (let i = 0; i < count; i++) {
    const gender = faker.helpers.arrayElement(["male", "female"]);
    const dateOfBirth = faker.date.between({
      from: "1960-01-01",
      to: "1992-12-31"
    }).toISOString().split("T")[0];

    // Generate random medical conditions
    const isSmoker = faker.datatype.boolean();
    const isSexuallyActive = faker.datatype.boolean();
    const isPregnant = gender === "female" ? faker.datatype.boolean() : false;

    // Create user data matching the manual signup flow structure
    const userData = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: await bcrypt.hash("test123", 10), // Hash password like in manual signup
      gender,
      dateOfBirth,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      // Medical survey fields
      isDiabetic: faker.datatype.boolean(),
      isHypertensive: faker.datatype.boolean(),
      isCholesterol: faker.datatype.boolean(),
      isSmoker,
      smokingAmount: isSmoker ? faker.helpers.arrayElement(["1-5", "6-10", "10+"]) : null,
      smokingDuration: isSmoker ? faker.helpers.arrayElement(["1-5 years", "6-10 years", "10+ years"]) : null,
      height: faker.number.int({ min: 150, max: 200 }).toString(),
      weight: faker.number.int({ min: 45, max: 120 }).toString(),
      isPregnant,
      isSexuallyActive,
      sexualPartnerCount: isSexuallyActive ? faker.helpers.arrayElement(["single", "multiple"]) : null,
    };

    testUsers.push(userData);
  }

  try {
    // Create users and generate their screenings
    for (const userData of testUsers) {
      const user = await storage.createUser(userData);
      
      // Generate screenings for the user (same logic as in manual signup)
      const screenings = await storage.getScreenings();
      const userAge = new Date().getFullYear() - new Date(userData.dateOfBirth).getFullYear();
      
      for (const screening of screenings) {
        // Check if screening applies to this user's gender and age range
        const genderMatches = screening.genderApplicable === "both" || screening.genderApplicable === userData.gender;
        const withinAgeRange = screening.endAge === null || userAge <= screening.endAge;
        
        // Skip SMK screenings for non-smokers
        if (screening.specialCode === "SMK" && !userData.isSmoker) {
          continue;
        }

        // Skip PRG screenings for non-Pregnant women
        if (screening.specialCode === "PRG" && !userData.isPregnant) {
          continue;
        }

        // Skip STD screenings for partners with a single spouse
        if (screening.specialCode === "SEX" && userData.sexualPartnerCount === "single") {
          continue;
        }

        // Skip Diabetes screening for users with BMI <= 24.9
        if (screening.specialCode === "BMI_DM" && userData.height && userData.weight) {
          const userBMI = (parseFloat(userData.weight) / Math.pow(parseFloat(userData.height) / 100, 2));
          if (userBMI <= 24.9) {
            continue;
          }
        }

        // Skip Lung Cancer screening for non-smokers or non-heavy smokers
        if (
          screening.specialCode === "LungCa" &&
          (
            !userData.isSmoker ||
            !userData.smokingAmount ||
            !userData.smokingDuration ||
            (parseFloat(userData.smokingAmount) * parseFloat(userData.smokingDuration) < 20)
          )
        ) {
          continue;
        }

        // Skip Heart screening for medically free users
        if (
          screening.specialCode === "RF" &&
          !userData.isDiabetic &&
          !userData.isHypertensive &&
          !userData.isCholesterol &&
          !userData.isSmoker
        ) {
          continue;
        }

        // Skip Obesity screening for users with BMI <= 29.9
        if (screening.specialCode === "BMI_OB" && userData.height && userData.weight) {
          const userBMI = (parseFloat(userData.weight) / Math.pow(parseFloat(userData.height) / 100, 2));
          if (userBMI <= 29.9) {
            continue;
          }
        }

        if (genderMatches && withinAgeRange) {
          // Calculate next due date
          const birthDate = new Date(userData.dateOfBirth);
          const birthYear = birthDate.getFullYear();
          const currentYear = new Date().getFullYear();
          
          // Calculate the year when user turns the start age
          const targetYear = birthYear + screening.startAge;
          const nextDue = new Date(targetYear, 0, 1); // January 1st of target year
          
          // Determine status based on current date vs target date
          let status: "due" | "overdue" | "later";
          
          if (currentYear < targetYear) {
            status = "later";
          } else if (currentYear === targetYear || currentYear === targetYear + 1) {
            status = "due";
          } else {
            status = "overdue";
          }
          
          await storage.createUserScreening({
            userId: user.id,
            screeningId: screening.id,
            lastCompleted: null,
            nextDue: nextDue.toISOString(),
            status: status
          });
        }
      }
    }

    console.log(`Successfully created ${testUsers.length} test users with their screenings`);
    return testUsers;
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