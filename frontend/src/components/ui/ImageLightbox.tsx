"use client";

import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn, toHindiDigits } from "@/lib/utils";

export interface LightboxImage {
  src: string | StaticImageData;
  alt: string;
}

interface SingleImageProps {
  /** The full-size image shown in the overlay. */
  src: string | StaticImageData;
  alt: string;
  images?: never;
  index?: never;
}

interface GalleryProps {
  /** Every image of the gallery; prev/next and arrow keys move between them. */
  images: LightboxImage[];
  /** Index (in `images`) of the image this trigger opens. */
  index: number;
  src?: never;
  alt?: never;
}

type ImageLightboxProps = (SingleImageProps | GalleryProps) & {
  /** The trigger content (usually an `<Image>`), wrapped in a button. */
  children: ReactNode;
  /** Classes for the trigger button. */
  className?: string;
  /** Accessible label of the trigger button. */
  label?: string;
};

const TRIGGER_BASE_CLASSES =
  "block cursor-zoom-in border-0 bg-transparent p-0 text-start outline-none focus-visible:ring-4 focus-visible:ring-olive-500 focus-visible:ring-offset-2";

const CONTROL_CLASSES =
  "grid h-14 w-14 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 motion-reduce:transition-none";

/**
 * Wraps a thumbnail in a button that opens the full image in a full-screen
 * overlay. Pass `images` + `index` for gallery navigation, or `src` + `alt`
 * for a single image.
 */
export default function ImageLightbox(props: ImageLightboxProps) {
  const { children, className, label = "تكبير الصورة" } = props;
  const gallery: LightboxImage[] =
    props.images !== undefined
      ? props.images
      : [{ src: props.src, alt: props.alt }];
  const initialIndex = props.images !== undefined ? props.index : 0;

  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState(initialIndex);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const hasMany = gallery.length > 1;

  const open = () => {
    setCurrent(initialIndex);
    setIsOpen(true);
  };

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goTo = useCallback(
    (delta: number) => {
      if (!hasMany) return;
      setCurrent((c) => (c + delta + gallery.length) % gallery.length);
    },
    [gallery.length, hasMany],
  );

  // Body scroll lock, focus management and keyboard shortcuts while open.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          close();
          break;
        case "ArrowLeft":
          event.preventDefault();
          // RTL site: the left arrow moves forward through the gallery.
          goTo(1);
          break;
        case "ArrowRight":
          event.preventDefault();
          goTo(-1);
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const trigger = triggerRef.current;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isOpen, close, goTo]);

  // Keep focus inside the dialog when tabbing.
  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;

    const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
      "button:not([disabled])",
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const image = gallery[current] ?? gallery[0];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        onClick={open}
        className={cn(TRIGGER_BASE_CLASSES, className)}
      >
        {children}
      </button>

      {isOpen &&
        image &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={trapFocus}
            className="motion-safe:animate-in motion-safe:fade-in-0 fixed inset-0 z-[1200] flex flex-col bg-black/90 text-white motion-safe:duration-200"
          >
            <span id={titleId} className="sr-only">
              {image.alt || "صورة مكبرة"}
            </span>

            {/* Backdrop: clicking outside the image closes the dialog. */}
            <button
              type="button"
              aria-label="إغلاق"
              onClick={close}
              tabIndex={-1}
              className="absolute inset-0 h-full w-full cursor-zoom-out"
            />

            <div className="pointer-events-none relative z-10 flex items-center justify-between gap-4 p-4 sm:p-6">
              <span className="text-lg font-bold text-white/80" aria-hidden>
                {hasMany
                  ? `${toHindiDigits(current + 1)} / ${toHindiDigits(gallery.length)}`
                  : ""}
              </span>
              <button
                ref={closeRef}
                type="button"
                aria-label="إغلاق"
                onClick={close}
                className={cn(CONTROL_CLASSES, "pointer-events-auto")}
              >
                <XIcon className="h-7 w-7" />
              </button>
            </div>

            <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-20">
              <div className="relative h-full w-full max-w-7xl">
                <Image
                  key={current}
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="100vw"
                  className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 pointer-events-auto object-contain motion-safe:duration-200"
                  draggable="false"
                  priority
                />
              </div>
            </div>

            {hasMany && (
              <>
                <button
                  type="button"
                  aria-label="الصورة السابقة"
                  onClick={() => goTo(-1)}
                  className={cn(
                    CONTROL_CLASSES,
                    "absolute end-3 top-1/2 z-20 -translate-y-1/2 sm:end-6",
                  )}
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
                <button
                  type="button"
                  aria-label="الصورة التالية"
                  onClick={() => goTo(1)}
                  className={cn(
                    CONTROL_CLASSES,
                    "absolute start-3 top-1/2 z-20 -translate-y-1/2 sm:start-6",
                  )}
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
