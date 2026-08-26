"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDebounceValue } from "usehooks-ts";
import {
  createMemoryAction,
  getCloudinarySignatureAction,
  searchParticipants,
} from "@/actions/memories";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";
import type { ParticipantSearchResult } from "@/types/entities";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/") || file.size < 1024 * 1024) return file; // Only compress images > 1MB

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX_SIZE = 1920;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob)
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            else resolve(file);
          },
          "image/jpeg",
          0.8,
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function MemoryUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounceValue(searchQuery, 500);
  const [searchResults, setSearchResults] = useState<ParticipantSearchResult[]>(
    [],
  );
  const [selectedParticipants, setSelectedParticipants] = useState<
    ParticipantSearchResult[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchParticipants(debouncedSearch).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const handleUpload = async () => {
    if (!file) return toast.error("يرجى اختيار ملف");

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get Cloudinary Signature securely via Server Action
      const sigRes = await getCloudinarySignatureAction();
      if (!sigRes.ok || !sigRes.data) {
        setIsUploading(false);
        return toast.error(sigRes.message || "فشل في الحصول على توقيع الرفع");
      }
      const { signature, timestamp, cloud_name, api_key } = sigRes.data;

      // 2. Compress and Upload to Cloudinary public endpoint
      const fileToUpload = await compressImage(file);
      const cldFormData = new FormData();
      cldFormData.append("file", fileToUpload);
      cldFormData.append("api_key", api_key);
      cldFormData.append("timestamp", String(timestamp));
      cldFormData.append("signature", signature);
      cldFormData.append("folder", "memories");

      const cldData = await new Promise<{ public_id: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
          );

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300)
              resolve(JSON.parse(xhr.responseText));
            else reject(new Error("فشل رفع الملف إلى الخادم السحابي"));
          };

          xhr.onerror = () => reject(new Error("حدث خطأ في الاتصال بالشبكة"));
          xhr.send(cldFormData);
        },
      );

      // 3. Save memory via Server Action (no client token exposure)
      setUploadProgress(100);

      const childrenIds = selectedParticipants
        .filter((p) => p.type === "child")
        .map((p) => p.id);
      const studentIds = selectedParticipants
        .filter((p) => p.type === "student")
        .map((p) => p.id);

      const createRes = await createMemoryAction({
        file: cldData.public_id,
        media_type: fileToUpload.type.startsWith("video/") ? "video" : "image",
        caption: caption || undefined,
        children: childrenIds,
        students: studentIds,
      });

      setIsUploading(false);

      if (createRes.ok) {
        toast.success("تم الرفع بنجاح");
        setFile(null);
        setCaption("");
        setSelectedParticipants([]);
        setUploadProgress(0);
        onUploadSuccess();
      } else {
        toast.error(createRes.message || "فشل تسجيل الرفع في النظام");
      }
    } catch (err: unknown) {
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage =
        err instanceof Error ? err.message : "حدث خطأ في الاتصال";
      toast.error(errorMessage);
    }
  };

  const toggleParticipant = (p: ParticipantSearchResult) => {
    if (selectedParticipants.some((sp) => sp.id === p.id)) {
      setSelectedParticipants((prev) => prev.filter((sp) => sp.id !== p.id));
    } else {
      setSelectedParticipants((prev) => [...prev, p]);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-xl">
        <ModalHeader>
          <ModalTitle>إضافة ذكرى جديدة</ModalTitle>
        </ModalHeader>

        <div className="space-y-6 py-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              الصورة أو الفيديو
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-olive-50 file:text-olive-700 hover:file:bg-olive-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              تعليق (اختياري)
            </label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="اكتب تعليقاً على الذكرى..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              الإشارة للطلاب/الأطفال (اختياري)
            </label>
            <Input
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الكود..."
            />

            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md divide-y">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                    onClick={() => toggleParticipant(p)}
                  >
                    <span>
                      {p.name}{" "}
                      <span className="text-xs text-gray-500">({p.code})</span>
                    </span>
                    {selectedParticipants.some((sp) => sp.id === p.id) && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedParticipants.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedParticipants.map((p) => (
                  <span
                    key={p.id}
                    className="bg-olive-100 text-olive-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    {p.name}
                    <button
                      onClick={() => toggleParticipant(p)}
                      className="text-olive-500 hover:text-olive-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-olive-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {uploadProgress}%
              </span>
            </div>
          )}
          <Button variant="secondary" onClick={onClose} disabled={isUploading}>
            إلغاء
          </Button>
          <Button
            onClick={handleUpload}
            loading={isUploading}
            disabled={!file || isUploading}
          >
            رفع
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
