"use client";

import {
  BrowserCodeReader,
  BrowserMultiFormatReader,
  IScannerControls,
} from "@zxing/browser";
import { LucidePause, PlayIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onScan?: (text: string) => void;
  autoStart?: boolean;
  isActive?: boolean;
};

const SAME_CODE_COOLDOWN_MS = 1500;

export default function QrCodeScanner({
  onScan,
  autoStart = false,
  isActive = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const manuallyStoppedRef = useRef(false);
  const recentScansRef = useRef<Map<string, number>>(new Map());

  const canUseCameraApi =
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function";

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [canEnumerateDevices, setCanEnumerateDevices] =
    useState(canUseCameraApi);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [, setHasTriedStart] = useState(false);

  const getErrorText = useCallback((value: unknown) => {
    if (value instanceof Error) return value.message;
    if (typeof value === "string") return value;
    return "Unknown error";
  }, []);

  const getUserFriendlyError = useCallback(
    (value: unknown) => {
      const message = getErrorText(value).toLowerCase();

      if (message.includes("notallowed") || message.includes("permission")) {
        return "لا يوجد إذن لاستخدام الكاميرا. يرجى السماح بالوصول ثم المحاولة مرة أخرى.";
      }

      if (message.includes("notfound") || message.includes("device")) {
        return "لم يتم العثور على كاميرا متاحة على هذا الجهاز.";
      }

      if (message.includes("secure") || message.includes("https")) {
        return "لا يمكن تشغيل الكاميرا من هذا الرابط. يرجى فتح التطبيق من رابط آمن.";
      }

      if (
        message.includes("getusermedia") ||
        message.includes("mediadevices")
      ) {
        return "تعذّر الوصول إلى الكاميرا في هذا المتصفح أو هذا السياق.";
      }

      return "حدث خطأ أثناء تشغيل الكاميرا. حاول مرة أخرى.";
    },
    [getErrorText],
  );

  const setUiErrorWithLog = useCallback(
    (context: string, value: unknown) => {
      console.error(`[QrCodeScanner] ${context}`, value);
      setError(getUserFriendlyError(value));
    },
    [getUserFriendlyError],
  );

  const ActiveIcon = !isScanning ? PlayIcon : LucidePause;

  const shouldEmitScan = useCallback((rawText: string) => {
    const text = rawText.trim();
    if (!text) return false;

    const now = Date.now();
    const lastSeen = recentScansRef.current.get(text) ?? 0;

    if (now - lastSeen < SAME_CODE_COOLDOWN_MS) {
      return false;
    }

    recentScansRef.current.set(text, now);
    return true;
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!canUseCameraApi) {
      return () => {
        mounted = false;
        controlsRef.current?.stop();
      };
    }

    (async () => {
      try {
        const cams = await BrowserCodeReader.listVideoInputDevices();

        if (!mounted) return;

        setCanEnumerateDevices(true);
        setDevices(cams);

        if (cams.length > 0) setDeviceId(cams[0].deviceId);
      } catch (e) {
        if (!mounted) return;
        setCanEnumerateDevices(false);
        console.error("[QrCodeScanner] listVideoInputDevices failed", e);
      }
    })();

    return () => {
      mounted = false;
      controlsRef.current?.stop();
    };
  }, [canUseCameraApi]);

  const start = useCallback(async () => {
    if (!videoRef.current || isScanning || !canUseCameraApi) return;

    try {
      manuallyStoppedRef.current = false;
      setHasTriedStart(true);
      setError("");

      if (!window.isSecureContext) {
        setUiErrorWithLog(
          "start blocked by insecure context",
          new Error("Camera requires secure context (HTTPS/localhost)."),
        );
        return;
      }

      if (!readerRef.current)
        readerRef.current = new BrowserMultiFormatReader();

      if (canEnumerateDevices && deviceId) {
        controlsRef.current = await readerRef.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText();
              if (shouldEmitScan(text)) onScan?.(text);
            }
            if (err && err.name !== "NotFoundException") {
              setUiErrorWithLog("decodeFromVideoDevice callback error", err);
            }
          },
        );
      } else {
        controlsRef.current = await readerRef.current.decodeFromConstraints(
          {
            audio: false,
            video: { facingMode: "environment" },
          },
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText();
              if (shouldEmitScan(text)) onScan?.(text);
            }
            if (err && err.name !== "NotFoundException") {
              setUiErrorWithLog("decodeFromConstraints callback error", err);
            }
          },
        );
      }

      setIsScanning(true);
    } catch (e) {
      setUiErrorWithLog("start failed", e);
    }
  }, [
    canEnumerateDevices,
    canUseCameraApi,
    deviceId,
    isScanning,
    onScan,
    shouldEmitScan,
    setUiErrorWithLog,
  ]);

  const stop = useCallback(() => {
    manuallyStoppedRef.current = true;
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (!isActive && isScanning) {
      manuallyStoppedRef.current = false;
      const stopTimer = window.setTimeout(() => {
        stop();
      }, 0);

      return () => {
        window.clearTimeout(stopTimer);
      };
    }

    if (isActive && autoStart && !isScanning && !manuallyStoppedRef.current) {
      const startTimer = window.setTimeout(() => {
        void start();
      }, 0);

      return () => {
        window.clearTimeout(startTimer);
      };
    }

    return;
  }, [autoStart, isActive, isScanning, start, stop]);

  return (
    <div className="mx-auto flex h-fit w-fit flex-col items-center gap-10">
      {canEnumerateDevices && devices.length > 1 && (
        <select
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="border px-2 py-1"
        >
          {devices.map((d, i) => (
            <option key={`${d.deviceId || "camera"}-${i}`} value={d.deviceId}>
              {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
            </option>
          ))}
        </select>
      )}

      <div>
        {!!error && <p className="text-2xl font-bold text-red-800">{error}</p>}
        {!error && !canUseCameraApi && (
          <p className="text-2xl font-bold text-red-800">
            الكاميرا غير متاحة في هذا المتصفح أو في طريقة فتح التطبيق الحالية.
          </p>
        )}
      </div>

      <div className="min-h-192 min-w-5xl overflow-hidden rounded-xl border">
        <video ref={videoRef} className="w-full" muted playsInline />
      </div>

      <button
        onClick={!isScanning ? start : stop}
        disabled={!isScanning ? !canUseCameraApi : !isScanning}
        className="bg-olive-300 hover:bg-olive-500 rounded-full p-5 transition-colors"
      >
        <ActiveIcon fill="#eee" strokeWidth={0} />
      </button>
    </div>
  );
}
