import Image from "next/image";
import { getFullImageUrl } from "@/lib/image-utils";
import { formatDate } from "@/lib/utils";
import type { MemoryListItem } from "@/types/entities";

interface Props {
  memory: MemoryListItem;
  onClick: () => void;
}

export default function MemoryCard({ memory, onClick }: Props) {
  const imageUrl =
    getFullImageUrl(memory.thumbnail_url || memory.file_url) || "";

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8 transition-all duration-300 hover:shadow-md hover:border-olive-200 group"
    >      {/* Post Header */}
      <div className="flex items-center gap-4 p-5">
        {/* Placeholder avatar based on first letter or use a default one */}
        <div className="h-12 w-12 rounded-full bg-olive-100 flex items-center justify-center text-olive-700 font-bold text-lg shrink-0">
          {memory.uploader_name ? memory.uploader_name[0] : "م"}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 text-base">            {memory.uploader_name || "مستخدم غير معروف"}
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(memory.created_at)}
          </span>
        </div>
      </div>

      {/* Post Media */}
      <div 
        className="relative w-full bg-gray-50 flex items-center justify-center cursor-pointer max-h-[600px] min-h-[300px] overflow-hidden"        onClick={onClick}
      >
        <Image
          src={imageUrl}
          alt={memory.caption || "Memory"}
          width={800}
          height={600}
          className="object-contain w-full h-auto max-h-[600px] transition-transform duration-500 group-hover:scale-[1.02]"          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw"
        />

        {memory.media_type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
            <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-gray-900 border-b-[10px] border-b-transparent ml-2" />            </div>
          </div>
        )}
      </div>

      {/* Post Footer / Description */}
      {memory.caption && (
        <div className="p-5 bg-white">
          <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
            <span className="font-bold ml-2 text-gray-900">{memory.uploader_name}</span>            {memory.caption}
          </p>
        </div>
      )}
    </div>
  );
}
