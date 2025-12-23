export const publicInstructors = [
  {
    id: 1,
    fullName: "أ. أحمد محمد",
    role: "مدير الأكاديمية",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed&gender=male",
    specialization: "تعليم القرآن الكريم",
    experience: "١٥ سنة خبرة",
    qualification: "حافظ للقرآن الكريم بالقراءات العشر",
  },
  {
    id: 2,
    fullName: "د. سارة علي",
    role: "مشرفة تربوية",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&gender=female",
    specialization: "تأسيس لغة عربية",
    experience: "٨ سنوات خبرة",
    qualification: "دكتوراه في مناهج وطرق التدريس",
  },
  {
    id: 3,
    fullName: "محمود حسن",
    role: "معلم أول",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Mahmoud&gender=male",
    specialization: "أحكام التجويد",
    experience: "١٢ سنة خبرة",
    qualification: "إجازة في حفص عن عاصم",
  },
];

export type PublicInstructor = (typeof publicInstructors)[number];
