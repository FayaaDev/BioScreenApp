/**
 * Counseling Recommendation Rules
 * Extracted from Zimam Engine Example 1 & 2
 */

import { RecommendationRule } from '../types';

export const counselingRules: RecommendationRule[] = [
  // Smoking Cessation Counseling
  // Example 1: Male, 37 years, smoking - recommended for 18+ who use tobacco
  {
    key: 'smoking-counseling',
    name: {
      en: 'Smoking Cessation Counseling',
      ar: 'مشورة الإقلاع عن التدخين',
    },
    category: 'counseling',
    gender: 'all',
    ageRange: { min: 18 },
    requiredConditions: ['smoking'],
    articulation: {
      template: {
        en: 'It is recommended to have this counseling for all adults aged 18 years or older who use tobacco products',
        ar: 'يوصى بالحصول على هذه المشورة لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ويستخدمون منتجات التبغ',
      },
    },
  },

  // Obesity Behavioral Counseling
  // Example 2: Female, 53 years, BMI 33.2 (obesity) - recommended for 18+ with BMI >= 30
  {
    key: 'obesity-counseling',
    name: {
      en: 'Obesity Behavioral Counseling',
      ar: 'المشورة السلوكية للسمنة',
    },
    category: 'counseling',
    gender: 'all',
    ageRange: { min: 18 },
    requiredConditions: ['obesity'],
    articulation: {
      template: {
        en: 'It is recommended to have this counseling for all adults aged 18 years or older who have a body mass index of 30 or greater',
        ar: 'يوصى بالحصول على هذه المشورة لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولديهم مؤشر كتلة جسم 30 أو أكثر',
      },
    },
  },

  // Breastfeeding Counseling
  // Zimam: Pregnant women
  {
    key: 'breastfeeding-counseling',
    name: {
      en: 'Breastfeeding Counseling',
      ar: 'مشورة الرضاعة الطبيعية',
    },
    category: 'counseling',
    gender: 'female',
    ageRange: { min: 18 },
    requiredConditions: ['pregnant'],
    articulation: {
      template: {
        en: 'It is recommended to have this counseling for pregnant women to support breastfeeding',
        ar: 'يوصى بالحصول على هذه المشورة للنساء الحوامل لدعم الرضاعة الطبيعية',
      },
    },
  },

  // Fall Assessment Counseling
  // Zimam: Adults 65+
  {
    key: 'fall-assessment-counseling',
    name: {
      en: 'Fall Assessment Counseling',
      ar: 'مشورة تقييم خطر السقوط',
    },
    category: 'counseling',
    gender: 'all',
    ageRange: { min: 65 },
    articulation: {
      template: {
        en: 'It is recommended to have this counseling for all adults aged 65 years or older to assess and prevent fall risks',
        ar: 'يوصى بالحصول على هذه المشورة لجميع البالغين الذين أعمارهم 65 عامًا فأكثر لتقييم ومنع مخاطر السقوط',
      },
    },
  },

  // Oral Hygiene Counseling
  // Zimam: All adults
  {
    key: 'oral-hygiene-counseling',
    name: {
      en: 'Oral Hygiene Counseling',
      ar: 'مشورة صحة الفم',
    },
    category: 'counseling',
    gender: 'all',
    ageRange: { min: 18 },
    articulation: {
      template: {
        en: 'It is recommended to have this counseling for all adults to maintain good oral health',
        ar: 'يوصى بالحصول على هذه المشورة لجميع البالغين للحفاظ على صحة الفم',
      },
    },
  },

  // STIs Behavioral Counseling
  // Zimam: Sexually active adults
  {
    key: 'stis-behavioral-counseling',
    name: {
      en: 'STIs Behavioral Counseling',
      ar: 'المشورة السلوكية للأمراض المنقولة جنسياً',
    },
    category: 'counseling',
    gender: 'all',
    ageRange: { min: 18 },
    requiredConditions: ['sexual-history'],
    articulation: {
      template: {
        en: 'It is recommended to have this counseling for sexually active adults to prevent sexually transmitted infections',
        ar: 'يوصى بالحصول على هذه المشورة للبالغين النشطين جنسياً للوقاية من الأمراض المنقولة جنسياً',
      },
    },
  },

  // Sun Exposure and Vitamin D Deficiency Counseling
  // Zimam: All adults
  {
    key: 'sun-vitamin-d-counseling',
    name: {
      en: 'Sun Exposure and Vitamin D Counseling',
      ar: 'مشورة التعرض للشمس وفيتامين د',
    },
    category: 'counseling',
    gender: 'all',
    ageRange: { min: 18 },
    articulation: {
      template: {
        en: 'It is recommended to have this counseling for all adults regarding safe sun exposure and vitamin D sufficiency',
        ar: 'يوصى بالحصول على هذه المشورة لجميع البالغين بشأن التعرض الآمن للشمس وكفاية فيتامين د',
      },
    },
  },
];
