"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { adobeSignature } from "@/lib/adobe/signature";

const POLL_INTERVAL_MS = 4000;

interface AdobeDataWatcherProps {
  keyword: string;
  signature: string;
}

interface StatusResponse {
  latestObservedAt: number | null;
  extensionSeenAt: string | null;
}

export function AdobeDataWatcher({ keyword, signature }: AdobeDataWatcherProps) {
  const router = useRouter();
  const known = useRef(signature);

  useEffect(() => {
    known.current = signature;
  }, [signature]);

  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const response = await fetch(`/api/adobe/status?keyword=${encodeURIComponent(keyword)}`).catch(() => null);
      if (!response?.ok) return;

      const status = (await response.json()) as StatusResponse;
      const latest = adobeSignature(status.latestObservedAt, status.extensionSeenAt);
      if (latest !== known.current) {
        known.current = latest;
        router.refresh();
      }
    };

    const timer = setInterval(check, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [keyword, router]);

  return null;
}
