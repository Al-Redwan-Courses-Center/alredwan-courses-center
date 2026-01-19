import { cn } from "@/lib/utils";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      toastOptions={{
        className: cn("shadow-primary text-3xl"),
      }}
    />
  );
}
