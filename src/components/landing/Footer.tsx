import Link from "next/link";
import { ShieldCheck, Heart, ArrowUpRight } from "lucide-react";
import { CVBuilderLogo3D } from "@/components/ui/CVBuilderLogo3D";

export function Footer() {
  return (
    <footer className="border-t-[3px] border-black bg-[var(--surface)] text-[var(--text)] py-14 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b-2 border-black">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <CVBuilderLogo3D size="lg" />
            <p className="text-xs sm:text-sm text-neutral-800 font-[family-name:var(--font-body)] leading-relaxed max-w-sm">
              Platform pembangun CV format ATS standar Harvard untuk pencari kerja dan fresh graduate di Indonesia. Tulis apa adanya, AI merapikan tanpa mengarang data palsu.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold font-[family-name:var(--font-mono)] text-black bg-[var(--bg)] px-3 py-1.5 border-2 border-black rounded-[2px] w-fit shadow-[2px_2px_0_0_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              <ShieldCheck className="h-4 w-4 stroke-[2.5] text-black" />
              <span>Kepatuhan Penuh UU PDP No. 27/2022</span>
            </div>
          </div>

          {/* Education Links */}
          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider font-[family-name:var(--font-mono)] bg-black text-white px-2 py-0.5 w-fit">
              Panduan &amp; Edukasi
            </p>
            <ul className="space-y-2 text-xs sm:text-sm font-bold font-[family-name:var(--font-body)] list-none p-0 m-0">
              <li>
                <Link
                  href="/panduan/apa-itu-cv-ats"
                  className="inline-flex items-center gap-2 text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all duration-150 group"
                >
                  <span className="h-1.5 w-1.5 bg-black rounded-full group-hover:bg-[#FFE500] group-hover:scale-150 transition-all duration-150" />
                  <span className="group-hover:underline underline-offset-4 decoration-2 decoration-black">
                    Apa Itu CV ATS &amp; Cara Kerjanya
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </Link>
              </li>
              <li>
                <Link
                  href="/panduan/contoh-cv-ats-fresh-graduate"
                  className="inline-flex items-center gap-2 text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all duration-150 group"
                >
                  <span className="h-1.5 w-1.5 bg-black rounded-full group-hover:bg-[#FFE500] group-hover:scale-150 transition-all duration-150" />
                  <span className="group-hover:underline underline-offset-4 decoration-2 decoration-black">
                    Contoh CV ATS Fresh Graduate
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </Link>
              </li>
              <li>
                <Link
                  href="/panduan/format-cv-harvard"
                  className="inline-flex items-center gap-2 text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all duration-150 group"
                >
                  <span className="h-1.5 w-1.5 bg-black rounded-full group-hover:bg-[#FFE500] group-hover:scale-150 transition-all duration-150" />
                  <span className="group-hover:underline underline-offset-4 decoration-2 decoration-black">
                    Panduan Format Resume Harvard
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </Link>
              </li>
              <li>
                <a
                  href="#cara-kerja"
                  className="inline-flex items-center gap-2 text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all duration-150 group"
                >
                  <span className="h-1.5 w-1.5 bg-black rounded-full group-hover:bg-[#FFE500] group-hover:scale-150 transition-all duration-150" />
                  <span className="group-hover:underline underline-offset-4 decoration-2 decoration-black">
                    Alur Pembuatan CV Tiga Langkah
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider font-[family-name:var(--font-mono)] bg-black text-white px-2 py-0.5 w-fit">
              Ketentuan &amp; Akses
            </p>
            <ul className="space-y-2 text-xs sm:text-sm font-bold font-[family-name:var(--font-body)] list-none p-0 m-0">
              <li>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-2 text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all duration-150 group"
                >
                  <span className="h-1.5 w-1.5 bg-black rounded-full group-hover:bg-[#FFE500] group-hover:scale-150 transition-all duration-150" />
                  <span className="group-hover:underline underline-offset-4 decoration-2 decoration-black">
                    Kebijakan Privasi
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-2 text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all duration-150 group"
                >
                  <span className="h-1.5 w-1.5 bg-black rounded-full group-hover:bg-[#FFE500] group-hover:scale-150 transition-all duration-150" />
                  <span className="group-hover:underline underline-offset-4 decoration-2 decoration-black">
                    Syarat &amp; Ketentuan Layanan
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all duration-150 group"
                >
                  <span className="h-1.5 w-1.5 bg-black rounded-full group-hover:bg-[#FFE500] group-hover:scale-150 transition-all duration-150" />
                  <span className="group-hover:underline underline-offset-4 decoration-2 decoration-black">
                    Masuk Akun Google
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </Link>
              </li>
              <li>
                <a
                  href="#harga"
                  className="inline-flex items-center gap-2 text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all duration-150 group"
                >
                  <span className="h-1.5 w-1.5 bg-black rounded-full group-hover:bg-[#FFE500] group-hover:scale-150 transition-all duration-150" />
                  <span className="group-hover:underline underline-offset-4 decoration-2 decoration-black">
                    Biaya Terjangkau Rp5.000
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Micro-Animations */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-[family-name:var(--font-mono)] font-bold text-neutral-800 text-center sm:text-left">
          <p className="hover:text-black transition-colors">
            &copy; {new Date().getFullYear()} <span className="bg-[#FFE500] text-black px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] rounded-[2px] font-black">CVBuilder</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
