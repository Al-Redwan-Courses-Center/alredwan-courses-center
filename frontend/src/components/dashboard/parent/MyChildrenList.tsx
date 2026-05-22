"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { ParentChildDetail, getChildEnrollmentRequests } from "@/actions/user";
import ChildCard from "@/components/dashboard/parent/ChildCard";
import Button from "@/components/ui/Button";
import AddChildForm from "@/components/dashboard/parent/AddChildForm";
import ItemCard from "@/components/ui/ItemCard";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";
import { toHindiDigits } from "@/lib/utils";
import EnrollmentRequestsList from "@/components/dashboard/enrollments/EnrollmentRequestsList";
import {
  Modal,
  ModalContent,
  ModalTitle,
} from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { EnrollmentRequestListItem } from "@/types/entities";

function AddChildCard({ onClick }: { onClick: () => void }) {
  return (
    <ItemCard
      shape="square"
      index={0}
      className="border-2 border-dashed border-olive-300 hover:border-olive-500 hover:bg-olive-50/20 transition-all cursor-pointer h-full min-h-[35rem]"
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full h-full flex flex-col items-center justify-center text-center gap-6 py-12 focus:outline-hidden cursor-pointer"
      >
        <div className="w-20 h-20 rounded-full bg-olive-100 flex items-center justify-center text-olive-700 shadow-sm">
          <Plus size={40} />
        </div>
        <span className="text-3xl font-bold text-olive-700">إضافة طفل جديد</span>
        <p className="text-2xl text-gray-500 max-w-[24rem] leading-relaxed">
          أضف بيانات طفلك للبدء بالتسجيل في الحلقات والدورات بسهولة.
        </p>
      </button>
    </ItemCard>
  );
}

