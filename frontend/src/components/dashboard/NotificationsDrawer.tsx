import type { ReactNode } from "react";
//import NotificationBellIcon from "@/components/icons/NotificationWithBadgeIcon";
import NotificationBellIcon from "@/components/icons/NotificationBellIcon";
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
        <NotificationBellIcon className="text-olive-500 transition-colors hover:text-olive-300" />
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
