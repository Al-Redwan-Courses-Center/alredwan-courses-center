import Loader from "@/components/ui/Loader";

export default function Loading() {
  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
      <div className="h-24 w-24">
        <Loader />
      </div>
    </div>
  );
}
