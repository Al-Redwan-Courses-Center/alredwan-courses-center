"use client";

import { useEffect, useRef } from "react";

interface UseIntersectionObserverOptions {
  enabled?: boolean;
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  onIntersect: () => void;
  triggerOnce?: boolean;
}

export function useIntersectionObserver<T extends Element = HTMLDivElement>({
  enabled = true,
  root = null,
  rootMargin = "200px 0px",
  threshold = 0,
  onIntersect,
  triggerOnce = false,
}: UseIntersectionObserverOptions) {
  const targetRef = useRef<T | null>(null);
  const onIntersectRef = useRef(onIntersect);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  const thresholdString = Array.isArray(threshold)
    ? threshold.join(",")
    : threshold.toString();

  useEffect(() => {
    const target = targetRef.current;

    if (!enabled || !target || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (entry.isIntersecting) {
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            onIntersectRef.current();

            if (triggerOnce) {
              observer.unobserve(target);
            }
          }
        } else {
          if (!triggerOnce) {
            hasTriggeredRef.current = false;
          }
        }
      },
      {
        root,
        rootMargin,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      hasTriggeredRef.current = false;
    };
  }, [enabled, root, rootMargin, thresholdString, triggerOnce]);

  return targetRef;
}
