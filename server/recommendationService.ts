import { db } from "./db";
import { screenings, userScreenings, type User, type Screening } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface Articulation {
    text: {
        en: string;
        ar: string;
    };
    intervalNote?: {
        en: string;
        ar: string;
    } | string;
}

interface RecommendationItem {
    key: string;
    name: {
        en: string;
        ar: string;
    };
    category: string;
    articulation: Articulation;
}

interface GroupedRecommendation {
    key: string;
    name: {
        en: string;
        ar: string;
    };
    recs: RecommendationItem[];
}

interface RecommendationResponse {
    groupedRecs: GroupedRecommendation[];
}

export class RecommendationService {
    private static instance: RecommendationService;

    private constructor() { }

    static getInstance(): RecommendationService {
        if (!RecommendationService.instance) {
            RecommendationService.instance = new RecommendationService();
        }
        return RecommendationService.instance;
    }

    async getRecommendations(user: User): Promise<RecommendationResponse> {
        const allScreenings = await db.query.screenings.findMany({
            where: eq(screenings.isActive, true),
        });

        const userScreeningRecords = await db.query.userScreenings.findMany({
            where: eq(userScreenings.userId, user.id),
        });

        const relevantScreenings = this.filterRelevantScreenings(user, allScreenings);

        // Filter out completed screenings if needed, or keep them but mark status.
        // The requirement says "reveal recommendations... check it as completed so it will move to the completed section"
        // So we should return items that are NOT completed.

        const activeScreenings = relevantScreenings.filter(s => {
            const record = userScreeningRecords.find(us => us.screeningId === s.id);
            return !record || record.status !== 'completed';
        });

        return this.groupRecommendations(activeScreenings);
    }

    private filterRelevantScreenings(user: User, allScreenings: Screening[]): Screening[] {
        const userAge = new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear();

        return allScreenings.filter(screening => {
            // 1. Gender check
            if (screening.genderApplicable !== 'both' && screening.genderApplicable !== user.gender) {
                return false;
            }

            // 2. Age check
            if (userAge < screening.startAge) return false;
            if (screening.endAge !== null && userAge > screening.endAge) return false;

            // 3. Special codes / Risk factors
            if (screening.specialCode === "SMK" && !user.isSmoker) return false;
            if (screening.specialCode === "PRG" && !user.isPregnant) return false;
            if (screening.specialCode === "SEX" && user.sexualPartnerCount === "single") return false;

            if (screening.specialCode === "BMI_DM" && user.height && user.weight) {
                const bmi = this.calculateBMI(user.height, user.weight);
                if (bmi <= 24.9) return false;
            }

            if (screening.specialCode === "LungCa") {
                if (!user.isSmoker || !user.smokingAmount || !user.smokingDuration) return false;
                const packYears = (parseFloat(user.smokingAmount) * parseFloat(user.smokingDuration)) / 20; // Assuming amount is cigs/day? Or packs? 
                // Logic in routes.ts was: parseFloat(userData.smokingAmount) * parseFloat(userData.smokingDuration) < 20
                // Let's stick to existing logic for now, assuming input is consistent.
                if (parseFloat(user.smokingAmount) * parseFloat(user.smokingDuration) < 20) return false;
            }

            if (screening.specialCode === "RF") {
                if (!user.isDiabetic && !user.isHypertensive && !user.isCholesterol && !user.isSmoker) return false;
            }

            if (screening.specialCode === "BMI_OB" && user.height && user.weight) {
                const bmi = this.calculateBMI(user.height, user.weight);
                if (bmi <= 29.9) return false;
            }

            return true;
        });
    }

    private groupRecommendations(screenings: Screening[]): RecommendationResponse {
        const groups: Record<string, GroupedRecommendation> = {
            screening: {
                key: 'screening',
                name: { en: 'Screenings', ar: 'الفحوصات' },
                recs: []
            },
            counseling: {
                key: 'counseling',
                name: { en: 'Counselings', ar: 'المشورات' },
                recs: []
            },
            vaccination: {
                key: 'vaccination',
                name: { en: 'Vaccinations', ar: 'التطعيمات' },
                recs: []
            }
        };

        for (const s of screenings) {
            const category = s.category.toLowerCase();
            const groupKey = this.mapCategoryToGroup(category);

            if (groups[groupKey]) {
                groups[groupKey].recs.push(this.mapScreeningToRecommendation(s));
            }
        }

        return {
            groupedRecs: Object.values(groups).filter(g => g.recs.length > 0)
        };
    }

    private mapCategoryToGroup(category: string): string {
        if (category.includes('vaccin')) return 'vaccination';
        if (category.includes('counsel')) return 'counseling';
        return 'screening';
    }

    private mapScreeningToRecommendation(s: Screening): RecommendationItem {
        // Parse articulation if it exists, otherwise generate default
        let articulation: Articulation;
        try {
            articulation = s.articulation ? JSON.parse(s.articulation) : this.generateDefaultArticulation(s);
        } catch (e) {
            articulation = this.generateDefaultArticulation(s);
        }

        return {
            key: s.key || `screening-${s.id}`,
            name: {
                en: s.name,
                ar: s.name // Ideally this should be localized in DB
            },
            category: this.mapCategoryToGroup(s.category),
            articulation
        };
    }

    private generateDefaultArticulation(s: Screening): Articulation {
        return {
            text: {
                en: s.description,
                ar: s.description
            },
            intervalNote: ""
        };
    }

    private calculateBMI(heightStr: string, weightStr: string): number {
        const height = parseFloat(heightStr);
        const weight = parseFloat(weightStr);
        if (!height || !weight) return 0;
        return weight / Math.pow(height / 100, 2);
    }
}
