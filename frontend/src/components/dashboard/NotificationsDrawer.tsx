import type { ReactNode } from "react";
import NotificationWithBadgeIcon from "@/components/icons/NotificationWithBadgeIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/utils";

const baseStyles = cn(
  "shadow-soft w-105 rounded-[2rem_0] bg-gray-50 text-[1.8rem] transition-colors",
);

export default function NotificationsDrawer({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(className)}>
        <NotificationWithBadgeIcon className="text-olive-500 hover:text-olive-300 transition-colors" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(baseStyles, "relative top-8 rounded-none border-none")}
      >
        <DropdownMenuLabel>إشعارات اليوم</DropdownMenuLabel>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
