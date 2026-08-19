import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onInfo?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showInfo?: boolean;
  className?: string;
}

function ActionButtons({
  onEdit,
  onDelete,
  onInfo,
  showEdit = true,
  showDelete = true,
  showInfo = true,
  className,
}: ActionButtonsProps) {
  return (
    <div className={cn("flex items-center justify-end gap-3", className)}>
      {showInfo && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInfo?.();
          }}
          className="text-olive-400 hover:text-olive-500 transition-colors"
          aria-label="معلومات"
        >
          <InfoIcon className="h-6 w-6" />
        </button>
      )}
      {showEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="text-olive-400 hover:text-olive-500 transition-colors"
          aria-label="تعديل"
        >
          <EditIcon className="h-6 w-6" />
        </button>
      )}
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="text-red-500 transition-colors hover:text-red-600"
          aria-label="حذف"
        >
          <TrashIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

export default ActionButtons;
