"use client";

import { useState, useRef } from "react";
import { User, Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { uploadProfileImage } from "@/actions/profile";

export default function ProfileImageUploader({ initialImage, firstName }: { initialImage?: string | null, firstName: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(initialImage || null);
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
    <div className="relative group">
      <div className="w-48 h-48 rounded-full bg-olive-100 flex items-center justify-center border-4 border-olive-500 overflow-hidden shadow-lg relative">
        {previewImage ? (
          <img src={previewImage} alt={firstName} className="w-full h-full object-cover" />
        ) : (
          <User size={80} className="text-olive-500" />
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="text-white animate-spin" size={40} />
          </div>
        )}
      </div>
      
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
    </div>
  );
}
