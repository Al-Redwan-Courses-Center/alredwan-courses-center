"use client";

import { useState } from "react";
import { CourseListItem, OnlineCourseListItem } from "@/types/entities";
import { UserEntity } from "@/types/auth";
import PublicCourseCard from "@/components/courses/PublicCourseCard";
import OnlineCourseCard from "./OnlineCourseCard";

interface OnlineCourseCatalogProps {
  physical: CourseListItem[];
  online: OnlineCourseListItem[];
  user: UserEntity;
}

export default function OnlineCourseCatalog({
  physical,
  online,
  user,
}: OnlineCourseCatalogProps) {
  const [activeTab, setActiveTab] = useState<"physical" | "online">("online");

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-8 mb-12 w-full mt-4">
        <h1 className="text-5xl font-extrabold text-gray-900">معرض الدورات</h1>
        
        <div className="flex w-full max-w-4xl rounded-xl bg-gray-100 p-3 shadow-md">
          <button
            onClick={() => setActiveTab("online")}
            className={`flex-1 py-6 text-2xl font-bold rounded-lg transition-all ${
              activeTab === "online"
                ? "bg-white text-brand-primary shadow-lg scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            الدورات الإلكترونية
          </button>
          <button
            onClick={() => setActiveTab("physical")}
            className={`flex-1 py-6 text-2xl font-bold rounded-lg transition-all ${
              activeTab === "physical"
                ? "bg-white text-brand-primary shadow-lg scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            الدورات الحضورية
          </button>
        </div>
      </div>

      {activeTab === "online" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {online.length > 0 ? (
            online.map((course) => (
              <OnlineCourseCard key={course.id} course={course} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500">
              لا توجد دورات إلكترونية متاحة حالياً
            </div>
          )}
        </div>
      )}

      {activeTab === "physical" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {physical.length > 0 ? (
            physical.map((course, i) => (
              <PublicCourseCard key={course.id} course={course} index={i} linkTo="dashboard" />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500">
              لا توجد دورات حضورية متاحة حالياً
            </div>
          )}
        </div>
      )}
    </div>
  );
}
