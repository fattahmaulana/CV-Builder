"use client";

import React from "react";
import { CvData } from "@/types/cv";
import { AutosaveEngine, AutosaveStatus } from "./autosave-engine";

interface UseCvAutosaveProps {
  cvId: string;
  initialVersion: number;
  data: CvData;
  title: string;
  onDataReload?: (latestCv: { data: CvData; title: string; version: number }) => void;
}

export function useCvAutosave({
  cvId,
  initialVersion,
  data,
  title,
  onDataReload,
}: UseCvAutosaveProps) {
  const [status, setStatus] = React.useState<AutosaveStatus>("saved");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState<number>(initialVersion || 1);

  // Store latest state in ref to avoid stale closures in event handlers
  const latestDataRef = React.useRef<{ data: CvData; title: string }>({ data, title });
  latestDataRef.current = { data, title };

  const engineRef = React.useRef<AutosaveEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new AutosaveEngine({
      cvId,
      initialVersion,
      onStatusChange: (newStatus, msg) => {
        setStatus(newStatus);
        setErrorMessage(msg || null);
      },
      onVersionUpdate: (newVer) => {
        setVersion(newVer);
      },
      onConflict: () => {
        // Will prompt user to reload latest data
      },
    });
  }

  // Handle beforeunload: warn user if changes are unsaved
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === "dirty" || status === "saving") {
        e.preventDefault();
        e.returnValue = "Perubahan draf CV Anda belum tersimpan sepenuhnya.";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [status]);

  // Handle online/offline transitions
  React.useEffect(() => {
    const handleOnline = () => {
      if (status === "dirty" || status === "error") {
        // Automatically attempt saving pending in-memory changes
        engineRef.current?.saveNow(latestDataRef.current.data, latestDataRef.current.title);
      }
    };

    const handleOffline = () => {
      setStatus("dirty");
      setErrorMessage("Koneksi internet terputus (Offline). Perubahan aman di memori.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [status]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  const triggerAutosave = React.useCallback(
    (nextData: CvData, nextTitle: string) => {
      latestDataRef.current = { data: nextData, title: nextTitle };
      engineRef.current?.trigger(nextData, nextTitle);
    },
    []
  );

  const retrySave = React.useCallback(async () => {
    if (engineRef.current) {
      return await engineRef.current.saveNow(
        latestDataRef.current.data,
        latestDataRef.current.title
      );
    }
    return false;
  }, []);

  const reloadLatestData = React.useCallback(async () => {
    try {
      setStatus("saving");
      const res = await fetch(`/api/cv/${cvId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil data terbaru");
      const json = await res.json();
      if (json.cv) {
        engineRef.current?.setVersion(json.cv.version);
        setVersion(json.cv.version);
        setStatus("saved");
        setErrorMessage(null);
        if (onDataReload) {
          onDataReload({
            data: json.cv.data,
            title: json.cv.title,
            version: json.cv.version,
          });
        }
      }
    } catch {
      setStatus("error");
      setErrorMessage("Gagal memuat data terbaru dari server.");
    }
  }, [cvId, onDataReload]);

  return {
    status,
    errorMessage,
    version,
    triggerAutosave,
    retrySave,
    reloadLatestData,
  };
}
