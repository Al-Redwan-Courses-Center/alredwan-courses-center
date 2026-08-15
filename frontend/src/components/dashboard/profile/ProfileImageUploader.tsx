"use client";

import { Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadProfileImage } from "@/actions/profile";
import Image from "next/image";

export default function ProfileImageUploader({
  initialImage,
  firstName,
}: {
  initialImage?: string | null;
  firstName: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(
    initialImage || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const { error, data } = await uploadProfileImage(formData);

      if (error) {
        toast.error(error);
        setPreviewImage(initialImage || null);
      } else {
        toast.success("تم تحديث الصورة بنجاح");
        if (data?.profile_image) {
          setPreviewImage(data.profile_image);
        }
        router.refresh();
      }
    } catch (error: any) {
      console.error("Upload error details:", error);
      toast.error("حدث خطأ أثناء رفع الصورة");
      setPreviewImage(initialImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="group relative">
      <div className="bg-olive-100 border-olive-500 relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-4 shadow-lg">
        {previewImage ? (
          <Image
            src={previewImage}
            alt={firstName || "Profile image"}
            fill
            className="object-cover"
          />
        ) : (
          <User size={80} className="text-olive-500" />
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="animate-spin text-white" size={40} />
          </div>
        )}
      </div>

      {/* 
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute bottom-2 right-2 bg-olive-500 text-white p-3 rounded-full shadow-md hover:bg-olive-600 transition-transform hover:scale-110 disabled:opacity-50"
        title="تغيير الصورة"
      >
        <Camera size={20} />
      </button>
      */}
    </div>
  );
}
