"use client";

import CheckMarkIcon from "@/components/icons/CheckMarkIcon";
import NotepadIcon from "@/components/icons/NotepadIcon";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function AddLectureNotesInput() {
  const [lectureNote, setLectureNote] = useState("ملاحظة افتراضية");
  const isChanged = lectureNote !== "ملاحظة افتراضية";

  return (
    <Input
      id="lecture note"
      shape="leafRevert"
      placeholder="أضف ملاحظة"
      wrapperStyles={cn(
        "[&_svg]:text-olive-300 relative w-full",
        isChanged && "pe-18",
      )}
      inputStyles={cn("w-full text-3xl placeholder:text-3xl")}
      icon={<NotepadIcon />}
      value={lectureNote}
      onChange={(e) => setLectureNote(e.target.value)}
      button={
        isChanged && (
          <button className="bg-olive-300 hover:bg-olive-700 absolute left-5 aspect-square h-auto w-10 place-items-center rounded-[0_0.5rem] transition-colors">
            <CheckMarkIcon className="w-2/3 text-gray-100!" />
          </button>
        )
      }
    />
  );
}
