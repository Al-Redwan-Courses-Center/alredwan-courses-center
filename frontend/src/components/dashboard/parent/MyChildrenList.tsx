"use client";

import { useState } from "react";
import { Fragment } from "react";
import { Plus } from "lucide-react";
import { ParentChildDetail } from "@/actions/user";
import ChildRow from "@/components/dashboard/parent/ChildRow";
import Button from "@/components/ui/Button";
import AddChildForm from "@/components/dashboard/parent/AddChildForm";
import {
  Modal,
  ModalContent,
  ModalTitle,
} from "@/components/ui/Modal";

export default function MyChildrenList({
  initialChildren,
}: {
  initialChildren: ParentChildDetail[];
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ParentChildDetail | null>(null);

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Premium Glassmorphic Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md pb-6 pt-2 mb-8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between px-6 border-b border-olive-100/50">
        <div className="flex flex-col gap-1">
          <h3 className="text-olive-700 font-bold text-4xl sm:text-5xl">
            إدارة الأطفال
          </h3>
          <p className="text-lg sm:text-xl text-gray-500">
            أضف وتابع المسيرة الدراسية لأطفالك بكل سهولة.
          </p>
        </div>
        
        {initialChildren.length > 0 && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-olive-600 hover:bg-olive-500 text-white px-8 py-3 sm:py-4 rounded-[1.8rem_0] font-bold text-xl sm:text-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all self-start sm:self-auto w-full sm:w-auto"
          >
            <Plus size={20} />
            إضافة طفل جديد
          </Button>
        )}
      </div>

      {/* Children List Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-20">
        {initialChildren.length > 0 ? (
          initialChildren.map((c, i) => (
            <Fragment key={c.id}>
              <ChildRow
                child={c}
                index={i}
                onEdit={(child) => setEditingChild(child)}
              />

              {i + 1 < initialChildren.length && (
                <div className="bg-olive-100 mx-auto my-10 h-px w-2/3" />
              )}
            </Fragment>
          ))
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
        <ModalContent className="sm:max-w-2xl [&>div,&>form]:px-4 sm:[&>div,&>form]:px-20 [&>div,&>form]:last:p-[1.5rem_1.5rem_2rem_1.5rem] sm:[&>div,&>form]:last:p-[2rem_5rem_5rem_5rem]">
          <ModalTitle className="text-olive-700 text-center font-bold">إضافة طفل جديد</ModalTitle>
          <div className="p-0">
            <AddChildForm onSuccess={() => setIsAddOpen(false)} />
          </div>
        </ModalContent>
      </Modal>

      {/* Edit Child Modal */}
      <Modal open={!!editingChild} onOpenChange={(open) => !open && setEditingChild(null)}>
        <ModalContent className="sm:max-w-2xl [&>div,&>form]:px-4 sm:[&>div,&>form]:px-20 [&>div,&>form]:last:p-[1.5rem_1.5rem_2rem_1.5rem] sm:[&>div,&>form]:last:p-[2rem_5rem_5rem_5rem]">
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
