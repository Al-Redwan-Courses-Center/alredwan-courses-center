import { MemoryListItem } from "@/types/entities";
import { getFullImageUrl } from "@/lib/image-utils";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

interface Props {
  memory: MemoryListItem;
  onClick: () => void;
}

export default function MemoryCard({ memory, onClick }: Props) {
  const imageUrl = getFullImageUrl(memory.thumbnail_url || memory.file_url) || "";
  
  return (
    <div 
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md border border-gray-100"
      onClick={onClick}
    >
      <div className="aspect-square w-full relative bg-gray-50">
        <Image 
          src={imageUrl} 
          alt={memory.caption || "Memory"} 
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {memory.media_type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-black border-b-[8px] border-b-transparent ml-1" />
            </div>
          </div>
        )}
      </div>
      
      {(memory.caption || memory.uploader_name) && (
        <div className="p-4 space-y-1">
          {memory.caption && (
            <p className="text-sm font-medium text-gray-900 line-clamp-2">
              {memory.caption}
            </p>
          )}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{memory.uploader_name}</span>
            <span>{formatDate(memory.created_at)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
