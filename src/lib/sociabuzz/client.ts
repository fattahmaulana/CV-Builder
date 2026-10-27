import { normalizeCountry } from "./constants";

export class CookieJar {
  private cookies: Map<string, string>;

  constructor(initial: Record<string, string> = {}) {
    this.cookies = new Map();
    if (initial && typeof initial === "object") {
      for (const [k, v] of Object.entries(initial)) {
        if (v !== undefined && v !== null) {
          this.cookies.set(k, String(v));
        }
      }
    }
  }

  parseSetCookie(headers: Headers) {
    let rawList: string[] = [];
    if (typeof (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function") {
      rawList = (headers as unknown as { getSetCookie: () => string[] }).getSetCookie() || [];
    } else if (headers.get) {
      const raw = headers.get("set-cookie");
      if (raw) rawList = [raw];
    }

    for (const str of rawList) {
      if (!str) continue;
      const parts = str.split(";");
      const [name, ...valParts] = parts[0].split("=");
      if (name) {
        this.cookies.set(name.trim(), valParts.join("=").trim());
      }
    }
  }

  getCookieHeader(): string {
    const list: string[] = [];
    for (const [k, v] of this.cookies.entries()) {
      list.push(`${k}=${v}`);
    }
    return list.join("; ");
  }

  get(name: string): string {
    return this.cookies.get(name) || "";
  }

  set(name: string, value: string) {
    this.cookies.set(name, value);
  }

  toJSON(): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [k, v] of this.cookies.entries()) {
      obj[k] = v;
    }
    return obj;
  }
}

export interface DonationSessionResult {
  success: boolean;
  token: string;
  amount: number;
  currency: string;
  redirect_url: string;
  expires_in: number;
  cookies: Record<string, string>;
  csrf: string;
}

export interface SociaBuzzPaymentResult {
  success: boolean;
  token: string;
  payment_method: string;
  label: string;
  gateway: string;
  inv_id: string;
  payment_url: string;
  qr_string: string;
  qr_image_url: string;
  fee: {
    fee_type: string;
    fee_rate: number;
    fee_fixed: number;
    total_fee: number;
    total_pay: number;
    min_amount: number;
    max_amount: number;
  };
  cookies: Record<string, string>;
  csrf: string;
}

export class SociaBuzzClient {
  private baseUrl: string;
  public jar: CookieJar;

  constructor(baseUrl = "https://sociabuzz.com", initialCookies: Record<string, string> = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.jar = new CookieJar(initialCookies);
  }

