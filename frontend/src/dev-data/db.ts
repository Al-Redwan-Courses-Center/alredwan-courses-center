// ==========================================
// UTILITIES & GENERATORS
// ==========================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear Congruential Generator (LCG)
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Min inclusive, Max inclusive
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Pick random item from array
  pick<T>(array: T[]): T {
    return array[this.int(0, array.length - 1)];
  }

  // Pick N random items from array (unique)
  pickMultiple<T>(array: T[], n: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - this.next());
    return shuffled.slice(0, n);
  }

  // True/False with probability
  bool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  // Random Date within range
  date(start: Date, end: Date): string {
    const time = this.int(start.getTime(), end.getTime());
    return new Date(time).toISOString();
  }
}

const RNG = new SeededRandom(12345); // Fixed seed for consistent hydration

const ARABIC_MALE_NAMES = [
  "محمد",
  "أحمد",
  "محمود",
  "علي",
  "عمر",
  "يوسف",
  "إبراهيم",
  "خالد",
  "حسن",
  "حسين",
  "مصطفى",
  "عبدالله",
  "عبدالرحمن",
  "ياسين",
  "حمزة",
  "زياد",
  "كريم",
  "طارق",
  "وائل",
  "سيف",
];

const ARABIC_FEMALE_NAMES = [
  "فاطمة",
  "مريم",
  "عائشة",
  "سارة",
  "نور",
  "ليلى",
  "جنى",
  "حلا",
  "سلمى",
  "هدى",
  "رانيا",
  "نادية",
  "منى",
  "هبة",
  "ياسمين",
  "فريدة",
  "رقية",
  "خديجة",
  "أميرة",
  "نهى",
];

const ARABIC_LAST_NAMES = [
  "المصري",
  "السعيد",
  "كمال",
  "إبراهيم",
  "عادل",
  "زكي",
  "فاروق",
  "جمال",
  "عثمان",
  "صلاح",
  "غانم",
  "سليم",
  "راضي",
  "فوزي",
  "هلال",
  "نجيب",
  "منصور",
  "عباس",
  "جاد",
  "النجار",
];

// const JOBS_EN = [
//   "Software Engineer",
//   "Doctor",
//   "Teacher",
//   "Accountant",
//   "Lawyer",
//   "Pharmacist",
//   "Architect",
//   "Civil Engineer",
//   "Graphic Designer",
//   "Business Owner",
//   "Nurse",
//   "Chef",
// ];

const JOBS_AR = [
  "مهندس برمجيات",
  "طبيب",
  "معلم",
  "محاسب",
  "محامي",
  "صيدلي",
  "مهندس معماري",
  "مهندس مدني",
  "مصمم جرافيك",
  "رجل أعمال",
  "ممرض",
  "طاهي",
];

// ==========================================
// 1. BASE ENTITIES (Generated)
// ==========================================

export const SEASONS = [
  {
    id: 1,
    name: "معسكر الصيف 2025",
    type: "summer_camp",
    description:
      "دورات صيفية مكثفة لجميع الأعمار تشمل البرمجة والرياضة والقرآن.",
    is_active: true,
  },
  {
    id: 2,
    name: "الفصل الدراسي الأول 2025",
    type: "school",
    description: "دروس تقوية للمناهج الدراسية لجميع المراحل.",
    is_active: false,
  },
  {
    id: 3,
    name: "برنامج رمضان 1446",
    type: "ramadan",
    description: "مسابقات ودورات دينية مكثفة وفعاليات مسائية.",
    is_active: false,
  },
  {
    id: 4,
    name: "إجازة منتصف العام 2026",
    type: "camp",
    description: "أنشطة ترفيهية وتعليمية خفيفة.",
    is_active: false,
  },
];

export const TAGS = [
  { id: 1, name: "برمجة", color: "blue" },
  { id: 2, name: "رياضيات", color: "red" },
  { id: 3, name: "فيزياء", color: "green" },
  { id: 4, name: "قرآن كريم", color: "gold" },
  { id: 5, name: "فنون", color: "purple" },
  { id: 6, name: "روبوتيكس", color: "cyan" },
  { id: 7, name: "لغات", color: "orange" },
  { id: 8, name: "تنمية مهارات", color: "teal" },
];

