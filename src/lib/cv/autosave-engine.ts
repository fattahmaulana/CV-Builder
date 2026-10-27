import { CvData } from "@/types/cv";

export type AutosaveStatus = "saved" | "saving" | "dirty" | "error" | "conflict";

export interface AutosaveOptions {
  cvId: string;
  initialVersion: number;
  debounceMs?: number;
  maxRetries?: number;
  onStatusChange?: (status: AutosaveStatus, message?: string | null) => void;
  onVersionUpdate?: (newVersion: number) => void;
  onConflict?: (serverVersion?: number) => void;
  saveFn?: (payload: AutosavePayload, signal: AbortSignal) => Promise<AutosaveResponse>;
}

export interface AutosavePayload {
  cvId: string;
  version: number;
  title: string;
  data: CvData;
  language: string;
  target_position?: string;
  target_company?: string;
  job_description?: string;
}

export interface AutosaveResponse {
  ok: boolean;
  status: number;
  data?: {
    code?: string;
    message?: string;
    serverVersion?: number;
    cv?: {
      version: number;
      [key: string]: unknown;
    };
  };
}

export class AutosaveEngine {
  private cvId: string;
  private currentVersion: number;
  private debounceMs: number;
  private maxRetries: number;

  private status: AutosaveStatus = "saved";
  private errorMessage: string | null = null;

  private debounceTimer: NodeJS.Timeout | null = null;
  private currentAbortController: AbortController | null = null;
  private isSaving: boolean = false;
  private queuedPayload: { data: CvData; title: string } | null = null;

  private onStatusChange?: (status: AutosaveStatus, message?: string | null) => void;
  private onVersionUpdate?: (newVersion: number) => void;
  private onConflict?: (serverVersion?: number) => void;
  private customSaveFn?: (payload: AutosavePayload, signal: AbortSignal) => Promise<AutosaveResponse>;

  constructor(options: AutosaveOptions) {
    this.cvId = options.cvId;
    this.currentVersion = options.initialVersion || 1;
    this.debounceMs = options.debounceMs ?? 1500;
    this.maxRetries = options.maxRetries ?? 3;
    this.onStatusChange = options.onStatusChange;
    this.onVersionUpdate = options.onVersionUpdate;
    this.onConflict = options.onConflict;
    this.customSaveFn = options.saveFn;
  }

  public getStatus(): AutosaveStatus {
    return this.status;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public getVersion(): number {
    return this.currentVersion;
  }

  public setVersion(version: number) {
    this.currentVersion = version;
    if (this.status === "conflict") {
      this.setStatus("saved", null);
    }
  }

  private setStatus(status: AutosaveStatus, message: string | null = null) {
    this.status = status;
    this.errorMessage = message;
    this.onStatusChange?.(status, message);
  }

  /**
   * Schedule a debounced autosave.
   */
  public trigger(data: CvData, title: string) {
    this.setStatus("dirty");

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.executeSave(data, title);
    }, this.debounceMs);
  }

  /**
   * Force save immediately, bypassing debounce.
   */
  public async saveNow(data: CvData, title: string): Promise<boolean> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    return this.executeSave(data, title);
  }

  private async executeSave(data: CvData, title: string): Promise<boolean> {
    // If currently saving, queue this version and abort stale request
    if (this.isSaving) {
      this.queuedPayload = { data, title };
      if (this.currentAbortController) {
        this.currentAbortController.abort();
      }
      return false;
    }

    // Check offline status strictly when navigator.onLine is false
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      this.queuedPayload = { data, title };
      this.setStatus("dirty", "Mode offline. Perubahan disimpan di memori dan akan dikirim saat online.");
      return false;
    }

    this.isSaving = true;
    this.setStatus("saving");

    const abortController = new AbortController();
    this.currentAbortController = abortController;

    const payload: AutosavePayload = {
      cvId: this.cvId,
      version: this.currentVersion,
      title,
      data,
      language: data.metadata?.language || "id",
      target_position: data.metadata?.targetPosition,
      target_company: data.metadata?.targetCompany,
      job_description: data.metadata?.jobDescription,
    };

    let attempt = 0;
    let savedSuccessfully = false;

    while (attempt <= this.maxRetries) {
      if (abortController.signal.aborted) {
        // Request was superseded by newer data
        this.isSaving = false;
        this.currentAbortController = null;
        if (this.queuedPayload) {
          const next = this.queuedPayload;
          this.queuedPayload = null;
          return this.executeSave(next.data, next.title);
        }
        return false;
      }

      try {
        const response = await this.performFetch(payload, abortController.signal);

        if (response.ok) {
          const newVersion = response.data?.cv?.version ?? this.currentVersion + 1;
          this.currentVersion = newVersion;
          this.onVersionUpdate?.(newVersion);
          savedSuccessfully = true;
          break;
        }

        // Handle 4xx Client Errors (DO NOT RETRY)
        if (response.status >= 400 && response.status < 500) {
          if (response.status === 409) {
            // Version Conflict
            this.setStatus("conflict", response.data?.message || "Konflik versi: CV telah diubah di sesi lain.");
            this.onConflict?.(response.data?.serverVersion);
          } else {
            this.setStatus(
              "error",
              response.data?.message || `Gagal menyimpan (${response.status}). Periksa input Anda.`
            );
          }
          savedSuccessfully = false;
          break;
        }

        // 5xx Server Error: eligible for retry with backoff
        attempt++;
        if (attempt <= this.maxRetries) {
          const backoffMs = Math.min(500 * Math.pow(2, attempt - 1), 3000);
          await this.delay(backoffMs, abortController.signal);
        } else {
          this.setStatus(
            "error",
            response.data?.message || "Server mengalami gangguan sementara. Klik Coba Lagi."
          );
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          this.isSaving = false;
          this.currentAbortController = null;
          if (this.queuedPayload) {
            const next = this.queuedPayload;
            this.queuedPayload = null;
            return this.executeSave(next.data, next.title);
          }
          return false;
        }

        // Network error (Failed to fetch, offline during request): eligible for retry
        attempt++;
        if (attempt <= this.maxRetries) {
          const backoffMs = Math.min(500 * Math.pow(2, attempt - 1), 3000);
          try {
            await this.delay(backoffMs, abortController.signal);
          } catch {
            break;
          }
        } else {
          this.setStatus("error", "Koneksi terputus. Klik Coba Lagi saat jaringan stabil.");
        }
      }
    }

    this.isSaving = false;
    this.currentAbortController = null;

    if (savedSuccessfully) {
      // Check if another save was queued during this flight
      if (this.queuedPayload) {
        const next = this.queuedPayload;
        this.queuedPayload = null;
        return this.executeSave(next.data, next.title);
      }
      this.setStatus("saved", null);
      return true;
    }

    return false;
  }

  private async performFetch(
    payload: AutosavePayload,
    signal: AbortSignal
  ): Promise<AutosaveResponse> {
    if (this.customSaveFn) {
      return this.customSaveFn(payload, signal);
    }

    const res = await fetch(`/api/cv/${payload.cvId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: payload.version,
        title: payload.title,
        data: payload.data,
        language: payload.language,
        target_position: payload.target_position,
        target_company: payload.target_company,
        job_description: payload.job_description,
      }),
      signal,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  }

  private delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  public destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }
}
