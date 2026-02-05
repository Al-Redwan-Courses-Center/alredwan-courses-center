// ==========================================
// UTILITIES & GENERATORS
// ==========================================

class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(array: T[]): T {
    return array[this.int(0, array.length - 1)];
  }
  pickMultiple<T>(array: T[], n: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - this.next());
    return shuffled.slice(0, n);
  }
  bool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
  date(start: Date, end: Date): string {
    const time = this.int(start.getTime(), end.getTime());
    return new Date(time).toISOString();
  }
}

const RNG = new SeededRandom(12345);

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
// 1. BASE ENTITIES
// ==========================================

export const SEASONS = [
  {
    id: 1,
    name: "معسكر الصيف 2025",
    type: "summer_camp",
    description: "دورات صيفية مكثفة لجميع الأعمار.",
    is_active: true,
  },
  {
    id: 2,
    name: "الفصل الدراسي الأول 2025",
    type: "school",
    description: "دروس تقوية للمناهج الدراسية.",
    is_active: false,
  },
  {
    id: 3,
    name: "برنامج رمضان 1446",
    type: "ramadan",
    description: "مسابقات ودورات دينية.",
    is_active: false,
  },
  {
    id: 4,
    name: "إجازة منتصف العام 2026",
    type: "camp",
    description: "أنشطة ترفيهية.",
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
    bio: "خبير برمجة.",
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
    bio: "دكتوراه فيزياء.",
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
    bio: "حافظ للقرآن.",
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
    bio: "فنانة تشكيلية.",
    image:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Laila&gender=female",
    job_title: "مدربة فنون تشكيلية",
    salary: 5000,
    joined_at: "2023-11-01T11:00:00Z",
  },
];

export const ADMINS = [
  {
    id: 1,
    name: "مدير النظام",
    code: "M00001",
    gender: "male",
    job_title: "System Administrator",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin1&gender=male",
  },
];

export const PARENTS: any[] = [];
export const CHILDREN: any[] = [];
export const STUDENTS: any[] = [];

// GLOBAL SIMULATION DATE
export const TODAY_DATE_ISO = "2026-02-03"; // Tuesday

for (let i = 1; i <= 50; i++) {
  const isMale = RNG.bool(0.7);
  const fname = RNG.pick(isMale ? ARABIC_MALE_NAMES : ARABIC_FEMALE_NAMES);
  const lname = RNG.pick(ARABIC_LAST_NAMES);
  PARENTS.push({
    id: i,
    name: `${fname} ${lname}`,
    code: `${isMale ? "M" : "W"}${RNG.int(10000, 99999)}`,
    gender: isMale ? "male" : "female",
    email: `parent${i}@example.com`,
    phone: `+2010${RNG.int(10000000, 99999999)}`,
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=Parent${i}&gender=${isMale ? "male" : "female"}`,
    job_title: JOBS_AR[RNG.int(0, JOBS_AR.length - 1)],
  });
}

for (let i = 1; i <= 100; i++) {
  const isBoy = RNG.bool();
  const fname = RNG.pick(isBoy ? ARABIC_MALE_NAMES : ARABIC_FEMALE_NAMES);
  const parent = RNG.pick(PARENTS);
  const dobStr = RNG.date(new Date(2015, 0, 1), new Date(2020, 0, 1));
  const age = 2026 - new Date(dobStr).getFullYear();
  CHILDREN.push({
    id: `child-${i}`,
    name: `${fname} ${parent.name.split(" ")[0]}`,
    code: `${isBoy ? "B" : "G"}${RNG.int(10000, 99999)}`,
    gender: isBoy ? "male" : "female",
    dob: dobStr,
    age,
    primary_parent: parent,
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=Child${i}&gender=${isBoy ? "male" : "female"}`,
  });
}

