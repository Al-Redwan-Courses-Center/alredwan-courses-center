export interface PublicCourse {
  id: number;
  title: string;
  description: string;
  tags: string[];
  startDate: string;
  lectureCount: number;
  price: number;
  currency: string;
  capacity: number;
  enrolledCount: number;
  coverImageUrl: string;
  headerEnglishTitle?: string;
}

export const courses = [
  {
    id: 1,
    title: "تعلم القرآن الكريم",
    description:
      "كورس شامل لتعلم تلاوة القرآن الكريم وأحكام التجويد من الصفر حتى الإتقان.",
    tags: ["قرآن", "تجويد"],
    startDate: "2024-01-01",
    lectureCount: 24,
    price: 200.0,
    currency: "جنيه",
    capacity: 50,
    enrolledCount: 30,
    coverImageUrl:
      "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?q=80&w=600&auto=format&fit=crop",
    headerEnglishTitle: "Online Quran Recitation Course",
  },
  {
    id: 2,
    title: "أساسيات التجويد",
    description:
      "دورة مكثفة للمبتدئين في مخارج الحروف والصفات وتصحيح الأخطاء الشائعة.",
    tags: ["تجويد", "مبتدئين"],
    startDate: "2024-02-15",
    lectureCount: 12,
    price: 150.0,
    currency: "جنيه",
    capacity: 20,
    enrolledCount: 5,
    coverImageUrl:
      "https://images.unsplash.com/photo-1584286595398-a59f21d313f5?q=80&w=600&auto=format&fit=crop",
    headerEnglishTitle: "Tajweed Basics Course",
  },
  {
    id: 3,
    title: "حفظ جزء عم",
    description: "برنامج تحفيظ خاص للأطفال مع قصص السور وتفسير مبسط للآيات.",
    tags: ["حفظ", "أطفال"],
    startDate: "2024-03-01",
    lectureCount: 30,
    price: 300.0,
    currency: "جنيه",
    capacity: 15,
    enrolledCount: 15,
    coverImageUrl:
      "https://images.unsplash.com/photo-1598454443425-4c6e94326527?q=80&w=600&auto=format&fit=crop",
    headerEnglishTitle: "Juz Amma Memorization",
  },
  {
    id: 4,
    title: "السيرة النبوية للأطفال",
    description:
      "رحلة ممتعة في حياة النبي صلى الله عليه وسلم لغرس القيم والأخلاق.",
    tags: ["سيرة", "أخلاق", "أطفال"],
    startDate: "2024-04-10",
    lectureCount: 8,
    price: 120.0,
    currency: "جنيه",
    capacity: 25,
    enrolledCount: 20,
    coverImageUrl:
      "https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=600&auto=format&fit=crop",
    headerEnglishTitle: "Prophetic Biography for Kids",
  },
  {
    id: 5,
    title: "التجويد المتقدم (الجزري)",
    description:
      "شرح متن الجزرية للطلاب المتقدمين الراغبين في الحصول على الإجازة.",
    tags: ["تجويد", "إجازة", "متقدم"],
    startDate: "2024-05-05",
    lectureCount: 36,
    price: 450.0,
    currency: "جنيه",
    capacity: 10,
    enrolledCount: 2,
    coverImageUrl:
      "https://images.unsplash.com/photo-1597954002636-61b52a46e34e?q=80&w=600&auto=format&fit=crop",
    headerEnglishTitle: "Advanced Tajweed (Jazari)",
  },
  {
    id: 6,
    title: "تفسير قصار السور",
    description: "فهم المعاني العميقة والدروس المستفادة من جزء عم وجزء تبارك.",
    tags: ["تفسير", "تدبر"],
    startDate: "2024-06-01",
    lectureCount: 16,
    price: 250.0,
    currency: "جنيه",
    capacity: 40,
    enrolledCount: 38,
    coverImageUrl:
      "https://images.unsplash.com/photo-1607559193139-444452174c83?q=80&w=600&auto=format&fit=crop",
    headerEnglishTitle: "Tafseer of Short Surahs",
  },
];
