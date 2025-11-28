/**
 * Screening Recommendation Rules
 * Extracted from Zimam Engine Example 1 & 2
 */

import { RecommendationRule } from '../types';

export const screeningRules: RecommendationRule[] = [
  // Blood Pressure Screening
  // Example 1: Male, 37 years, overweight - recommended annually for 18-39 with risk factors
  {
    key: 'blood-pressure-screening',
    name: {
      en: 'Blood Pressure Screening',
      ar: 'فحص ضغط الدم',
    },
    category: 'screening',
    gender: 'all',
    ageRange: { min: 18, max: 39 },
    requiredConditions: ['overweight', 'obesity', 'diabetes-mellitus', 'physical-inactivity'],
    articulation: {
      template: {
        en: 'It is recommended to do this screening annually for all adults aged 18-39 years who have risk factors such as overweight',
        ar: 'يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 18-39 عامًا ولديهم عوامل خطورة مثل زيادة الوزن',
      },
    },
  },
  // Blood Pressure Screening for 40+
  {
    key: 'blood-pressure-screening-40plus',
    name: {
      en: 'Blood Pressure Screening',
      ar: 'فحص ضغط الدم',
    },
    category: 'screening',
    gender: 'all',
    ageRange: { min: 40 },
    articulation: {
      template: {
        en: 'It is recommended to do this screening annually for all adults aged 40 years or older',
        ar: 'يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 40 عامًا فأكثر',
      },
    },
  },

  // Diabetes Screening
  // Example 1: Male, 37 years, overweight + physical inactivity - recommended for 18+ with overweight + risk factors
  {
    key: 'diabetes-screening',
    name: {
      en: 'Diabetes Screening',
      ar: 'فحص السكري',
    },
    category: 'screening',
    gender: 'all',
    ageRange: { min: 18 },
    requiresAllConditions: ['overweight'],
    requiredConditions: ['physical-inactivity', 'hypertension', 'cholesterol'],
    articulation: {
      template: {
        en: 'It is recommended to do this screening annually for all adults aged 18 years or older who have overweight with additional risk factors such as physical inactivity',
        ar: 'يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولديهم زيادة وزن مع عوامل خطورة إضافية مثل قلة النشاط البدني',
      },
    },
  },
  // Diabetes Screening for obesity
  {
    key: 'diabetes-screening-obesity',
    name: {
      en: 'Diabetes Screening',
      ar: 'فحص السكري',
    },
    category: 'screening',
    gender: 'all',
    ageRange: { min: 18 },
    requiredConditions: ['obesity'],
    articulation: {
      template: {
        en: 'It is recommended to do this screening annually for all adults aged 18 years or older who have obesity',
        ar: 'يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولديهم سمنة',
      },
    },
  },
  // Diabetes Screening for 35+ (general)
  {
    key: 'diabetes-screening-35plus',
    name: {
      en: 'Diabetes Screening',
      ar: 'فحص السكري',
    },
    category: 'screening',
    gender: 'all',
    ageRange: { min: 35 },
    articulation: {
      template: {
        en: 'It is recommended to do this screening every 3 years for all adults aged 35 years or older',
        ar: 'يوصى بإجراء هذا الفحص كل 3 سنوات لجميع البالغين الذين أعمارهم 35 عامًا فأكثر',
      },
    },
  },

  // Colorectal Cancer Screening
  // Zimam: Adults 45-75, annually for stool-based tests
  {
    key: 'colorectal-cancer-screening',
    name: {
      en: 'Colorectal Cancer Screening',
      ar: 'فحص سرطان القولون والمستقيم',
    },
    category: 'screening',
    gender: 'all',
    ageRange: { min: 45, max: 75 },
    articulation: {
      template: {
        en: 'It is recommended to do this screening annually for all adults aged 50-75 years',
        ar: 'يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 50-75 عامًا',
      },
      intervalNote: {
        en: 'interval may vary based on used method',
        ar: 'قد تختلف الفترة حسب الطريقة المستخدمة',
      },
    },
  },

  // Cervical Cancer Screening
  // Zimam: Women 21-65 who have ever had sexual contact, every 3 years
  {
    key: 'cervical-cancer-screening',
    name: {
      en: 'Cervical Cancer Screening',
      ar: 'فحص سرطان عنق الرحم',
    },
    category: 'screening',
    gender: 'female',
    ageRange: { min: 21, max: 65 },
    requiredConditions: ['sexual-history'],
    articulation: {
      template: {
        en: 'It is recommended to do this screening every 3-4 years for all women aged 30-65 years who have ever had sexual contact',
        ar: 'يوصى بإجراء هذا الفحص كل 3-4 سنوات لجميع النساء اللواتي أعمارهن 30-65 عامًا وقد سبق لهن الاتصال الجنسي',
      },
      intervalNote: {
        en: 'interval may vary based on used method',
        ar: 'قد تختلف الفترة حسب الطريقة المستخدمة',
      },
    },
  },

  // Breast Cancer Screening
  // Example 2: Female, 53 years - recommended for women 40-69
  {
    key: 'breast-cancer-screening',
    name: {
      en: 'Breast Cancer Screening',
      ar: 'فحص سرطان الثدي',
    },
    category: 'screening',
    gender: 'female',
    ageRange: { min: 40, max: 69 },
    articulation: {
      template: {
        en: 'It is recommended to do this screening for all women aged 40-69 years',
        ar: 'يوصى بإجراء هذا الفحص لجميع النساء اللواتي أعمارهن 40-69 عامًا',
      },
    },
  },

  // Osteoporosis Screening
  // Zimam: Women 65+
  {
    key: 'osteoporosis-screening',
    name: {
      en: 'Osteoporosis Screening',
      ar: 'فحص هشاشة العظام',
    },
    category: 'screening',
    gender: 'female',
    ageRange: { min: 65 },
    articulation: {
      template: {
        en: 'It is recommended to do this screening for all women aged 65 years or older',
        ar: 'يوصى بإجراء هذا الفحص لجميع النساء اللواتي أعمارهن 65 عامًا فأكثر',
      },
    },
  },

  // STIs Screening
  // Zimam: Sexually active adults
  {
    key: 'stis-screening',
    name: {
      en: 'STIs Screening',
      ar: 'فحص الأمراض المنقولة جنسياً',
    },
    category: 'screening',
    gender: 'all',
    ageRange: { min: 18 },
    requiredConditions: ['sexual-history'],
    articulation: {
      template: {
        en: 'It is recommended to do this screening for sexually active adults',
        ar: 'يوصى بإجراء هذا الفحص للبالغين النشطين جنسياً',
      },
    },
  },
];
