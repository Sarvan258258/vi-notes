import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent } from "react";

type PasteEvent = {
  length: number;
  timestamp: number;
};

export type PasteSnapshot = {
  totalEvents: number;
  totalChars: number;
  lastPasteChars: number | null;
  lastPasteAt: number | null;
};

const MAX_PASTE_EVENTS = 500;

export const usePasteDetection = (sessionKey: string | null) => {
  const [snapshot, setSnapshot] = useState<PasteSnapshot>({
    totalEvents: 0,
    totalChars: 0,
    lastPasteChars: null,
    lastPasteAt: null
  });

  const eventsRef = useRef<PasteEvent[]>([]);

  const reset = () => {
    eventsRef.current = [];
    setSnapshot({
      totalEvents: 0,
      totalChars: 0,
      lastPasteChars: null,
      lastPasteAt: null
    });
  };

  useEffect(() => {
    reset();
  }, [sessionKey]);

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData?.getData("text") ?? "";
    const length = pastedText.length;

    if (length <= 0) {
      return;
    }

    const timestamp = Date.now();
    eventsRef.current.push({ length, timestamp });
    if (eventsRef.current.length > MAX_PASTE_EVENTS) {
      eventsRef.current.shift();
    }

    setSnapshot((current) => ({
      totalEvents: current.totalEvents + 1,
      totalChars: current.totalChars + length,
      lastPasteChars: length,
      lastPasteAt: timestamp
    }));
  };

  return { pasteSnapshot: snapshot, handlePaste };
};