export const INSTRUCTORS = [
  {
    id: 1,
    name: "أحمد علي",
    code: "M84920",
    gender: "male",
    email: "ahmed.ali@example.com",
    bio: "خبير في علوم الحاسب والبرمجة بخبرة تزيد عن 10 سنوات.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed&gender=male",
    job_title: "مهندس برمجيات أول",
    salary: 8000,
    joined_at: "2020-01-15T09:00:00Z",
  },
  {
    id: 2,
    name: "سارة محمد",
    code: "W93847",
    gender: "female",
    email: "sara.mohamed@example.com",
    bio: "دكتوراه في الفيزياء من جامعة القاهرة.",
    image:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&gender=female",
    job_title: "أستاذة فيزياء",
    salary: 9500,
    joined_at: "2021-05-20T10:30:00Z",
  },
  {
    id: 3,
    name: "محمود حسن",
    code: "M29384",
    gender: "male",
    email: null,
    bio: "حافظ للقرآن الكريم بالقراءات العشر.",
    image:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Mahmoud&gender=male",
    job_title: "مدرس قرآن كريم",
    salary: 6000,
    joined_at: "2022-03-10T08:00:00Z",
  },
  {
    id: 4,
    name: "ليلى حسين",
    code: "W10293",
    gender: "female",
    email: "laila.h@example.com",
    bio: "فنانة تشكيلية ومدربة رسم للأطفال.",
    image:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Laila&gender=female",
    job_title: "مدربة فنون تشكيلية",
    salary: 5000,
    joined_at: "2023-11-01T11:00:00Z",
  },
  {
    id: 5,
    name: "كريم عبد العزيز",
    code: "M56473",
    gender: "male",
    email: "karim.a@example.com",
    bio: "مدرب روبوتيكس معتمد.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karim&gender=male",
    job_title: "مهندس روبوتات",
    salary: 7500,
    joined_at: "2024-02-15T13:00:00Z",
  },
  {
    id: 6,
    name: "عمر فاروق",
    code: "M11223",
    gender: "male",
    email: "omar.farouk@example.com",
    bio: "خطاط محترف يجيد الخط الكوفي والديواني.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=OmarF&gender=male",
    job_title: "خطاط",
    salary: 4500,
    joined_at: "2024-08-01T10:00:00Z",
  },
  {
    id: 7,
    name: "نادية مصطفى",
    code: "W44556",
    gender: "female",
    email: "nadia.m@example.com",
    bio: "مدرسة لغة إنجليزية معتمدة من كامبريدج.",
    image:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Nadia&gender=female",
    job_title: "مدرسة لغة إنجليزية",
    salary: 7000,
    joined_at: "2025-01-10T09:00:00Z",
  },
  {
    id: 8,
    name: "ياسر كمال",
    code: "M77889",
    gender: "male",
    email: "yasser.k@example.com",
    bio: "مدرب شطرنج دولي.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yasser&gender=male",
    job_title: "مدرب شطرنج",
    salary: 5500,
    joined_at: "2025-09-20T14:00:00Z",
  },
];

export const PARENTS: any[] = [];
export const CHILDREN: any[] = [];
export const STUDENTS: any[] = [];

// --- Generate Parents ---
for (let i = 1; i <= 50; i++) {
  const isMale = RNG.bool(0.7); // 70% chance of being the father in our DB context
  const fname = RNG.pick(isMale ? ARABIC_MALE_NAMES : ARABIC_FEMALE_NAMES);
  const lname = RNG.pick(ARABIC_LAST_NAMES);
  const codeChar = isMale ? "M" : "W";
  const jobIndex = RNG.int(0, JOBS_AR.length - 1);

  PARENTS.push({
    id: i,
    name: `${fname} ${lname}`,
    code: `${codeChar}${RNG.int(10000, 99999)}`,
    gender: isMale ? "male" : "female",
    email: `parent${i}@example.com`,
    phone: `+2010${RNG.int(10000000, 99999999)}`,
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=Parent${i}&gender=${isMale ? "male" : "female"}`,
    job_title: JOBS_AR[jobIndex],
  });
}

// --- Generate Children (Linked to Parents) ---
for (let i = 1; i <= 100; i++) {
  const isBoy = RNG.bool();
  const fname = RNG.pick(isBoy ? ARABIC_MALE_NAMES : ARABIC_FEMALE_NAMES);
  const parent = RNG.pick(PARENTS);
  const dobStr = RNG.date(new Date(2015, 0, 1), new Date(2020, 0, 1));
  const dob = new Date(dobStr);
  const age =
    2026 -
    dob.getFullYear() -
    (new Date(2026, 1, 3) < new Date(2026, dob.getMonth(), dob.getDate())
      ? 1
      : 0);

  CHILDREN.push({
    id: `child-${i}`,
    name: `${fname} ${parent.name.split(" ")[0]}`, // e.g. Ali Abdullah
    code: `${isBoy ? "B" : "G"}${RNG.int(10000, 99999)}`,
    gender: isBoy ? "male" : "female",
    dob: dobStr,
    age: age,
    primary_parent: parent,
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=Child${i}&gender=${isBoy ? "male" : "female"}`,
  });
}

