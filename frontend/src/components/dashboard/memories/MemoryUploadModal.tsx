"use client";

import { useState } from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalFooter 
} from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { searchParticipants, uploadMemory } from "@/actions/memories";
import { ParticipantSearchResult } from "@/types/entities";
import { useDebounceValue } from "usehooks-ts";
import { useEffect } from "react";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function MemoryUploadModal({ isOpen, onClose, onUploadSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounceValue(searchQuery, 500);
  const [searchResults, setSearchResults] = useState<ParticipantSearchResult[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<ParticipantSearchResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
    const formData = new FormData();
    formData.append("file", file);
    formData.append("media_type", file.type.startsWith("video/") ? "video" : "image");
    if (caption) formData.append("caption", caption);
    
    const childrenIds = selectedParticipants.filter(p => p.type === "child").map(p => p.id);
    const studentIds = selectedParticipants.filter(p => p.type === "student").map(p => p.id);
    
    childrenIds.forEach(id => formData.append("children", id));
    studentIds.forEach(id => formData.append("students", id));

    const result = await uploadMemory(formData);
    setIsUploading(false);
    
    if (result.ok) {
      toast.success(result.message || "تم الرفع بنجاح");
      setFile(null);
      setCaption("");
      setSelectedParticipants([]);
      onUploadSuccess();
    } else {
      toast.error(result.message || "فشل الرفع");
    }
  };

  const toggleParticipant = (p: ParticipantSearchResult) => {
    if (selectedParticipants.some(sp => sp.id === p.id)) {
      setSelectedParticipants(prev => prev.filter(sp => sp.id !== p.id));
    } else {
      setSelectedParticipants(prev => [...prev, p]);
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
            <label className="block text-sm font-medium mb-2">الصورة أو الفيديو</label>
            <input 
              type="file" 
              accept="image/*,video/*" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-olive-50 file:text-olive-700 hover:file:bg-olive-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">تعليق (اختياري)</label>
            <Input 
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="اكتب تعليقاً على الذكرى..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الإشارة للطلاب/الأطفال (اختياري)</label>
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الكود..."
            />
            
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md divide-y">
                {searchResults.map(p => (
                  <div 
                    key={p.id} 
                    className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                    onClick={() => toggleParticipant(p)}
                  >
                    <span>{p.name} <span className="text-xs text-gray-500">({p.code})</span></span>
                    {selectedParticipants.some(sp => sp.id === p.id) && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedParticipants.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedParticipants.map(p => (
                  <span key={p.id} className="bg-olive-100 text-olive-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {p.name}
                    <button onClick={() => toggleParticipant(p)} className="text-olive-500 hover:text-olive-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={isUploading}>إلغاء</Button>
          <Button onClick={handleUpload} loading={isUploading} disabled={!file}>رفع</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
