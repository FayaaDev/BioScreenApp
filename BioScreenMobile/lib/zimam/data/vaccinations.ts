/**
 * Vaccination Recommendation Rules
 * Extracted from Zimam Engine Example 1 & 2
 */

import { RecommendationRule } from '../types';

export const vaccinationRules: RecommendationRule[] = [
  // Influenza Vaccination
  // Example 1 & 2: All adults 18+ - recommended annually
  {
    key: 'influenza-vaccination',
    name: {
      en: 'Influenza Vaccination',
      ar: 'تطعيم الإنفلونزا الموسمية',
    },
    category: 'vaccination',
    gender: 'all',
    ageRange: { min: 18 },
    articulation: {
      template: {
        en: 'It is recommended to get this vaccination annually for all adults aged 18 years or older',
        ar: 'يوصى بأخذ هذا التطعيم سنويًا لجميع البالغين الذين أعمارهم 18 عامًا فأكثر',
      },
    },
  },

  // Pneumococcal Vaccination - for smokers
  // Example 1: Male, 37 years, smoking - recommended for 18-64 with risk factors like smoking
  {
    key: 'pneumococcal-vaccination-smoker',
    name: {
      en: 'Pneumococcal Vaccination',
      ar: 'تطعيم المكورات الرئوية',
    },
    category: 'vaccination',
    gender: 'all',
    ageRange: { min: 18, max: 64 },
    requiredConditions: ['smoking'],
    articulation: {
      template: {
        en: 'It is recommended to get this vaccination for all adults aged 18-64 years who have risk factors such as tobacco smoking',
        ar: 'يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18-64 عامًا ولديهم عوامل خطورة مثل تدخين التبغ',
      },
    },
  },

  // Pneumococcal Vaccination - for diabetics
  // Example 2: Female, 53 years, diabetes - recommended for 18-64 with risk factors like diabetes
  {
    key: 'pneumococcal-vaccination-diabetes',
    name: {
      en: 'Pneumococcal Vaccination',
      ar: 'تطعيم المكورات الرئوية',
    },
    category: 'vaccination',
    gender: 'all',
    ageRange: { min: 18, max: 64 },
    requiredConditions: ['diabetes-mellitus'],
    articulation: {
      template: {
        en: 'It is recommended to get this vaccination for all adults aged 18-64 years who have risk factors such as diabetes disease',
        ar: 'يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18-64 عامًا ولديهم عوامل خطورة مثل داء السكري',
      },
    },
  },

  // Pneumococcal Vaccination - for 65+
  {
    key: 'pneumococcal-vaccination-65plus',
    name: {
      en: 'Pneumococcal Vaccination',
      ar: 'تطعيم المكورات الرئوية',
    },
    category: 'vaccination',
    gender: 'all',
    ageRange: { min: 65 },
    articulation: {
      template: {
        en: 'It is recommended to get this vaccination for all adults aged 65 years or older',
        ar: 'يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 65 عامًا فأكثر',
      },
    },
  },

  // Tdap Vaccination
  // Example 1 & 2: All adults 18+ - recommended every 10 years
  {
    key: 'tdap-vaccination',
    name: {
      en: 'Tetanus, Diphtheria, and Pertussis (Tdap) Vaccination',
      ar: 'تطعيم الكزاز والدفتيريا والسعال الديكي',
    },
    category: 'vaccination',
    gender: 'all',
    ageRange: { min: 18 },
    articulation: {
      template: {
        en: 'It is recommended to get this vaccination every 10 years for all adults aged 18 years or older who have not been vaccinated in the past 10 years',
        ar: 'يوصى بأخذ هذا التطعيم كل 10 سنوات لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يتلقوا التطعيم خلال الـ 10 سنوات الماضية',
      },
    },
  },

  // Zoster (Shingles) Vaccination
  // Example 2: Female, 53 years - recommended for 50+
  {
    key: 'zoster-vaccination',
    name: {
      en: 'Herpes Zoster (Shingles) Vaccination',
      ar: 'تطعيم الحزام الناري',
    },
    category: 'vaccination',
    gender: 'all',
    ageRange: { min: 50 },
    articulation: {
      template: {
        en: 'It is recommended to get this vaccination for all adults aged 50 years or older',
        ar: 'يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 50 عامًا فأكثر',
      },
    },
  },

  // Varicella (Chickenpox) Vaccination
  // Example 1 & 2: All adults 18+ without previous vaccination or immunity
  {
    key: 'varicella-vaccination',
    name: {
      en: 'Varicella (Chickenpox) Vaccination',
      ar: 'تطعيم الجدري المائي',
    },
    category: 'vaccination',
    gender: 'all',
    ageRange: { min: 18 },
    articulation: {
      template: {
        en: 'It is recommended to get this vaccination for all adults aged 18 years or older who have no previous vaccination or evidence of immunity',
        ar: 'يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يسبق لهم التطعيم أو ليس لديهم ما يثبت المناعة',
      },
    },
  },

  // Hepatitis B Vaccination
  // Example 1: All adults 18+ without previous vaccination or immunity
  {
    key: 'hepatitis-b-vaccination',
    name: {
      en: 'Hepatitis B Vaccination',
      ar: 'تطعيم التهاب الكبد ب',
    },
    category: 'vaccination',
    gender: 'all',
    ageRange: { min: 18 },
    articulation: {
      template: {
        en: 'It is recommended to get this vaccination for all adults aged 18 years or older who have no previous vaccination or evidence of immunity',
        ar: 'يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يسبق لهم التطعيم أو ليس لديهم ما يثبت المناعة',
      },
    },
  },

  // MMR Vaccination
  // Example 1: All adults 18+ without previous vaccination or immunity
  {
    key: 'mmr-vaccination',
    name: {
      en: 'Measles, Mumps, and Rubella (MMR) Vaccination',
      ar: 'تطعيم الحصبة والنكاف والحصبة الألمانية',
    },
    category: 'vaccination',
    gender: 'all',
    ageRange: { min: 18 },
    articulation: {
      template: {
        en: 'It is recommended to get this vaccination for all adults aged 18 years or older who have no previous vaccination or evidence of immunity',
        ar: 'يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يسبق لهم التطعيم أو ليس لديهم ما يثبت المناعة',
      },
    },
  },
];
