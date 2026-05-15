"use client";

import { ParentChildDetail } from "@/actions/user";
import ChildFormModal from "@/components/dashboard/parent/ChildFormModal";
import DeleteChildDialog from "@/components/dashboard/parent/DeleteChildDialog";
import EditIcon from "@/components/icons/EditIcon";
import { cn } from "@/lib/utils";

interface ParentChildCrudActionsProps {
  child: ParentChildDetail;
  className?: string;
  showEdit?: boolean;
  showDelete?: boolean;
}

export default function ParentChildCrudActions({
  child,
  className,
  showEdit = true,
  showDelete = true,
}: ParentChildCrudActionsProps) {
  return (
    <div className={cn("flex items-center justify-end gap-3", className)}>
      {showEdit && (
        <ChildFormModal
          mode="edit"
          child={child}
          trigger={
            <button
              className="text-olive-400 hover:text-olive-500 transition-colors"
              aria-label="تعديل الطفل"
              title={`تعديل ${child.first_name}`}
            >
              <EditIcon className="h-6 w-6" />
            </button>
          }
        />
      )}

      {showDelete && <DeleteChildDialog child={child} />}
    </div>
  );
}
