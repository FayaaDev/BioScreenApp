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
];