for (let i = 1; i <= 150; i++) {
  const isMale = RNG.bool();
  const fname = RNG.pick(isMale ? ARABIC_MALE_NAMES : ARABIC_FEMALE_NAMES);
  const lname = RNG.pick(ARABIC_LAST_NAMES);
  const dobStr = RNG.date(new Date(2005, 0, 1), new Date(2012, 0, 1));
  const age = 2026 - new Date(dobStr).getFullYear();
  STUDENTS.push({
    id: i,
    name: `${fname} ${lname}`,
    code: `${isMale ? "B" : "G"}${RNG.int(10000, 99999)}`,
    gender: isMale ? "male" : "female",
    dob: dobStr,
    age,
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=Student${i}&gender=${isMale ? "male" : "female"}`,
  });
}

// ==========================================
// 2. COURSES & ENROLLMENTS
// ==========================================

export const COURSES = [
  {
    id: 1,
    slug: "python-basics",
    title: "أساسيات البرمجة بلغة بايثون",
    price: 1500.0,
    capacity: 60,
    instructor: INSTRUCTORS[0],
    season: SEASONS[0],
    tags: [TAGS[0]],
    start_date: "2026-01-05T10:00:00Z",
    end_date: "2026-04-15T12:00:00Z",
    stats: { lectures: 12 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80",
    },
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
    id: 4,
    slug: "advanced-math",
    title: "الرياضيات المتقدمة",
    price: 2500.0,
    capacity: 30,
    instructor: INSTRUCTORS[0],
    season: SEASONS[1],
    tags: [TAGS[1]],
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
    id: 10,
    slug: "web-dev-junior",
    title: "مطور الويب الصغير",
    price: 2200.0,
    capacity: 60,
    instructor: INSTRUCTORS[0],
    season: SEASONS[0],
    tags: [TAGS[0]],
    start_date: "2026-01-06T14:00:00Z",
    end_date: "2026-04-15T16:00:00Z",
    stats: { lectures: 14 },
    images: {
      cover:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
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
    id: 2,
    slug: "fun-physics",
    title: "الفيزياء المسلية",
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
    id: 5,
    slug: "little-artist",
    title: "الفنان الصغير",
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
    price: 3000.0,
    capacity: 25,
    instructor: INSTRUCTORS[0],
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
    price: 1800.0,
    capacity: 40,
    instructor: INSTRUCTORS[0],
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
    price: 1000.0,
    capacity: 30,
    instructor: INSTRUCTORS[0],
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
];

const DAY_MAP: { [key: string]: number } = {
  الأحد: 0,
  الإثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

// Guaranteed Participants for "Current User" stress test
const student0 = STUDENTS[0];
const child0 = CHILDREN[0]; // Belongs to Parent[0]

COURSES.forEach((course, courseIndex) => {
  // 1. Guaranteed Enrollment for Mock Student and Parent (in first 7 courses)
  if (courseIndex < 7) {
    course.enrollments.push({
      id: `enr-guaranteed-st-${course.id}`,
      status: "active",
      enrolled_at: "2025-05-01T10:00:00Z",
      course,
      student: student0,
      child: undefined,
    });
    course.enrollments.push({
      id: `enr-guaranteed-pa-${course.id}`,
      status: "active",
      enrolled_at: "2025-05-01T10:00:00Z",
      course,
      student: undefined,
      child: child0,
    });
  }

  // 2. Random Enrollment Logic
  const targetEnrollment = RNG.int(
    Math.floor(course.capacity * 0.3),
    Math.floor(course.capacity * 0.95),
  );
  const selectedParticipants = RNG.pickMultiple(
    [...STUDENTS, ...CHILDREN],
    targetEnrollment,
  );
  selectedParticipants.forEach((p) => {
    // Avoid double enrolling guaranteed participants
    if (p.id === student0.id || p.id === child0.id) return;
    course.enrollments.push({
      id: `enr-${RNG.int(1, 99999)}`,
      status: RNG.bool(0.9) ? "active" : "dropped",
      enrolled_at: RNG.date(new Date(2025, 4, 1), new Date(2025, 5, 30)),
      course,
      student: "primary_parent" in p ? undefined : p,
      child: "primary_parent" in p ? p : undefined,
    });
  });
  course.enrollments_count = course.enrollments.filter(
    (e) => e.status === "active",
  ).length;

  const allowedDays = course.schedule.map((s) => DAY_MAP[s.day]);
  let currentDate = new Date(course.start_date);
  let lecturesGenerated = 0;
  while (lecturesGenerated < course.stats.lectures) {
    if (allowedDays.includes(currentDate.getDay())) {
      lecturesGenerated++;
      const lectureIsoDate = currentDate.toISOString().split("T")[0];
      const isPast = lectureIsoDate < TODAY_DATE_ISO;
      const lecture = {
        id: course.id * 100 + lecturesGenerated,
        number: lecturesGenerated,
        title: `المحاضرة ${lecturesGenerated}`,
        date: currentDate.toISOString(),
        status: isPast ? "submitted" : "pending",
        course,
        attendances: [] as any[],
      };
      if (isPast) {
        course.enrollments
          .filter((e) => e.status === "active")
          .forEach((enr) => {
            lecture.attendances.push({
              id: RNG.int(1, 999999),
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

// ==========================================
// 3. EXPORTS & CONFIGURATION
// ==========================================

export const MOCK_USER_PROFILES = {
  instructor: { ...INSTRUCTORS[0], role: "instructor" as const },
  student: { ...STUDENTS[0], role: "student" as const },
  parent: { ...PARENTS[0], role: "parent" as const },
  admin: { ...ADMINS[0], role: "admin" as const },
};

/** 
 * CHANGE THIS CONSTANT TO SWITCH DASHBOARDS:
 * 'instructor' | 'student' | 'parent' | 'admin'
 **/
const ACTIVE_ROLE = "student";
export const CURRENT_USER = MOCK_USER_PROFILES[ACTIVE_ROLE];

export const ENROLLMENTS = COURSES.flatMap((c) => c.enrollments);
export const ALL_LECTURES = COURSES.flatMap((c) => c.lectures);
export const LECTURE_ATTENDANCES = ALL_LECTURES.flatMap((l) =>
  l.attendances.map((a: any) => ({ ...a, lecture: l })),
);
export const EXAMS = COURSES.flatMap((c) => c.exams);

export const getLectureById = (id: number) =>
  ALL_LECTURES.find((l) => l.id === id);
export const getEnrollmentsByParticipantId = (id: number | string) =>
  ENROLLMENTS.filter((enr) => enr.student?.id === id || enr.child?.id === id);
export const getMyEnrollments = () => {
  const role = (CURRENT_USER as any).role;
  return ENROLLMENTS.filter((enr) =>
    role === "student"
      ? enr.student?.id === CURRENT_USER.id
      : role === "parent"
        ? enr.child?.primary_parent.id === CURRENT_USER.id
        : role === "admin",
  );
};
export const getOngoingEnrollments = () => {
  const today = new Date(TODAY_DATE_ISO);
  return getMyEnrollments().filter((enr) => {
    if (enr.status !== "active") return false;
    const start = new Date(enr.course.start_date),
      end = enr.course.end_date ? new Date(enr.course.end_date) : null;
    return today >= start && (end === null || today <= end);
  });
};

export const getAttendanceRate = () => {
  const role = (CURRENT_USER as any).role;
  let myAttendances =
    role === "student"
      ? LECTURE_ATTENDANCES.filter((a) => a.student?.id === CURRENT_USER.id)
      : role === "parent"
        ? LECTURE_ATTENDANCES.filter(
            (a) => a.child?.primary_parent.id === CURRENT_USER.id,
          )
        : [];
  return myAttendances.length === 0
    ? 0
    : Math.round(
        (myAttendances.filter((a) => a.present).length / myAttendances.length) *
          100,
      );
};

export const ENROLLMENT_REQUESTS: any[] = [];
ENROLLMENTS.forEach((enr) => {
  if (
    enr.student?.id === student0.id ||
    (child0 && enr.child?.id === child0.id)
  ) {
    ENROLLMENT_REQUESTS.push({
      id: `req-acc-${enr.id}`,
      status: "accepted",
      date: enr.enrolled_at,
      course: enr.course,
      student: enr.student,
      child: enr.child,
      parent: enr.child ? PARENTS[0] : undefined,
      price: enr.course.price,
    });
  }
});

export const getMyEnrollmentRequests = () => {
  const role = (CURRENT_USER as any).role;
  return ENROLLMENT_REQUESTS.filter((req) =>
    role === "student"
      ? req.student?.id === CURRENT_USER.id
      : role === "parent"
        ? req.parent?.id === CURRENT_USER.id
        : role === "admin",
  );
};
export const getPendingEnrollments = () =>
  getMyEnrollmentRequests().filter((req) =>
    ["pending", "processing"].includes(req.status),
  );

export const TODAYS_SCHEDULE = COURSES.filter(
  (c) => c.instructor.id === CURRENT_USER.id,
)
  .flatMap((c) => c.lectures)
  .filter((l) => l.date.startsWith(TODAY_DATE_ISO))
  .map((l) => ({
    ...l,
    course_title: l.course.title,
    course_image: l.course.images.cover,
    start_time:
      l.course.schedule.find(
        (s) => DAY_MAP[s.day] === new Date(l.date).getDay(),
      )?.start || "10:00",
    end_time:
      l.course.schedule.find(
        (s) => DAY_MAP[s.day] === new Date(l.date).getDay(),
      )?.end || "12:00",
  }));

export const MY_COURSES = COURSES.filter(
  (c) => c.instructor.id === CURRENT_USER.id,
);
export const LANDING_PAGE_COURSES = COURSES.slice(0, 6).map((c, i) => ({
  order: i + 1,
  course: c,
}));
export const LANDING_PAGE_INSTRUCTORS = INSTRUCTORS.slice(0, 4).map(
  (inst, i) => ({ order: i + 1, instructor: inst }),
);
