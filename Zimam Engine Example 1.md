*Note: This data structure is for prototype purposes only and is subject to change*

### Profile:

```json
{
  "version": "v1",
  "data": {
    "gender": "male",
    "birthDate": {
      "day": "1",
      "month": "1",
      "year": "1988"
    },
    "height": "170",
    "weight": "80",
    "conditions": [
      "physical-inactivity",
      "smoking",
      "overweight"
    ],
    "age": 37,
    "bmi": 27.7
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
          "key": "blood-pressure-screening",
          "name": {
            "en": "Blood Pressure Screening",
            "ar": "فحص ضغط الدم"
          },
          "category": "screening",
          "articulation": {
            "text": {
              "en": "It is recommended to do this screening annually for all adults aged 18-39 years who have risk factors such as overweight",
              "ar": "يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 18-39 عامًا ولديهم عوامل خطورة مثل زيادة الوزن"
            },
            "intervalNote": ""
          }
        },
        {
          "key": "diabetes-screening",
          "name": {
            "en": "Diabetes Screening",
            "ar": "فحص السكري"
          },
          "category": "screening",
          "articulation": {
            "text": {
              "en": "It is recommended to do this screening annually for all adults aged 18 years or older who have overweight with additional risk factors such as physical inactivity",
              "ar": "يوصى بإجراء هذا الفحص سنويًا لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ولديهم زيادة وزن مع عوامل خطورة إضافية مثل قلة النشاط البدني"
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
          "key": "smoking-counseling",
          "name": {
            "en": "Smoking Cessation Counseling",
            "ar": "مشورة الإقلاع عن التدخين"
          },
          "category": "counseling",
          "articulation": {
            "text": {
              "en": "It is recommended to have this counseling for all adults aged 18 years or older who use tobacco products",
              "ar": "يوصى بالحصول على هذه المشورة لجميع البالغين الذين أعمارهم 18 عامًا فأكثر ويستخدمون منتجات التبغ"
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
              "en": "It is recommended to get this vaccination for all adults aged 18-64 years who have risk factors such as tobacco smoking",
              "ar": "يوصى بأخذ هذا التطعيم لجميع البالغين الذين أعمارهم 18-64 عامًا ولديهم عوامل خطورة مثل تدخين التبغ"
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