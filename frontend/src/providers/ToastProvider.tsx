import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function ToastProvider() {
  return (
    <Toaster
      toastOptions={{
        className: cn("shadow-primary text-3xl"),
      }}
    />
  );
}