  async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      "Sec-Ch-Ua": '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      ...((options.headers as Record<string, string>) || {}),
    };

    const cookieHeader = this.jar.getCookieHeader();
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const res = await fetch(url, { ...options, headers });
    this.jar.parseSetCookie(res.headers);
    return res;
  }

  getCSRFCookie(): string {
    return (
      this.jar.get("sociabuzz_sb_cookie_csrf") ||
      this.jar.get("csrf_cookie_name") ||
      ""
    );
  }

  // Step 0: Init session to get ci_session & CSRF cookie
  async initSession(username: string): Promise<{ cookies: Record<string, string>; csrf: string }> {
    const res = await this.fetch(`/${username}/tribe`, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`initSession failed with HTTP ${res.status}`);
    }

    const csrf = this.getCSRFCookie();
    return { cookies: this.jar.toJSON(), csrf };
  }

  // Step 0.5: Get Creator Unit Price (TRAKTIR_PRICE)
  async getCreatorConfig(username: string, currency = "IDR"): Promise<Record<string, unknown>> {
    try {
      const q = new URLSearchParams({ type: "buyme", currency, message: "" });
      const res = await this.fetch(`/${username}/donate/queue?${q.toString()}`, {
        method: "GET",
        headers: {
          Accept: "*/*",
          "X-Requested-With": "XMLHttpRequest",
          Referer: `${this.baseUrl}/${username}/tribe`,
        },
      });
      if (!res.ok) return {};
      const text = await res.text();
      const match = text.match(/var\s+client\s*=\s*(\{[^;]+\})\s*;/);
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
    } catch {
      // ignore
    }
    return {};
  }

  // Step 1: Submit donation form
  async submitDonation(
    username: string,
    currency = "IDR",
    amount = 5000,
    fullname = "Kandidat CVBuilder",
    email = "kandidat@cvbuilder.id",
    note = "Pembayaran CV ATS Harvard"
  ): Promise<DonationSessionResult> {
    let csrfToken = this.getCSRFCookie();
    if (!csrfToken) {
      const init = await this.initSession(username);
      csrfToken = init.csrf;
    }

    const config = await this.getCreatorConfig(username, currency);
    let traktirPrice = 1.0;
    if (config && config.TRAKTIR_PRICE) {
      const num = parseFloat(String(config.TRAKTIR_PRICE));
      if (!isNaN(num) && num > 0) traktirPrice = num;
    }

    let calculatedQty = 1;
    if (traktirPrice > 0 && amount >= traktirPrice) {
      calculatedQty = Math.max(1, Math.round(amount / traktirPrice));
    }

    const form = new URLSearchParams();
    form.set("sb_token_csrf", csrfToken);
    form.set("currency", currency);
    form.set("amount", String(amount));
    form.set("qty", String(calculatedQty));
    form.set("support_duration", "30");
    form.set("note", note);
    form.set("fullname", fullname);
    form.set("email", email);
    form.set("is_agree", "1");
    form.set("years18", "1");
    form.set("is_vote", "0");
    form.set("is_voice", "0");
    form.set("is_mediashare", "0");
    form.set("is_gif", "0");
    form.set("is_sound", "0");
    form.set("vote_id", "");
    form.set("ms_maxtime", "");
    form.set("start_from", "0");
    form.set("ms_starthour", "0");
    form.set("ms_startminute", "0");
    form.set("ms_startsecond", "0");
    form.set("spin_check", "0");
    form.set("prev_url", `${this.baseUrl}/${username}/tribe?`);
    form.set("hide_email", "0");
    form.set("is_tiktok", "0");
    form.set("tiktok_duration", "0");
    form.set("is_instagram", "0");
    form.set("instagram_duration", "0");
    form.set("wishlist_id", "");
    form.set("quickpay", "0");

    const res = await this.fetch(`/${username}/donate/get-form-queue`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Origin: this.baseUrl,
        Referer: `${this.baseUrl}/${username}/tribe?`,
      },
      body: form.toString(),
    });

    const bodyText = await res.text();
    if (!res.ok) {
      throw new Error(`submitDonation failed (HTTP ${res.status}): ${bodyText.slice(0, 200)}`);
    }

    let parsed: { success?: boolean | string; messages?: Record<string, string>; content?: { redirect?: string; expired_at?: number } };
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      throw new Error(`submitDonation returned non-JSON: ${bodyText.slice(0, 200)}`);
    }

    const isSuccess = parsed.success === true || parsed.success === "true";
    if (!isSuccess) {
      const msg =
        (parsed.messages && Object.values(parsed.messages).join(", ")) ||
        "Donation submission failed";
      throw new Error(msg);
    }

    const redirectUrl = (parsed.content && parsed.content.redirect) || "";
    let token = "";
    const tokenMatch = redirectUrl.match(/\/x\/([a-zA-Z0-9_-]+)/);
    if (tokenMatch) {
      token = tokenMatch[1];
    } else {
      token = `SBZ-${Date.now().toString(36).toUpperCase()}`;
    }

    return {
      success: true,
      token,
      amount,
      currency,
      redirect_url: redirectUrl,
      expires_in: (parsed.content && parsed.content.expired_at) || 3600,
      cookies: this.jar.toJSON(),
      csrf: this.getCSRFCookie(),
    };
  }

  // Step 2: Payment settings
  async getPaymentSettings(
    token: string,
    amount: number,
    currency = "IDR",
    country = "Indonesia"
  ): Promise<any> {
    const q = new URLSearchParams({
      amount: String(amount),
      currency: currency,
      base_amount: String(amount),
      base_currency: currency,
      currency_def: currency,
      convertion: currency,
      country: country,
      feature: "TRIBE",
      is_borne_fee: "1",
      risk: "",
      message: "",
      direct: "",
      service_fee: "0",
      token: token,
      country_account: "",
    });

    const res = await this.fetch(`/payment/pay/setting?${q.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        Referer: `${this.baseUrl}/payment/x/${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`getPaymentSettings failed with HTTP ${res.status}`);
    }

    return await res.json();
  }

  // Step 2.5: Visit payment page to extract CSRF
  async visitPaymentPage(token: string): Promise<string> {
    const res = await this.fetch(`/payment/x/${token}`, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: `${this.baseUrl}/payment/x/${token}`,
      },
    });

    if (!res.ok) {
      return this.getCSRFCookie();
    }

    const html = await res.text();
    const match = html.match(/name=["']sb_token_csrf["']\s+value=["']([^"']*)["']/i);
    if (match && match[1]) {
      return match[1];
    }
    return this.getCSRFCookie();
  }

  // Step 3: Create Payment (Strictly QRIS)
  async createPayment(
    token: string,
    paymentMethod = "qris",
    sessionData: { amount: number; currency: string; country: string }
  ): Promise<SociaBuzzPaymentResult> {
    const settings = await this.getPaymentSettings(
      token,
      sessionData.amount,
      sessionData.currency,
      sessionData.country
    );

    let methodInfo: any = null;
    let groupName = "qris";
    const channels = settings.payment_channel || [];
    for (const ch of channels) {
      for (const m of ch.available || []) {
        if (
          m.name.toLowerCase() === paymentMethod.toLowerCase() ||
          (m.alias && m.alias.toLowerCase() === paymentMethod.toLowerCase())
        ) {
          methodInfo = m;
          groupName = ch.name;
          break;
        }
      }
      if (methodInfo) break;
    }

    // Fallback if not explicitly found in settings
    if (!methodInfo) {
      methodInfo = {
        name: "qris",
        alias: "QRIS",
        source: "xendit",
        fee_type: "percent",
        fee: 0.007,
        total_pay: sessionData.amount,
      };
    }

    const csrfToken = await this.visitPaymentPage(token);
    const countryNorm = normalizeCountry(sessionData.country);

    const payload = {
      sb_token_csrf: csrfToken,
      order_id: token,
      final_currency: sessionData.currency,
      currency_def: sessionData.currency,
      payment_method: methodInfo.name,
      type_payment: groupName,
      source_payment: methodInfo.source || "",
      country: countryNorm.info ? countryNorm.info.iso2 : "ID",
      country_pay: countryNorm.name || "Indonesia",
    };

    const res = await this.fetch("/payment/send/create", {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Origin: this.baseUrl,
        Referer: `${this.baseUrl}/payment/x/${token}`,
      },
      body: JSON.stringify(payload),
    });

    const bodyText = await res.text();
    if (!res.ok) {
      throw new Error(`createPayment failed with HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      throw new Error(`createPayment returned non-JSON: ${bodyText.slice(0, 200)}`);
    }

    let paymentUrl = "";
    let qrString = "";

    if (parsed.data) {
      paymentUrl = parsed.data.payment_link || parsed.data.redirect_url || "";
      qrString = parsed.data.qr_string || "";
    }
    if (!paymentUrl && typeof parsed.redirect === "string") {
      paymentUrl = parsed.redirect;
    }

    const invId = parsed.inv_id || `TRIBE-IDR-${Date.now().toString(36).toUpperCase()}`;
    if (!paymentUrl && invId) {
      paymentUrl = `https://sociabuzz.com/payment/pending?type=${encodeURIComponent(methodInfo.name)}&inv_id=${encodeURIComponent(invId)}`;
    }

    let qrImageUrl = "";
    if (qrString) {
      qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrString)}`;
    }

    return {
      success: true,
      token,
      payment_method: methodInfo.name,
      label: methodInfo.alias || methodInfo.name,
      gateway: methodInfo.source || "xendit",
      inv_id: invId,
      payment_url: paymentUrl,
      qr_string: qrString,
      qr_image_url: qrImageUrl,
      fee: {
        fee_type: methodInfo.fee_type || "",
        fee_rate: methodInfo.fee || 0,
        fee_fixed: methodInfo.fee_amount || 0,
        total_fee: methodInfo.total_fee || 0,
        total_pay: methodInfo.total_pay || sessionData.amount,
        min_amount: methodInfo.min_amount || 0,
        max_amount: methodInfo.max_amount || 0,
      },
      cookies: this.jar.toJSON(),
      csrf: csrfToken,
    };
  }

  // Step 4: Check payment status directly from SociaBuzz
  async checkPaymentStatus(token: string, paymentMethod = "qris", invId = ""): Promise<"paid" | "pending" | "failed"> {
    if (invId && invId !== token) {
      try {
        const q = new URLSearchParams({ type: paymentMethod, inv_id: invId });
        const res = await this.fetch(`/payment/pending?${q.toString()}`, {
          method: "GET",
          headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            Referer: `${this.baseUrl}/payment/x/${token}`,
          },
        });
        if (res.ok) {
          const html = await res.text();
          if (/pembayaran\s+berhasil|status:\s*paid|transaksi\s+berhasil|sukses/i.test(html)) {
            return "paid";
          }
          if (/kedaluwarsa|expired|gagal|failed/i.test(html)) {
            return "failed";
          }
          return "pending";
        }
      } catch {
        // ignore
      }
    }

    return "pending";
  }
}
