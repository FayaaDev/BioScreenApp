*Note: This data structure is for prototype purposes only and is subject to change*

### Profile:

```json
{
  "version": "v1",
  "data": {
    "gender": "female",
    "birthDate": {
      "day": "1",
      "month": "1",
      "year": "1972"
    },
    "height": "160",
    "weight": "85",
    "conditions": [
      "physical-inactivity",
      "overweight",
      "hypertension",
      "diabetes-mellitus",
      "sexual-history",
      "obesity"
    ],
    "age": 53,
    "bmi": 33.2
  },
}
```

### Recommendations:

```json
{
  "groupedRecs": [
    {
      "key": "screening",
      "name": {
        "en": "Screenings",
        "ar": "الفحوصات"
      },
      "recs": [
        {
          "key": "colorectal-cancer-screening",
          "name": {
            "en": "Colorectal Cancer Screening",
            "ar": "فحص سرطان القولون والمستقيم"
          },
          "category": "screening",
          "articulation": {
            "text": {
              "en": "It is recommended to do this screening annually for all adults aged 50-75 years",
              "ar": "يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 50-75 عامًا"
            },
            "intervalNote": {
              "en": "interval may vary based on used method",
              "ar": "قد تختلف الفترة حسب الطريقة المستخدمة"
            }
          }
        },
        {
          "key": "cervical-cancer-screening",
          "name": {
            "en": "Cervical Cancer Screening",
            "ar": "فحص سرطان عنق الرحم"
          },
          "category": "screening",
          "articulation": {
            "text": {
              "en": "It is recommended to do this screening every 3-4 years for all women aged 30-65 years who have ever had sexual contact",
              "ar": "يوصى بإجراء هذا الفحص كل 3-4 سنوات لجميع النساء اللواتي أعمارهن 30-65 عامًا وقد سبق لهن الاتصال الجنسي"
            },
            "intervalNote": {
              "en": "interval may vary based on used method",
              "ar": "قد تختلف الفترة حسب الطريقة المستخدمة"
            }
          }
        },
        {
          "key": "breast-cancer-screening",
          "name": {
            "en": "Breast Cancer Screening",
            "ar": "فحص سرطان الثدي"
          },
          "category": "screening",
          "articulation": {
            "text": {
              "en": "It is recommended to do this screening for all women aged 40-69 years",
              "ar": "يوصى بإجراء هذا الفحص لجميع النساء اللواتي أعمارهن 40-69 عامًا"
            },
            "intervalNote": ""
          }
        }
      ]
    },
    {
      "key": "counseling",
      "name": {
        "en": "Counselings",
        "ar": "المشورات"
      },
      "recs": [
        {
          "key": "obesity-counseling",
          "name": {
            "en": "Obesity Behavioral Counseling",
            "ar": "المشورة السلوكية للسمنة"
          },
          "category": "counseling",
          "articulation": {
            "text": {
              "en": "It is recommended to have this counseling for all adults aged 18 years or older who have a body mass index of 30 or greater",
              "ar": "يوصى بالحصول على هذه المشورة لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولديهم مؤشر كتلة جسم 30 أو أكثر"
            },
            "intervalNote": ""
          }
        }
      ]
    },
    {
      "key": "vaccination",
      "name": {
        "en": "Vaccinations",
        "ar": "التطعيمات"
      },
      "recs": [
        {
          "key": "influenza-vaccination",
          "name": {
            "en": "Influenza Vaccination",
            "ar": "تطعيم الإنفلونزا الموسمية"
          },
          "category": "vaccination",
          "articulation": {
            "text": {
              "en": "It is recommended to get this vaccination annually for all adults aged 18 years or older",
              "ar": "يوصى بأخذ هذا التطعيم سنويًا لجميع البالغين الذين أعمارهم 18 عامًا فأكثر"
            },
            "intervalNote": ""
          }
        },
        {
          "key": "pneumococcal-vaccination",
          "name": {
            "en": "Pneumococcal Vaccination",
            "ar": "تطعيم المكورات الرئوية"
          },
          "category": "vaccination",
          "articulation": {
            "text": {
              "en": "It is recommended to get this vaccination for all adults aged 18-64 years who have risk factors such as diabetes disease",
              "ar": "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18-64 عامًا ولديهم عوامل خطورة مثل داء السكري"
            },
            "intervalNote": ""
          }
        },
        {
          "key": "tdap-vaccination",
          "name": {
            "en": "Tetanus, Diphtheria, and Pertussis (Tdap) Vaccination",
            "ar": "تطعيم الكزاز والدفتيريا والسعال الديكي"
          },
          "category": "vaccination",
          "articulation": {
            "text": {
              "en": "It is recommended to get this vaccination every 10 years for all adults aged 18 years or older who have not been vaccinated in the past 10 years",
              "ar": "يوصى بأخذ هذا التطعيم كل 10 سنوات لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يتلقوا التطعيم خلال الـ 10 سنوات الماضية"
            },
            "intervalNote": ""
          }
        },
        {
          "key": "zoster-vaccination",
          "name": {
            "en": "Herpes Zoster (Shingles) Vaccination",
            "ar": "تطعيم الحزام الناري"
          },
          "category": "vaccination",
          "articulation": {
            "text": {
              "en": "It is recommended to get this vaccination for all adults aged 50 years or older",
              "ar": "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 50 عامًا فأكثر"
            },
            "intervalNote": ""
          }
        },
        {
          "key": "varicella-vaccination",
          "name": {
            "en": "Varicella (Chickenpox) Vaccination",
            "ar": "تطعيم الجدري المائي"
          },
          "category": "vaccination",
          "articulation": {
            "text": {
              "en": "It is recommended to get this vaccination for all adults aged 18 years or older who have no previous vaccination or evidence of immunity",
              "ar": "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يسبق لهم التطعيم أو ليس لديهم ما يثبت المناعة"
            },
            "intervalNote": ""
          }
        },
        {
          "key": "hepatitis-b-vaccination",
          "name": {
            "en": "Hepatitis B Vaccination",
            "ar": "تطعيم التهاب الكبد ب"
          },
          "category": "vaccination",
          "articulation": {
            "text": {
              "en": "It is recommended to get this vaccination for all adults aged 18 years or older who have no previous vaccination or evidence of immunity",
              "ar": "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يسبق لهم التطعيم أو ليس لديهم ما يثبت المناعة"
            },
            "intervalNote": ""
          }
        },
        {
          "key": "mmr-vaccination",
          "name": {
            "en": "Measles, Mumps, and Rubella (MMR) Vaccination",
            "ar": "تطعيم الحصبة والنكاف والحصبة الألمانية"
          },
          "category": "vaccination",
          "articulation": {
            "text": {
              "en": "It is recommended to get this vaccination for all adults aged 18 years or older who have no previous vaccination or evidence of immunity",
              "ar": "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولم يسبق لهم التطعيم أو ليس لديهم ما يثبت المناعة"
            },
            "intervalNote": ""
          }
        }
      ]
    }
  ]
}
```