// --- Generate Students (Independent) ---
for (let i = 1; i <= 150; i++) {
  const isMale = RNG.bool();
  const fname = RNG.pick(isMale ? ARABIC_MALE_NAMES : ARABIC_FEMALE_NAMES);
  const lname = RNG.pick(ARABIC_LAST_NAMES);
  const dobStr = RNG.date(new Date(2005, 0, 1), new Date(2012, 0, 1));
  const dob = new Date(dobStr);
  const age =
    2026 -
    dob.getFullYear() -
    (new Date(2026, 1, 3) < new Date(2026, dob.getMonth(), dob.getDate())
      ? 1
      : 0);

  STUDENTS.push({
    id: i,
    name: `${fname} ${lname}`,
    code: `${isMale ? "B" : "G"}${RNG.int(10000, 99999)}`,
    gender: isMale ? "male" : "female",
    dob: dobStr,
    age: age,
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=Student${i}&gender=${isMale ? "male" : "female"}`,
  });
}

// ==========================================
// 2. COURSES & ENROLLMENTS LOGIC
// ==========================================

export const COURSES = [
  {
    id: 1,
    slug: "python-basics",
    title: "أساسيات البرمجة بلغة بايثون",
    description: "دورة شاملة لتعلم أساسيات البرمجة باستخدام لغة بايثون.",
    price: 1500.0,
    capacity: 60, // Increased
    instructor: INSTRUCTORS[0], // Ahmed Ali
    season: SEASONS[0],
    tags: [TAGS[0]],
    // Starts Jan 5 (Mon). Lecture on Feb 3 (Tue) needed?
    // Changing schedule to Mon/Tue for test
    start_date: "2026-01-05T10:00:00Z",
    end_date: "2026-04-15T12:00:00Z",
    stats: { lectures: 12 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80",
    },
    // CHANGED: Mon/Tue
    schedule: [
      { day: "الإثنين", start: "10:00", end: "12:00" },
      { day: "الثلاثاء", start: "10:00", end: "12:00" },
    ],
    enrollments_count: 0,
    enrollments: [] as any[],
    lectures: [] as any[],
    exams: [] as any[],
  },
  {
    id: 2,
    slug: "fun-physics",
    title: "الفيزياء المسلية",
    description: "استكشاف قوانين الفيزياء من خلال التجارب العملية.",
    price: 2000.0,
    capacity: 40,
    instructor: INSTRUCTORS[1],
    season: SEASONS[0],
    tags: [TAGS[2]],
    start_date: "2025-06-15T14:00:00Z",
    end_date: "2025-08-20T16:00:00Z",
    stats: { lectures: 16 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&q=80",
    },
    schedule: [
      { day: "الثلاثاء", start: "14:00", end: "16:00" },
      { day: "الخميس", start: "14:00", end: "16:00" },
    ],
    enrollments_count: 0,
    enrollments: [] as any[],
    lectures: [] as any[],
    exams: [] as any[],
  },
  {
    id: 3,
    slug: "juz-amma",
    title: "تحفيظ جزء عم",
    description: "دورة تحفيظ مكثفة لجزء عم مع تعلم أحكام التجويد.",
    price: 500.0,
    capacity: 50,
    instructor: INSTRUCTORS[2],
    season: SEASONS[0],
    tags: [TAGS[3]],
    start_date: "2025-06-01T09:00:00Z",
    end_date: null,
    stats: { lectures: 24 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80",
    },
    schedule: [{ day: "السبت", start: "09:00", end: "11:00" }],
    enrollments_count: 0,
    enrollments: [] as any[],
    lectures: [] as any[],
    exams: [] as any[],
  },
  {
    id: 4,
    slug: "advanced-math",
    title: "الرياضيات المتقدمة",
    description:
      "دورة مخصصة للطلاب المتفوقين في الرياضيات لتنمية مهارات حل المشكلات.",
    price: 2500.0,
    capacity: 30,
    instructor: INSTRUCTORS[0], // Ahmed Ali
    season: SEASONS[1],
    tags: [TAGS[1]],
    // CHANGED: Schedule to Sun/Tue. Starts Jan 4 (Sun)
    start_date: "2026-01-04T16:00:00Z",
    end_date: "2026-04-10T18:00:00Z",
    stats: { lectures: 20 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80",
    },
    schedule: [
      { day: "الأحد", start: "16:00", end: "18:00" },
      { day: "الثلاثاء", start: "16:00", end: "18:00" },
    ],
    enrollments_count: 0,
    enrollments: [] as any[],
    lectures: [] as any[],
    exams: [] as any[],
  },
  {
    id: 5,
    slug: "little-artist",
    title: "الفنان الصغير",
    description: "تعلم أساسيات الرسم والتلوين للأطفال.",
    price: 1200.0,
    capacity: 45,
    instructor: INSTRUCTORS[3],
    season: SEASONS[0],
    tags: [TAGS[4]],
    start_date: "2025-07-01T14:00:00Z",
    end_date: "2025-08-30T16:00:00Z",
    stats: { lectures: 8 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
    },
    schedule: [{ day: "الجمعة", start: "14:00", end: "16:00" }],
    enrollments_count: 0,
    enrollments: [] as any[],
    lectures: [] as any[],
    exams: [] as any[],
  },
  {
    id: 6,
    slug: "lego-robotics",
    title: "روبوتيكس (Lego)",
    description: "بناء وبرمجة الروبوتات باستخدام حقائب الليجو التعليمية.",
    price: 3000.0,
    capacity: 25,
    instructor: INSTRUCTORS[4],
    season: SEASONS[0],
    tags: [TAGS[5], TAGS[0]],
    start_date: "2025-06-05T12:00:00Z",
    end_date: "2025-07-30T15:00:00Z",
    stats: { lectures: 10 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=800&q=80",
    },
    schedule: [{ day: "السبت", start: "12:00", end: "15:00" }],
    enrollments_count: 0,
    enrollments: [] as any[],
    lectures: [] as any[],
    exams: [] as any[],
  },
  {
    id: 7,
    slug: "english-conversation",
    title: "محادثة إنجليزية",
    description: "تحسين مهارات التحدث والاستماع باللغة الإنجليزية.",
    price: 1800.0,
    capacity: 40,
    instructor: INSTRUCTORS[6],
    season: SEASONS[1],
    tags: [TAGS[6]],
    start_date: "2025-10-01T18:00:00Z",
    end_date: "2025-12-15T20:00:00Z",
    stats: { lectures: 15 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80",
    },
    schedule: [
      { day: "الأحد", start: "18:00", end: "20:00" },
      { day: "الأربعاء", start: "18:00", end: "20:00" },
    ],
    enrollments_count: 0,
    enrollments: [] as any[],
    lectures: [] as any[],
    exams: [] as any[],
  },
  {
    id: 8,
    slug: "arabic-calligraphy",
    title: "فن الخط العربي",
    description: "تعلم قواعد الخط الكوفي والديواني مع تطبيقات عملية.",
    price: 1000.0,
    capacity: 30,
    instructor: INSTRUCTORS[5],
    season: SEASONS[2],
    tags: [TAGS[4], TAGS[7]],
    start_date: "2025-02-28T20:00:00Z",
    end_date: "2025-03-30T22:00:00Z",
    stats: { lectures: 6 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1555677284-6a6f971638e0?w=800&q=80",
    },
    schedule: [{ day: "الجمعة", start: "20:00", end: "22:00" }],
    enrollments_count: 0,
    enrollments: [] as any[],
    lectures: [] as any[],
    exams: [] as any[],
  },
  {
    id: 9,
    slug: "chess-mastery",
    title: "إحتراف الشطرنج",
    description: "تطوير التفكير الاستراتيجي وخطط اللعب.",
    price: 1600.0,
    capacity: 50,
    instructor: INSTRUCTORS[7],
    season: SEASONS[3],
    tags: [TAGS[7]],
    start_date: "2026-01-20T16:00:00Z",
    end_date: "2026-02-10T18:00:00Z",
    stats: { lectures: 8 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80",
    },
    schedule: [{ day: "السبت", start: "16:00", end: "18:00" }],
    enrollments_count: 0,
    enrollments: [] as any[],
    lectures: [] as any[],
    exams: [] as any[],
  },
  {
    id: 10,
    slug: "web-dev-junior",
    title: "مطور الويب الصغير",
    description: "بناء مواقع إلكترونية بسيطة باستخدام HTML و CSS.",
    price: 2200.0,
    capacity: 60,
    instructor: INSTRUCTORS[0], // Ahmed
    season: SEASONS[0],
    tags: [TAGS[0]],
    // Starts Jan 6, 2026 (Tuesday). Lecture 5 -> Feb 3 (Tuesday)
    start_date: "2026-01-06T14:00:00Z",
    end_date: "2026-04-15T16:00:00Z",
    stats: { lectures: 14 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
    },
    // CHANGED: Schedule to Tue/Thu
    schedule: [
      { day: "الثلاثاء", start: "14:00", end: "16:00" },
      { day: "الخميس", start: "14:00", end: "16:00" },
    ],
    enrollments_count: 0,
    enrollments: [] as any[],
    lectures: [] as any[],
    exams: [] as any[],
  },
];

// --- Generate Enrollments & Update Courses ---
let globalEnrollmentId = 1;

COURSES.forEach((course) => {
  const targetEnrollment = RNG.int(
    Math.floor(course.capacity * 0.3),
    Math.floor(course.capacity * 0.95),
  );

  const availableParticipants = [...STUDENTS, ...CHILDREN];
  const selectedParticipants = RNG.pickMultiple(
    availableParticipants,
    targetEnrollment,
  );

  selectedParticipants.forEach((participant) => {
    const enrollment = {
      id: `enr-${globalEnrollmentId++}`,
      status: RNG.bool(0.9) ? "active" : "dropped",
      enrolled_at: RNG.date(new Date(2025, 4, 1), new Date(2025, 5, 30)),
      course: course,
      student: "primary_parent" in participant ? undefined : participant,
      child: "primary_parent" in participant ? participant : undefined,
    };

    course.enrollments.push(enrollment);
  });

  course.enrollments_count = course.enrollments.filter(
    (e) => e.status === "active",
  ).length;
});

// --- Generate Lectures & Attendance ---
const DAY_MAP: { [key: string]: number } = {
  الأحد: 0,
  الإثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

// GLOBAL SIMULATION DATE
export const TODAY_DATE_ISO = "2026-02-03"; // Tuesday

COURSES.forEach((course) => {
  const lectureCount = course.stats.lectures;
  const allowedDays = course.schedule.map((s) => DAY_MAP[s.day]);

  const currentDate = new Date(course.start_date);
  let lecturesGenerated = 0;

  while (lecturesGenerated < lectureCount) {
    if (allowedDays.includes(currentDate.getDay())) {
      lecturesGenerated++;
      const i = lecturesGenerated;

      const lectureIsoDate = currentDate.toISOString().split("T")[0];
      const isPast = lectureIsoDate < TODAY_DATE_ISO;
      // const isToday = lectureIsoDate === TODAY_DATE_ISO;

      const lecture = {
        id: course.id * 100 + i,
        number: i,
        title: `المحاضرة ${i}: ${RNG.pick(["مقدمة", "تطبيق عملي", "مراجعة", "مشروع", "اختبار", "شرح نظري"])}`,
        date: currentDate.toISOString(),
        status: isPast ? "submitted" : "pending", // Today = pending
        course: course,
        attendances: [] as any[],
      };

      if (isPast) {
        // Generate attendance only for past lectures
        course.enrollments
          .filter((e) => e.status === "active")
          .forEach((enr) => {
            lecture.attendances.push({
              id: lecture.id * 1000 + RNG.int(1, 999),
              present: RNG.bool(0.85),
              rating: RNG.bool(0.5) ? RNG.int(7, 10) : undefined,
              student: enr.student,
              child: enr.child,
            });
          });
      }

      course.lectures.push(lecture);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
});

// --- Generate Exams & Results ---
COURSES.forEach((course) => {
  const exams = [
    { type: "quiz", title: "اختبار منتصف الدورة", total: 20 },
    { type: "final", title: "الامتحان النهائي", total: 100 },
  ];

  exams.forEach((exTemplate, idx) => {
    const examDate = new Date(course.start_date);
    examDate.setDate(examDate.getDate() + (idx === 0 ? 30 : 60));

    const isPast = examDate < new Date(TODAY_DATE_ISO);

    const exam = {
      id: course.id * 1000 + idx,
      title: exTemplate.title,
      type: exTemplate.type,
      course: course,
      total_marks: exTemplate.total,
      date: examDate.toISOString(),
      results: [] as any[],
    };

    if (isPast) {
      course.enrollments
        .filter((e) => e.status === "active")
        .forEach((enr) => {
          const score = RNG.int(
            Math.floor(exTemplate.total * 0.5),
            exTemplate.total,
          );
          exam.results.push({
            id: exam.id * 10000 + RNG.int(1, 9999),
            marks_obtained: score,
            percentage: (score / exTemplate.total) * 100,
            passed: score >= exTemplate.total / 2,
            student: enr.student,
            child: enr.child,
            notes: score === exTemplate.total ? "ممتاز" : undefined,
          });
        });
    }
    course.exams.push(exam);
  });
});

// ==========================================
// 3. EXPORTS & DERIVED LISTS
// ==========================================

export const LOGGED_IN_INSTRUCTOR_INDEX = 0; // Ahmed Ali

export const LANDING_PAGE_COURSES = [
  { order: 1, course: COURSES[0] }, // Python
  { order: 2, course: COURSES[2] }, // Quran
  { order: 3, course: COURSES[5] }, // Robotics
  { order: 4, course: COURSES[1] }, // Physics
  { order: 5, course: COURSES[7] }, // Calligraphy
  { order: 6, course: COURSES[9] }, // Web Dev
];

export const LANDING_PAGE_INSTRUCTORS = [
  { order: 1, instructor: INSTRUCTORS[0] }, // Ahmed Ali
  { order: 2, instructor: INSTRUCTORS[1] }, // Sara Mohamed
  { order: 3, instructor: INSTRUCTORS[2] }, // Mahmoud Hassan
  { order: 4, instructor: INSTRUCTORS[3] }, // Laila Hussein
];

export const ENROLLMENTS = COURSES.flatMap((c) => c.enrollments);
export const ALL_LECTURES = COURSES.flatMap((c) => c.lectures);
export const LECTURE_ATTENDANCES = ALL_LECTURES.flatMap((l) =>
  l.attendances.map((a: any) => ({ ...a, lecture: l })),
);
export const EXAMS = COURSES.flatMap((c) => c.exams);
export const EXAM_RESULTS = EXAMS.flatMap((e) =>
  e.results.map((r: any) => ({ ...r, exam: e })),
);

// --- HELPERS ---
export const getLectureById = (id: number) =>
  ALL_LECTURES.find((l) => l.id === id);

// --- Random Enrollment Requests ---
export const ENROLLMENT_REQUESTS: any[] = [];
for (let i = 0; i < 15; i++) {
  const course = RNG.pick(COURSES);
  const isStudent = RNG.bool();
  const participant = isStudent ? RNG.pick(STUDENTS) : RNG.pick(CHILDREN);
  const parent = isStudent ? undefined : participant.primary_parent;

  ENROLLMENT_REQUESTS.push({
    id: `req-${i}`,
    status: RNG.pick(["pending", "processing", "rejected"]),
    date: RNG.date(new Date(), new Date(new Date().getTime() + 86400000 * 7)), // Next 7 days
    course: course,
    student: isStudent ? participant : undefined,
    child: isStudent ? undefined : participant,
    parent: parent,
    price: course.price,
  });
}

// --- TODAY'S SCHEDULE EXPORT ---
export const TODAYS_SCHEDULE = COURSES.filter(
  (course) =>
    course.instructor.id === INSTRUCTORS[LOGGED_IN_INSTRUCTOR_INDEX].id,
)
  .flatMap((course) => course.lectures)
  .filter((lecture) => lecture.date.startsWith(TODAY_DATE_ISO))
  .map((lecture) => {
    const course = COURSES.find((c) => c.lectures.includes(lecture));
    // Determine start/end time based on course schedule for "Today" (Tuesday)
    const schedule = course?.schedule.find((s) => s.day === "الثلاثاء");
    return {
      ...lecture,
      course_title: course?.title,
      course_image: course?.images.cover,
      start_time: schedule?.start || "10:00",
      end_time: schedule?.end || "12:00",
    };
  });

export const MY_COURSES = COURSES.filter(
  (course) =>
    course.instructor.id === INSTRUCTORS[LOGGED_IN_INSTRUCTOR_INDEX].id,
);