export default function MyChildrenList({
  initialChildren,
}: {
  initialChildren: ParentChildDetail[];
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ParentChildDetail | null>(null);
  
  // State for tabbed enrollment requests
  const [activeTab, setActiveTab] = useState<string>("all");
  const [allRequests, setAllRequests] = useState<{ [childId: string]: EnrollmentRequestListItem[] }>({});
  const [loading, setLoading] = useState(true);

  // Fetch enrollment requests for all children in parallel
  useEffect(() => {
    let active = true;
    Promise.all(
      initialChildren.map((c) =>
        getChildEnrollmentRequests(c.id).then((data) => ({ childId: c.id, data }))
      )
    ).then((results) => {
      if (!active) return;
      const mapping: { [childId: string]: any[] } = {};
      results.forEach((r) => {
        mapping[r.childId] = r.data;
      });
      setAllRequests(mapping);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [initialChildren]);

  // Determine which enrollment requests to display based on active tab
  const displayedRequests = useMemo(() => {
    const list: EnrollmentRequestListItem[] =
      activeTab === "all"
        ? Object.values(allRequests).flat()
        : allRequests[activeTab] || [];

    return [...list].sort(
      (a, b) =>
        ENROLLMENT_REQUEST_STATUS_WEIGHTS[
          a.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
        ] -
        ENROLLMENT_REQUEST_STATUS_WEIGHTS[
          b.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
        ]
    );
  }, [allRequests, activeTab]);

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Transparent Header matching standard page headers */}
      <div className="pb-6 pt-2 mb-8 flex flex-col gap-2 px-6">
        <h3 className="text-olive-700 font-medad text-6xl">
          إدارة الأطفال
        </h3>
        <p className="text-2xl text-gray-500 tablet-sm:text-xl">
          أضف وتابع المسيرة الدراسية لأطفالك بكل سهولة.
        </p>
      </div>

      {/* Children List Container */}
      <div className="flex-1 overflow-y-auto pt-2 px-6 pb-20">
        {initialChildren.length > 0 ? (
          <div className="flex flex-col gap-16">
            {/* The First Row: Grid of Cards (Add Child + Child Cards) */}
            <div className="grid grid-cols-3 gap-8 tablet:grid-cols-1">
              <div>
                <AddChildCard onClick={() => setIsAddOpen(true)} />
              </div>
              {initialChildren.map((c, i) => (
                <div key={c.id}>
                  <ChildCard
                    index={i}
                    child={c}
                    onEdit={(child) => setEditingChild(child)}
                  />
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="bg-olive-100 mx-auto h-px w-2/3 my-2" />

            {/* Tabbed Enrollment Requests Feed */}
            <div className="flex flex-col gap-8">
              {/* Tab Pills */}
              <div className="flex flex-wrap items-center gap-4 px-6">
                <span className="text-2xl font-bold text-gray-500 me-4">تصفية طلبات الاشتراك:</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "px-8 py-3 rounded-full text-xl font-bold transition-all cursor-pointer",
                    activeTab === "all"
                      ? "bg-olive-700 text-white shadow-md"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  )}
                >
                  الكل ({toHindiDigits(Object.values(allRequests).flat().length)})
                </button>
                {initialChildren.map((c, i) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setActiveTab(c.id)}
                    className={cn(
                      "px-8 py-3 rounded-full text-xl font-bold transition-all cursor-pointer",
                      activeTab === c.id
                        ? "bg-olive-700 text-white shadow-md"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    )}
                  >
                    {`(${toHindiDigits(i + 1)}) ${c.first_name}`} ({toHindiDigits((allRequests[c.id] || []).length)})
                  </button>
                ))}
              </div>

              {/* Feed Content */}
              <div className="relative min-h-[30rem]">
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <span className="text-2xl text-gray-500">جاري تحميل طلبات الاشتراك...</span>
                  </div>
                ) : (
                  <EnrollmentRequestsList
                    enrollments={displayedRequests}
                    listStyles="flex flex-col gap-4 max-h-[45rem] overflow-y-auto"
                    wrapperStyles="*:px-6! ps-0! pb-0"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 gap-6 text-center">
            <span className="text-red-800 text-4xl font-bold">لا يوجد أطفال مسجلين حالياً!</span>
            <p className="text-2xl text-gray-500">ابدأ بإضافة طفلك الأول للبدء في التسجيل في الدورات.</p>
            <Button
              onClick={() => setIsAddOpen(true)}
              className="px-12 py-4"
            >
              إضافة طفل جديد الآن
            </Button>
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      <Modal open={isAddOpen} onOpenChange={setIsAddOpen}>
        <ModalContent
          className={cn(
            "max-w-4xl [&>div,&>form]:px-8 [&>div,&>form]:last:p-[2rem_2rem_3rem_2rem]",
            "tablet-sm:max-w-full tablet-sm:[&>div,&>form]:px-4 tablet-sm:[&>div,&>form]:last:p-[1.5rem_1.5rem_2rem_1.5rem]"
          )}
        >
          <ModalTitle className="text-olive-700 text-center font-bold">إضافة طفل جديد</ModalTitle>
          <div className="p-0">
            <AddChildForm onSuccess={() => setIsAddOpen(false)} />
          </div>
        </ModalContent>
      </Modal>

      {/* Edit Child Modal */}
      <Modal open={!!editingChild} onOpenChange={(open) => !open && setEditingChild(null)}>
        <ModalContent
          className={cn(
            "max-w-4xl [&>div,&>form]:px-8 [&>div,&>form]:last:p-[2rem_2rem_3rem_2rem]",
            "tablet-sm:max-w-full tablet-sm:[&>div,&>form]:px-4 tablet-sm:[&>div,&>form]:last:p-[1.5rem_1.5rem_2rem_1.5rem]"
          )}
        >
          <ModalTitle className="text-olive-700 text-center font-bold">تعديل بيانات الطفل</ModalTitle>
          <div className="p-0">
            {editingChild && (
              <AddChildForm
                initialData={editingChild}
                onSuccess={() => setEditingChild(null)}
              />
            )}
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
