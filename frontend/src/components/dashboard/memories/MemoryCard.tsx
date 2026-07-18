import { MemoryListItem } from "@/types/entities";
import { getFullImageUrl } from "@/lib/image-utils";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar"; // Assuming you have this

interface Props {
  memory: MemoryListItem;
  onClick: () => void;
}

export default function MemoryCard({ memory, onClick }: Props) {
  const imageUrl =
    getFullImageUrl(memory.thumbnail_url || memory.file_url) || "";

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Placeholder avatar based on first letter or use a default one */}
        <div className="bg-olive-100 text-olive-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold">
          {memory.uploader_name ? memory.uploader_name[0] : "م"}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">
            {memory.uploader_name || "مستخدم غير معروف"}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(memory.created_at)}
          </span>
        </div>
      </div>

      {/* Post Media */}
      <div
        className="relative flex max-h-[600px] min-h-[300px] w-full cursor-pointer items-center justify-center bg-black"
        onClick={onClick}
      >
        <Image
          src={imageUrl}
          alt={memory.caption || "Memory"}
          width={800}
          height={600}
          className="h-auto max-h-[600px] w-full object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw"
        />

        {memory.media_type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40">
            <div className="flex h-16 w-16 transform items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
              <div className="ml-2 h-0 w-0 border-t-[10px] border-b-[10px] border-l-[16px] border-t-transparent border-b-transparent border-l-gray-900" />
            </div>
          </div>
        )}
      </div>

      {/* Post Footer / Description */}
      {memory.caption && (
        <div className="p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">
            <span className="ml-2 font-semibold">{memory.uploader_name}</span>
            {memory.caption}
          </p>
        </div>
      )}
    </div>
  );
}
