"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: "Apakah format CV ATS ini pasti membuat saya lolos seleksi?",
    answer:
      "Tidak ada sistem yang bisa menjamin 100% kelolosan karena keputusan akhir tetap berada di tangan rekruter manusia. Yang dipastikan oleh CVBuilder adalah format berkas Anda 100% terbaca sempurna oleh mesin ATS (Applicant Tracking System) tanpa ada teks yang terpotong, serta kata kunci disesuaikan dengan deskripsi lowongan kerja target Anda.",
  },
  {
    question: "Mengapa biayanya hanya Rp5.000? Apakah ada biaya langganan bulanan?",
    answer:
      "CVBuilder dibangun khusus untuk membantu fresh graduate di Indonesia. Kami tidak menerapkan langganan bulanan berulang atau biaya tersembunyi. Anda hanya membayar Rp5.000 sekali untuk satu CV final siap unduh (PDF dan DOCX), termasuk kuota 3x revisi AI gratis dalam 7 hari.",
  },
  {
    question: "Bagaimana cara kerja penyensoran data pribadi (UU PDP)?",
    answer:
      "Sesuai amanat UU Perlindungan Data Pribadi No. 27 Tahun 2022, data sensitif Anda seperti NIK, nomor WhatsApp, alamat lengkap, dan email pribadi akan otomatis disensor menjadi placeholder acak sebelum dikirim ke Google Gemini AI. Setelah AI merapikan tata bahasa, data kontak asli Anda direhidrasi kembali secara lokal pada perangkat Anda.",
  },
  {
    question: "Apakah saya bisa mengedit CV kembali setelah pembayaran?",
    answer:
      "Tentu saja. Anda mendapatkan kuota 3 kali revisi AI gratis selama 7 hari kalender sejak pembayaran sukses. Selain itu, Anda juga dapat mengunduh berkas dalam format Microsoft Word (.docx) untuk mengedit rincian secara mandiri kapan saja.",
  },
  {
    question: "Bagaimana cara kerja fitur Pelacak Lamaran Kerja?",
    answer:
      "Setiap kali Anda mengunduh CV untuk melamar lowongan tertentu, CVBuilder otomatis mencatat riwayat lamaran Anda pada dashboard Pelacak Lamaran. Anda dapat memantau dan memperbarui status lamaran mulai dari Terkirim, Wawancara, hingga Tawaran (Offer) langsung dari aplikasi secara rapi.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-16 sm:py-24 px-4 sm:px-6 bg-[var(--surface)] border-b-[3px] border-black"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="accent" isSticker className="mb-3">
            PERTANYAAN UMUM
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-[family-name:var(--font-display)] tracking-tight text-black">
            Kerap Ditanyakan oleh Pencari Kerja
          </h2>
          <p className="mt-4 text-base text-neutral-800 font-[family-name:var(--font-body)]">
            Transparansi penuh mengenai format, biaya, privasi data, dan integrasi kami.
          </p>
        </div>

        {/* Neobrutalist Accordion with Grid-Template-Rows Height Animation */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="bg-[var(--bg)] border-[3px] border-black rounded-[3px] shadow-[4px_4px_0_0_#000000] overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold font-[family-name:var(--font-display)] text-base sm:text-lg text-black hover:bg-[var(--accent)]/40 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <div
                    className={`h-7 w-7 rounded-[2px] border-2 border-black bg-[var(--surface)] flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-[var(--accent)]" : "rotate-0"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4 stroke-[2.5] text-black" />
                  </div>
                </button>

                {/* Grid Template Rows Animation */}
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-5 sm:p-6 pt-0 border-t-2 border-black/20 text-xs sm:text-sm text-neutral-800 font-[family-name:var(--font-body)] leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
