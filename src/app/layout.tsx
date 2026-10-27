import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display font: Bricolage Grotesque (weight 800)
const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["800"],
});

// Body font: Space Grotesk (weights 400 and 600)
const fontBody = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "600"],
});

// Mono font: JetBrains Mono (weight 500 for labels & numbers)
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["500"],
});

export const metadata: Metadata = {
  title: {
    default: "CVBuilder — Format Terbaca ATS, Disesuaikan dengan Lowongan",
    template: "%s | CVBuilder",
  },
  description:
    "Bikin CV format ATS standar Harvard dalam hitungan menit. Tulis dengan bahasa apa adanya, AI merapikan dan menyesuaikan kata kunci lowongan tanpa mengarang data.",
  keywords: [
    "buat CV ATS",
    "CV ATS fresh graduate",
    "contoh CV ATS Harvard",
    "cara buat CV ATS",
    "format terbaca ATS",
  ],
  authors: [{ name: "CVBuilder Team" }],
  creator: "CVBuilder",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "CVBuilder",
    title: "CVBuilder — Format Terbaca ATS, Disesuaikan dengan Lowongan",
    description:
      "Tulis pengalaman apa adanya. AI merapikan struktur dan mencocokkan kata kunci lowongan dengan format Harvard standar ATS.",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFE500",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-[family-name:var(--font-body)]">
        {/* Accessible skip link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--accent)] focus:text-black focus:font-bold focus:border-2 focus:border-black focus:shadow-[2px_2px_0_0_#000]"
        >
          Lewati ke konten utama
        </a>
        <div id="main-content" className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
