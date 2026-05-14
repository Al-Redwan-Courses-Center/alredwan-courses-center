import React from 'react';
import Image from 'next/image';

export default function ExcelIcon({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Image 
        src="/icons/microsoftExcelLogo.svg" 
        alt="Excel" 
        width={24} 
        height={24} 
        className="object-contain"
      />
    </div>
  );
}
