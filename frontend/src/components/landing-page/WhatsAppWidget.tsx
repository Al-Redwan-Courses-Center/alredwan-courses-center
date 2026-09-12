"use client";

import { motion } from "motion/react";
import Link from "next/link";
import WhatsappIcon from "@/components/icons/WhatsappIcon";

export default function WhatsAppWidget() {
  const phoneNumber = "201233313590";

  return (
    <motion.div id ="whatsapp-widget"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-6 left-6 z-50 flex items-center justify-center"
    >
      <Link
        href={`https://wa.me/${phoneNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft transition-transform duration-300 hover:scale-110 hover:shadow-lg"
        aria-label="تواصل معنا عبر واتساب"
      >
        <span className="absolute -inset-1 animate-ping rounded-full bg-[#25D366] opacity-20"></span>
        <WhatsappIcon className="h-12 w-12" />
      </Link>
    </motion.div>
  );
}
