"use client";

import Accordion from "@/components/ui/accordion/Accordion";
import AccordionItem from "@/components/ui/accordion/AccordionItem";
import AccordionHeader from "@/components/ui/accordion/AccordionHeader";
import AccordionHeaderInfo from "@/components/ui/accordion/AccordionHeaderInfo";
import AccordionContent from "@/components/ui/accordion/AccordionContent";
import StudentHeaderInfo from "@/components/ui/StudentHeaderInfo";
import StarIcon from "@/components/icons/StarIcon";
import CheckIcon from "@/components/icons/CheckIcon";

/* =======================
   Fake Data
======================= */

const courses = [
  {
    id: "course-1",
    title: "1- الدورة 1",
    subtitle: "الاحد \\ الاربعاء",
    rows: [
      [
        { label: "الدورة", value: "الدورة 1" },
        { label: "الموسم", value: "رمضان" },
      ],
      [
        {
          label: "الاحد",
          value: "من 8:00 مـ الي 10:00 مـ",
          indent: true,
        },
      ],
      [
        {
          label: "الاربعاء",
          value: "من 6:00 مـ الي 8:00 مـ",
          indent: true,
        },
      ],
    ],
  },
  {
    id: "course-2",
    title: "2- الدورة 2",
    subtitle: "السبت \\ الثلاثاء",
  },
];

const lectures = [
  {
    id: "lecture-1",
    title: "1- المحاضرة 1",
    subtitle: "الاحد \\ الاربعاء",
    rows: [
      [
        { label: "البداية", value: "8:00 مـ" },
        { label: "النهاية", value: "10:00 مـ" },
      ],
      [
        {
          label: "الحضور",
          value: "سجلت",
          valueClassName: "text-green-600",
          className: "w-28",
        },
        { label: "التاريخ", value: "1\\2\\2026" },
      ],
    ],
  },
  {
    id: "lecture-2",
    title: "2- المحاضرة 2",
    subtitle: "السبت \\ الثلاثاء",
  },
];

const lectureStatus = [
  {
    id: "ls-1",
    title: "1- المحاضرة 1",
  },
  {
    id: "ls-2",
    title: "2- المحاضرة 2",
  },
  {
    id: "ls-3",
    title: "3- المحاضرة 3",
    rows: [
      [
        {
          label: "الدورة",
          value: "الدورة 1",
          labelClassName: "text-lg",
          variant: "large" as const,
        },
        {
          label: "الحالة",
          value: "لم تسجل",
          valueClassName: "text-red-600",
          labelClassName: "text-lg",
          variant: "large" as const,
        },
      ],
      [
        {
          label: "البداية",
          value: "8:00 مـ",
          labelClassName: "text-lg",
          variant: "large" as const,
        },
        {
          label: "النهاية",
          value: "10:00 مـ",
          labelClassName: "text-lg",
          variant: "large" as const,
        },
      ],
    ],
  },
];

const students = [
  { id: "s1", name: "محمد احمد", number: 1 },
  { id: "s2", name: "احمد علي", number: 2 },
  {
    id: "s3",
    name: "علي حسن",
    number: 3,
    rows: [
      [
        {
          label: "الكود",
          value: "B54786",
          valueClassName: "font-bold text-base",
        },
        { label: "السن", value: "10" },
      ],
      [
        {
          label: "الحضور",
          value: <CheckIcon className="text-olive-600 h-5 w-5" />,
          className: "w-28",
        },
        {
          label: "التقيم",
          value: <StarIcon className="h-5 w-5 text-yellow-400" />,
        },
      ],
    ],
  },
];

/* =======================
   Page Component
======================= */

export default function Page() {
  return (
    <div className="container mx-auto space-y-16 px-4 py-10">
      {/* Courses */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">1. الدورات</h2>
        <div className="max-w-md">
          <Accordion>
            {courses.map((course) => (
              <AccordionItem
                key={course.id}
                id={course.id}
                rounded="top-left"
                header={(isOpen) => (
                  <AccordionHeader isOpen={isOpen}>
                    <AccordionHeaderInfo
                      title={course.title}
                      subtitle={course.subtitle}
                    />
                  </AccordionHeader>
                )}
              >
                {course.rows && <AccordionContent rows={course.rows} />}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Lectures */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">2. المحاضرات</h2>
        <div className="max-w-md">
          <Accordion>
            {lectures.map((lecture) => (
              <AccordionItem
                key={lecture.id}
                id={lecture.id}
                rounded="top-left-bottom-right"
                header={(isOpen) => (
                  <AccordionHeader isOpen={isOpen}>
                    <AccordionHeaderInfo
                      title={lecture.title}
                      subtitle={lecture.subtitle}
                      subtitleClassName="text-[8px]"
                    />
                  </AccordionHeader>
                )}
              >
                {lecture.rows && (
                  <AccordionContent
                    rows={lecture.rows}
                    actions={{
                      onEdit: () => console.log("Edit", lecture.id),
                      onDelete: () => console.log("Delete", lecture.id),
                      onInfo: () => console.log("Info", lecture.id),
                    }}
                  />
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Lecture Status */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">3. حالة المحاضرات</h2>
        <div className="max-w-md">
          <Accordion>
            {lectureStatus.map((item) => (
              <AccordionItem
                key={item.id}
                id={item.id}
                shadow
                rounded="top-left-bottom-right"
                header={(isOpen) => (
                  <AccordionHeader isOpen={isOpen}>
                    <AccordionHeaderInfo title={item.title} />
                  </AccordionHeader>
                )}
              >
                {item.rows && (
                  <AccordionContent
                    rows={item.rows}
                    actions={{
                      onEdit: () => console.log("Edit", item.id),
                      onDelete: () => console.log("Delete", item.id),
                      onInfo: () => console.log("Info", item.id),
                    }}
                  />
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Students */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">4. الطلاب</h2>
        <div className="max-w-md">
          <Accordion>
            {students.map((student) => (
              <AccordionItem
                key={student.id}
                id={student.id}
                rounded="top-left-bottom-right"
                header={(isOpen) => (
                  <AccordionHeader isOpen={isOpen}>
                    <StudentHeaderInfo
                      name={student.name}
                      number={student.number}
                    />
                  </AccordionHeader>
                )}
              >
                {student.rows && (
                  <AccordionContent
                    rows={student.rows}
                    footer={
                      <div className="flex justify-end gap-6">
                        <span className="font-messiri text-xl">
                          الملاحظات :
                        </span>
                      </div>
                    }
                  />
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
