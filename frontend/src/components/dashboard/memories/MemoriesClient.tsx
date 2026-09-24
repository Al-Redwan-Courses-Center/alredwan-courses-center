"use client";

import { useCallback, useState } from "react";
import { getGeneralMemories, getPrivateMemories } from "@/actions/memories";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import type { MemoryListItem } from "@/types/entities";
import Lightbox from "./Lightbox";
import MemoryCard from "./MemoryCard";
import MemoryUploadModal from "./MemoryUploadModal";

interface Props {
  initialMemories: MemoryListItem[];
  initialHasMore?: boolean;
  role: string;
}

const PAGE_SIZE = 12;

export default function MemoriesClient({
  initialMemories,
  initialHasMore = true,
  role,
}: Props) {
  const [memories, setMemories] = useState<MemoryListItem[]>(initialMemories);
  const [activeTab, setActiveTab] = useState<"general" | "private">("general");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const isSupervisor = role === "supervisor";
  const hasPrivateFeed = role === "parent" || role === "student";

  const fetchTabMemories = async (tab: "general" | "private") => {
    setLoading(true);
    setActiveTab(tab);
    setPage(1);
    try {
      if (tab === "general") {
        const data = await getGeneralMemories(1, PAGE_SIZE);
        setMemories(data.results);
        setHasMore(Boolean(data.next) && data.results.length > 0);
      } else {
        const data = await getPrivateMemories(undefined, 1, PAGE_SIZE);
        setMemories(data.results);
        setHasMore(Boolean(data.next) && data.results.length > 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading || isFetchingMore) return;

    setIsFetchingMore(true);
    const nextPage = page + 1;

    try {
      if (activeTab === "general") {
        const data = await getGeneralMemories(nextPage, PAGE_SIZE);
        if (data.results.length > 0) {
          setMemories((prev) => [...prev, ...data.results]);
          setPage(nextPage);
          setHasMore(Boolean(data.next));
        } else {
          setHasMore(false);
        }
      } else {
        const data = await getPrivateMemories(undefined, nextPage, PAGE_SIZE);
        if (data.results.length > 0) {
          setMemories((prev) => [...prev, ...data.results]);
          setPage(nextPage);
          setHasMore(Boolean(data.next));
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to load more memories:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [activeTab, hasMore, isFetchingMore, loading, page]);

  const loadMoreRef = useIntersectionObserver({
    enabled: hasMore && !loading && !isFetchingMore,
    onIntersect: handleLoadMore,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4">
          <Button
            variant={activeTab === "general" ? "primary" : "secondary"}
            onClick={() => fetchTabMemories("general")}
          >
            الصور العامة
          </Button>
          {hasPrivateFeed && (
            <Button
              variant={activeTab === "private" ? "primary" : "secondary"}
              onClick={() => fetchTabMemories("private")}
            >
              ذكرياتي الخاصة
            </Button>
          )}
        </div>

        {isSupervisor && (
          <Button onClick={() => setIsUploadModalOpen(true)}>إضافة ذكرى</Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader thickness="4px" />
        </div>
      ) : memories.length === 0 ? (
        <EmptyState
          title="لا توجد ذكريات بعد"
          description="لم يتم إضافة أي ذكريات في هذا القسم."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {memories.map((memory, index) => (
            <MemoryCard
              key={`${memory.id}-${index}`}
              memory={memory}
              onClick={() => setLightboxIndex(index)}
            />
          ))}

          {isFetchingMore && (
            <div className="flex justify-center py-6">
              <Loader thickness="3px" />
            </div>
          )}

          {hasMore && !isFetchingMore && (
            <div ref={loadMoreRef} aria-hidden="true" className="h-4 w-full" />
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          memories={memories}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onMemoryDeleted={(id) => {
            setMemories((prev) => prev.filter((m) => m.id !== id));
            setLightboxIndex(null);
          }}
          isSupervisor={isSupervisor}
        />
      )}

      <MemoryUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          setIsUploadModalOpen(false);
          fetchTabMemories(activeTab);
        }}
      />
    </div>
  );
}
