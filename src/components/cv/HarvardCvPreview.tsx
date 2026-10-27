"use client";

import * as React from "react";
import { CvData } from "@/types/cv";
import { buildCvModel } from "@/lib/cv/buildCvModel";

interface HarvardCvPreviewProps {
  data: CvData;
  isPaid?: boolean;
  className?: string;
}

export function HarvardCvPreview({
  data,
  isPaid = false,
  className = "",
}: HarvardCvPreviewProps) {
  const model = buildCvModel(data);
  const isEn = model.metadata.language === "en";
  const { personalInfo, educations, experiences, skills, certifications, awards } = model;
  const isPhotoTemplate = model.metadata.template === "with-photo";

  // Filter experiences by category if needed or display chronological
  const hasEducations = educations.length > 0;
  const hasExperiences = experiences.length > 0;
  const hasSkills =
    skills.technical.length > 0 || skills.tools.length > 0 || skills.languages.length > 0;
  const hasCertifications = certifications.length > 0;
  const hasAwards = awards.length > 0;

  return (
    <div
      className={`relative w-full max-w-[210mm] mx-auto min-h-[297mm] bg-white text-[#111111] font-serif shadow-md p-8 sm:p-12 text-[11pt] leading-[1.35] select-text border border-[#E5E0D8] ${className}`}
      style={{
        fontFamily: "'Times New Roman', Times, Georgia, serif",
      }}
    >
      {/* Watermark Overlay for free unpaid preview */}
      {!isPaid && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden z-10"
        >
          <span className="text-[72pt] font-sans font-black tracking-widest text-black/[0.04] -rotate-45 uppercase border-8 border-black/[0.04] px-12 py-4 rounded-xl">
            PREVIEW ATS
          </span>
        </div>
      )}

      {/* HEADER SECTION: Name, Contact Info & Photo for Template B */}
      <header
        className={`pb-2 mb-3 ${
          isPhotoTemplate
            ? "flex justify-between items-start gap-4 border-b border-black/30 pb-3"
            : "text-center"
        }`}
      >
        <div className={isPhotoTemplate ? "flex-1 text-left" : "text-center"}>
          <h1 className="text-[17pt] font-bold uppercase tracking-wide text-black mb-1">
            {personalInfo.fullName || (isEn ? "YOUR FULL NAME" : "NAMA LENGKAP ANDA")}
          </h1>
          <div
            className={`text-[9.5pt] text-[#222222] flex flex-wrap items-center gap-x-2 gap-y-0.5 ${
              isPhotoTemplate ? "justify-start" : "justify-center"
            }`}
          >
            {personalInfo.city && <span>{personalInfo.city}</span>}
            {personalInfo.city && personalInfo.phone && <span>•</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.phone && personalInfo.email && <span>•</span>}
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.linkedinUrl && (
              <>
                <span>•</span>
                <span className="text-[#111111]">
                  {personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              </>
            )}
            {personalInfo.portfolioUrl && (
              <>
                <span>•</span>
                <span className="text-[#111111]">
                  {personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              </>
            )}
          </div>
          {isPhotoTemplate && personalInfo.summary && (
            <p className="text-[10pt] text-[#111111] mt-2 leading-relaxed text-justify">
              {personalInfo.summary}
            </p>
          )}
        </div>

        {isPhotoTemplate && (
          <div className="shrink-0">
            {personalInfo.photoUrl ? (
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName || "Foto Kandidat"}
                className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-[2px] border border-black/40 shadow-sm"
              />
            ) : (
              <div className="w-20 h-24 sm:w-24 sm:h-28 border-2 border-dashed border-neutral-400 rounded-[2px] bg-neutral-50 flex flex-col items-center justify-center text-center p-2 text-neutral-500">
                <span className="text-[10px] font-bold">Pasfoto Formal</span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* SUMMARY (For standard ATS Harvard template without photo) */}
      {!isPhotoTemplate && personalInfo.summary && (
        <section className="mb-4">
          <p className="text-[10pt] text-[#111111] leading-relaxed text-justify">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* EDUCATION SECTION */}
      {hasEducations && (
        <section className="mb-4">
          <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            {isEn ? "EDUCATION" : "PENDIDIKAN"}
          </h2>
          <div className="space-y-2">
            {educations.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline font-bold text-[10.5pt]">
                  <span>{edu.institution}</span>
                  <span className="font-normal text-[10pt]">{edu.city}</span>
                </div>
                <div className="flex justify-between items-baseline text-[10pt] italic">
                  <span>
                    {edu.degree} {edu.fieldOfStudy}
                    {edu.gpa ? ` — IPK: ${edu.gpa}` : ""}
                  </span>
                  <span className="not-italic text-[9.5pt]">
                    {edu.startDate} – {edu.current ? (isEn ? "Present" : "Sekarang") : edu.endDate}
                  </span>
                </div>
                {edu.description && (
                  <p className="text-[9.5pt] text-[#333333] mt-0.5 leading-snug">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EXPERIENCE SECTION */}
      {hasExperiences && (
        <section className="mb-4">
          <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            {isEn ? "EXPERIENCE & ORGANIZATIONS" : "PENGALAMAN KERJA & ORGANISASI"}
          </h2>
          <div className="space-y-2.5">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline font-bold text-[10.5pt]">
                  <span>{exp.organization}</span>
                  <span className="font-normal text-[10pt]">{exp.city}</span>
                </div>
                <div className="flex justify-between items-baseline text-[10pt] italic">
                  <span className="font-semibold">{exp.role}</span>
                  <span className="not-italic text-[9.5pt]">
                    {exp.startDate} – {exp.current ? (isEn ? "Present" : "Sekarang") : exp.endDate}
                  </span>
                </div>
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[9.5pt] text-[#111111] leading-snug">
                  {exp.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SKILLS SECTION */}
      {hasSkills && (
        <section className="mb-4">
          <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            {isEn ? "SKILLS" : "KEAHLIAN"}
          </h2>
          <div className="text-[10pt] space-y-1 text-[#111111]">
            {skills.technical.length > 0 && (
              <p>
                <strong className="font-bold">
                  {isEn ? "Technical Skills: " : "Keahlian Teknis: "}
                </strong>
                {skills.technical.join(", ")}
              </p>
            )}
            {skills.tools.length > 0 && (
              <p>
                <strong className="font-bold">
                  {isEn ? "Tools & Software: " : "Perangkat Lunak / Tools: "}
                </strong>
                {skills.tools.join(", ")}
              </p>
            )}
            {skills.languages.length > 0 && (
              <p>
                <strong className="font-bold">
                  {isEn ? "Languages: " : "Bahasa: "}
                </strong>
                {skills.languages.join(", ")}
              </p>
            )}
          </div>
        </section>
      )}

      {/* CERTIFICATIONS SECTION */}
      {hasCertifications && (
        <section className="mb-4">
          <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            {isEn ? "CERTIFICATIONS" : "SERTIFIKASI"}
          </h2>
          <div className="space-y-1.5 text-[10pt]">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-baseline">
                <span>
                  <strong>{cert.name}</strong> — {cert.issuer}
                  {cert.credentialId ? ` (ID: ${cert.credentialId})` : ""}
                </span>
                <span className="text-[9.5pt]">{cert.issueDate}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AWARDS SECTION */}
      {hasAwards && (
        <section className="mb-4">
          <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            {isEn ? "HONORS & AWARDS" : "PENGHARGAAN"}
          </h2>
          <div className="space-y-1.5 text-[10pt]">
            {awards.map((award) => (
              <div key={award.id} className="flex justify-between items-baseline">
                <span>
                  <strong>{award.title}</strong> — {award.issuer}
                  {award.description ? ` (${award.description})` : ""}
                </span>
                <span className="text-[9.5pt]">{award.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
