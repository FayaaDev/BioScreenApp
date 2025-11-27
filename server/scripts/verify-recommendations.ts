import "dotenv/config";
import { RecommendationService } from "../recommendationService";
import { User } from "@shared/schema";

// Mock user matching Example 1
const mockUser: User = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    password: "hashed_password",
    phoneNumber: null,
    gender: "male",
    dateOfBirth: "1988-01-01", // 37 years old
    isAdmin: false,
    createdAt: new Date().toISOString(),
    isDiabetic: false,
    isHypertensive: false,
    isCholesterol: false,
    isSmoker: true,
    smokingAmount: "20",
    smokingDuration: "10",
    height: "170",
    weight: "80", // BMI 27.7 (Overweight)
    isPregnant: false,
    isSexuallyActive: false,
    sexualPartnerCount: null
};

async function verify() {
    console.log("Verifying recommendations for user:", mockUser.gender, mockUser.dateOfBirth);

    const service = RecommendationService.getInstance();
    const result = await service.getRecommendations(mockUser);

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
