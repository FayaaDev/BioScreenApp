import "dotenv/config";
import { db } from "../db";
import { screenings } from "@shared/schema";
import { eq } from "drizzle-orm";

const updates = [
    // Screenings
    {
        name: "Blood Pressure Screening",
        key: "blood-pressure-screening",
        articulation: {
            text: {
                en: "It is recommended to do this screening annually for all adults aged 18-39 years who have risk factors such as overweight",
                ar: "يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 18-39 عامًا ولديهم عوامل خطورة مثل زيادة الوزن"
            },
            intervalNote: ""
        }
    },
    {
        name: "Diabetes Screening",
        key: "diabetes-screening",
        articulation: {
            text: {
                en: "It is recommended to do this screening annually for all adults aged 18 years or older who have overweight with additional risk factors such as physical inactivity",
                ar: "يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولديهم زيادة وزن مع عوامل خطورة إضافية مثل قلة النشاط البدني"
            },
            intervalNote: ""
        }
    },
    {
        name: "Colorectal Cancer Screening",
        key: "colorectal-cancer-screening",
        articulation: {
            text: {
                en: "It is recommended to do this screening annually for all adults aged 50-75 years",
                ar: "يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 50-75 عامًا"
            },
            intervalNote: {
                en: "interval may vary based on used method",
                ar: "قد تختلف الفترة حسب الطريقة المستخدمة"
            }
        }
    },
    {
        name: "Cervical Cancer Screening",
        key: "cervical-cancer-screening",
        articulation: {
            text: {
                en: "It is recommended to do this screening every 3-4 years for all women aged 30-65 years who have ever had sexual contact",
                ar: "يوصى بإجراء هذا الفحص كل 3-4 سنوات لجميع النساء اللواتي أعمارهن 30-65 عامًا وقد سبق لهن الاتصال الجنسي"
            },
            intervalNote: {
                en: "interval may vary based on used method",
                ar: "قد تختلف الفترة حسب الطريقة المستخدمة"
            }
        }
    },
    {
        name: "Breast Cancer Screening",
        key: "breast-cancer-screening",
        articulation: {
            text: {
                en: "It is recommended to do this screening for all women aged 40-69 years",
                ar: "يوصى بإجراء هذا الفحص لجميع النساء اللواتي أعمارهن 40-69 عامًا"
            },
            intervalNote: ""
        }
    },

    // Counselings
    {
        name: "Smoking Cessation Counseling",
        key: "smoking-counseling",
        articulation: {
            text: {
                en: "It is recommended to have this counseling for all adults aged 18 years or older who use tobacco products",
                ar: "يوصى بالحصول على هذه المشورة لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ويستخدمون منتجات التبغ"
            },
            intervalNote: ""
        }
    },
    {
        name: "Obesity Behavioral Counseling",
        key: "obesity-counseling",
        articulation: {
            text: {
                en: "It is recommended to have this counseling for all adults aged 18 years or older who have a body mass index of 30 or greater",
                ar: "يوصى بالحصول على هذه المشورة لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولديهم مؤشر كتلة جسم 30 أو أكثر"
            },
            intervalNote: ""
        }
    },

    // Vaccinations
    {
        name: "Influenza Vaccination",
        key: "influenza-vaccination",
        articulation: {
            text: {
                en: "It is recommended to get this vaccination annually for all adults aged 18 years or older",
                ar: "يوصى بأخذ هذا التطعيم سنويًا لجميع البالغين الذين أعمارهم 18 عامًا فأكثر"
            },
            intervalNote: ""
        }
    },
    {
        name: "Pneumococcal Vaccination",
        key: "pneumococcal-vaccination",
        articulation: {
            text: {
                en: "It is recommended to get this vaccination for all adults aged 18-64 years who have risk factors",
                ar: "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18-64 عامًا ولديهم عوامل خطورة"
            },
            intervalNote: ""
        }
    },
    {
        name: "Tetanus, Diphtheria, and Pertussis (Tdap) Vaccination",
        key: "tdap-vaccination",
        articulation: {
            text: {
                en: "It is recommended to get this vaccination every 10 years for all adults aged 18 years or older who have not been vaccinated in the past 10 years",
                ar: "يوصى بأخذ هذا التطعيم كل 10 سنوات لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يتلقوا التطعيم خلال الـ 10 سنوات الماضية"
            },
            intervalNote: ""
        }
    },
    {
        name: "Varicella (Chickenpox) Vaccination",
        key: "varicella-vaccination",
        articulation: {
            text: {
                en: "It is recommended to get this vaccination for all adults aged 18 years or older who have no previous vaccination or evidence of immunity",
                ar: "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يسبق لهم التطعيم أو ليس لديهم ما يثبت المناعة"
            },
            intervalNote: ""
        }
    },
    {
        name: "Hepatitis B Vaccination",
        key: "hepatitis-b-vaccination",
        articulation: {
            text: {
                en: "It is recommended to get this vaccination for all adults aged 18 years or older who have no previous vaccination or evidence of immunity",
                ar: "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يسبق لهم التطعيم أو ليس لديهم ما يثبت المناعة"
            },
            intervalNote: ""
        }
    },
    {
        name: "Measles, Mumps, and Rubella (MMR) Vaccination",
        key: "mmr-vaccination",
        articulation: {
            text: {
                en: "It is recommended to get this vaccination for all adults aged 18 years or older who have no previous vaccination or evidence of immunity",
                ar: "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يسبق لهم التطعيم أو ليس لديهم ما يثبت المناعة"
            },
            intervalNote: ""
        }
    },
    {
        name: "Herpes Zoster (Shingles) Vaccination",
        key: "zoster-vaccination",
        articulation: {
            text: {
                en: "It is recommended to get this vaccination for all adults aged 50 years or older",
                ar: "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 50 عامًا فأكثر"
            },
            intervalNote: ""
        }
    }
];

function getCategory(key: string): string {
    if (key.includes('vaccination')) return 'Vaccinations';
    if (key.includes('counseling')) return 'Counseling';
    return 'Screening';
}

async function seed() {
    console.log("Starting seed...");

    const allScreenings = await db.query.screenings.findMany();

    for (const update of updates) {
        // Find matching screening
        const match = allScreenings.find(s => s.name.toLowerCase().includes(update.name.toLowerCase()) || update.name.toLowerCase().includes(s.name.toLowerCase()));

        if (match) {
            console.log(`Updating ${match.name} with key ${update.key}`);
            await db.update(screenings)
                .set({
                    key: update.key,
                    articulation: JSON.stringify(update.articulation)
                })
                .where(eq(screenings.id, match.id));
        } else {
            console.log(`Creating new screening: ${update.name}`);
            // Create new screening if not found
            // We need to provide default values for required fields
            await db.insert(screenings).values({
                name: update.name,
                description: update.articulation.text.en, // Use articulation as description
                category: getCategory(update.key),
                genderApplicable: "both", // Default, needs refinement
                startAge: 18, // Default
                frequencyYears: 1, // Default
                isActive: true,
                key: update.key,
                articulation: JSON.stringify(update.articulation)
            });
        }
    }

    console.log("Seed completed.");
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
