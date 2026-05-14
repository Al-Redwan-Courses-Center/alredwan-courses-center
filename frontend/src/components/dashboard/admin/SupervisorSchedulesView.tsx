"use client";

import { deleteSupervisorSchedule } from "@/actions/supervisor-schedules";
import SupervisorScheduleFormDialog from "@/components/dashboard/admin/SupervisorScheduleFormDialog";
import Button from "@/components/ui/Button";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBodyLegacy from "@/components/ui/data-view/DataViewBody";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewControls from "@/components/ui/data-view/DataViewControls";
import {
  DataViewHeaderLegacy,
  DataViewRowLegacy,
} from "@/components/ui/data-view/DataViewRow";
import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import {
  Modal,
  ModalContent,
  ModalTitle,
} from "@/components/ui/Modal";
import { formatTime, getWeekDay, toHindiDigits } from "@/lib/utils";
import { Instructor } from "@/types/entities/instructors";
import { SupervisorScheduleRow } from "@/types/entities/supervisor-schedule";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

function ScheduleRow({
  row,
  index,
  instructors,
  onEdit,
  onAskDelete,
}: {
  row: SupervisorScheduleRow;
  index: number;
  instructors: Instructor[];
  onEdit: (row: SupervisorScheduleRow) => void;
  onAskDelete: (row: SupervisorScheduleRow) => void;
}) {
  const name =
    row.instructor_name ??
    instructors.find((i) => i.id === row.instructor)?.name ??
    `— (${row.instructor})`;

  return (
    <DataViewRowLegacy index={index}>
      <DataViewCellLegacy>{toHindiDigits(index + 1)}</DataViewCellLegacy>
      <DataViewCellLegacy>{getWeekDay(row.day_of_week)}</DataViewCellLegacy>
      <DataViewCellLegacy className="font-semibold">{name}</DataViewCellLegacy>
      <DataViewCellLegacy>{formatTime(row.start_time)}</DataViewCellLegacy>
      <DataViewCellLegacy>{formatTime(row.end_time)}</DataViewCellLegacy>
      <DataViewCellLegacy>
        {toHindiDigits(row.grace_period_minutes)}
      </DataViewCellLegacy>
      <DataViewCellLegacy>
        {toHindiDigits(row.auto_absent_after_minutes)}
      </DataViewCellLegacy>
      <DataViewCellLegacy className="flex flex-wrap gap-3 py-2">
        <Button size="small" variant="light" onClick={() => onEdit(row)}>
          تعديل
        </Button>
        <Button
          size="small"
          variant="secondary"
          onClick={() => onAskDelete(row)}
        >
          حذف
        </Button>
      </DataViewCellLegacy>
    </DataViewRowLegacy>
  );
}

export default function SupervisorSchedulesView({
  schedules: initialSchedules,
  instructors,
}: {
  schedules: SupervisorScheduleRow[];
  instructors: Instructor[];
}) {
  const router = useRouter();

  const sortedSchedules = useMemo(
    () =>
      [...initialSchedules].sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
          return a.day_of_week - b.day_of_week;
        }
        return a.start_time.localeCompare(b.start_time);
      }),
    [initialSchedules],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupervisorScheduleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupervisorScheduleRow | null>(
    null,
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  function openEdit(row: SupervisorScheduleRow) {
    setEditing(row);
    setFormOpen(true);
  }

  function openCreateModal() {
    setEditing(null);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      const res = await deleteSupervisorSchedule(deleteTarget.id);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("تم الحذف");
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setDeleteSubmitting(false);
    }
  }

  const emptyInstructors = instructors.length === 0;

  return (
    <div className="flex flex-col gap-10">
      <div className="relative z-[220] isolate mb-2 flex flex-wrap items-center justify-between gap-8 select-none">
        <p className="text-olive-700 max-w-[60ch] min-w-0 flex-1 text-2xl leading-relaxed select-text">
          جدول أسبوعي لورديات الإشراف: اليوم (0 = الأحد … 6 = السبت)، وقت
          البداية والنهاية، فترة السماح بالدقائق، ومهلة تسجيل الغياب التلقائي.
        </p>
        <Button
          size="medium"
          className="shrink-0 touch-manipulation select-none"
          onClick={(e) => {
            e.preventDefault();
            openCreateModal();
          }}
        >
          إضافة جدول
        </Button>
      </div>

      {emptyInstructors && (
        <p className="text-[#952B2B] mt-2 text-2xl select-text">
          لم يُرجع الـ API أي معلمين في القائمة. تحقق من المسار{" "}
          <code className="rounded bg-gray-200 px-2 py-1 text-xl">
            /api/users/instructors/
          </code>{" "}
          والصلاحيات، ثم حدّث الصفحة.
        </p>
      )}

      <DataView
        gridLayout="grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.5fr)_minmax(0,0.6fr)_minmax(0,1fr)]"
        data={sortedSchedules}
        filterConfig={{}}
        sortConfig={{}}
        maxItemsPerPage={12}
      >
        <DataViewControls showSort={false} showFilter={false} />
        <DataViewHeaderLegacy>
          <DataViewCellLegacy>م</DataViewCellLegacy>
          <DataViewCellLegacy>اليوم</DataViewCellLegacy>
          <DataViewCellLegacy>المشرف</DataViewCellLegacy>
          <DataViewCellLegacy>البداية</DataViewCellLegacy>
          <DataViewCellLegacy>النهاية</DataViewCellLegacy>
          <DataViewCellLegacy>السماح (د)</DataViewCellLegacy>
          <DataViewCellLegacy>غياب (د)</DataViewCellLegacy>
          <DataViewCellLegacy />
        </DataViewHeaderLegacy>
        <DataViewBodyLegacy<SupervisorScheduleRow>
          render={{
            table: (item, i) => (
              <ScheduleRow
                key={item.id}
                row={item}
                index={i}
                instructors={instructors}
                onEdit={openEdit}
                onAskDelete={setDeleteTarget}
              />
            ),
            cards: () => null,
          }}
        />
        <DataViewPaginationLegacy />
      </DataView>

      <SupervisorScheduleFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        editing={editing}
        instructors={instructors}
        onSuccess={() => router.refresh()}
      />

      <Modal open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <ModalContent className="w-[min(96vw,40rem)]">
          <ModalTitle>تأكيد الحذف</ModalTitle>
          <p className="px-5 text-2xl leading-relaxed">
            حذف جدول{" "}
            {deleteTarget
              ? `${getWeekDay(deleteTarget.day_of_week)} — ${formatTime(deleteTarget.start_time)}`
              : ""}
            ؟
          </p>
          <div className="flex justify-end gap-4 px-5 pb-8">
            <Button
              variant="secondary"
              size="small"
              disabled={deleteSubmitting}
              onClick={() => setDeleteTarget(null)}
            >
              إلغاء
            </Button>
            <Button
              size="small"
              loading={deleteSubmitting}
              onClick={() => void confirmDelete()}
            >
              حذف نهائياً
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
