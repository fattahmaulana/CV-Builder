import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import { CvData } from "@/types/cv";
import { buildCvModel } from "@/lib/cv/buildCvModel";

/**
 * Generates an ATS-compliant Harvard DOCX file using official Word heading styles
 */
export async function generateHarvardDocxBuffer(
  data: CvData,
  isPaid: boolean = false
): Promise<Buffer> {
  const model = buildCvModel(data);
  const isEn = model.metadata.language === "en";
  const { personalInfo, educations, experiences, skills, certifications, awards } = model;
  const isPhotoTemplate = model.metadata.template === "with-photo";

  const children: Paragraph[] = [];

  // Optional: Embed Candidate Passport Photo for Template B if available as base64
  if (isPhotoTemplate && personalInfo.photoUrl?.startsWith("data:image/")) {
    try {
      const base64Data = personalInfo.photoUrl.split(",")[1];
      if (base64Data) {
        const imgBuffer = Buffer.from(base64Data, "base64");
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 100 },
            children: [
              new ImageRun({
                data: imgBuffer,
                transformation: {
                  width: 75,
                  height: 95,
                },
                type: personalInfo.photoUrl.includes("image/jpeg") || personalInfo.photoUrl.includes("image/jpg") ? "jpg" : "png",
              }),
            ],
          })
        );
      }
    } catch (imgErr) {
      console.warn("Could not embed photo in DOCX:", imgErr);
    }
  }

  // 1. CANDIDATE NAME (Heading 1 / Title)
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: (personalInfo.fullName || (isEn ? "YOUR FULL NAME" : "NAMA LENGKAP ANDA")).toUpperCase(),
          bold: true,
          size: 32, // 16pt (half-points)
          font: "Times New Roman",
          color: "000000",
        }),
      ],
    })
  );

  // 2. CONTACT ROW
  const contacts: string[] = [];
  if (personalInfo.city) contacts.push(personalInfo.city);
  if (personalInfo.phone) contacts.push(personalInfo.phone);
  if (personalInfo.email) contacts.push(personalInfo.email);
  if (personalInfo.linkedinUrl) {
    contacts.push(personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ""));
  }
  if (personalInfo.portfolioUrl) {
    contacts.push(personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, ""));
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: contacts.join("  •  "),
          size: 19, // 9.5pt
          font: "Times New Roman",
          color: "222222",
        }),
      ],
    })
  );

  // Helper for Section Headings with border-bottom
  const createSectionHeading = (title: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 100 },
      border: {
        bottom: {
          color: "000000",
          space: 2,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 21, // 10.5pt
          font: "Times New Roman",
          color: "000000",
        }),
      ],
    });

  // 3. SUMMARY
  if (personalInfo.summary) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: personalInfo.summary,
            size: 19, // 9.5pt
            font: "Times New Roman",
          }),
        ],
      })
    );
  }

  // 4. EDUCATION
  if (educations.length > 0) {
    children.push(createSectionHeading(isEn ? "EDUCATION" : "PENDIDIKAN"));

    for (const edu of educations) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 30 },
          children: [
            new TextRun({
              text: edu.institution,
              bold: true,
              size: 20,
              font: "Times New Roman",
            }),
            new TextRun({
              text: `\t${edu.city || ""}`,
              size: 19,
              font: "Times New Roman",
            }),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: `${edu.degree} ${edu.fieldOfStudy}${edu.gpa ? ` — IPK: ${edu.gpa}` : ""}`,
              italics: true,
              size: 19,
              font: "Times New Roman",
            }),
            new TextRun({
              text: `\t${edu.startDate} – ${edu.current ? (isEn ? "Present" : "Sekarang") : edu.endDate}`,
              size: 19,
              font: "Times New Roman",
            }),
          ],
        })
      );

      if (edu.description) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: edu.description,
                size: 18,
                font: "Times New Roman",
                color: "333333",
              }),
            ],
          })
        );
      }
    }
  }

  // 5. EXPERIENCE
  if (experiences.length > 0) {
    children.push(createSectionHeading(isEn ? "EXPERIENCE & ORGANIZATIONS" : "PENGALAMAN KERJA & ORGANISASI"));

    for (const exp of experiences) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 30 },
          children: [
            new TextRun({
              text: exp.organization,
              bold: true,
              size: 20,
              font: "Times New Roman",
            }),
            new TextRun({
              text: `\t${exp.city || ""}`,
              size: 19,
              font: "Times New Roman",
            }),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: exp.role,
              italics: true,
              bold: true,
              size: 19,
              font: "Times New Roman",
            }),
            new TextRun({
              text: `\t${exp.startDate} – ${exp.current ? (isEn ? "Present" : "Sekarang") : exp.endDate}`,
              size: 19,
              font: "Times New Roman",
            }),
          ],
        })
      );

      for (const bullet of exp.bullets) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: bullet,
                size: 19,
                font: "Times New Roman",
              }),
            ],
          })
        );
      }
    }
  }

  // 6. SKILLS
  if (skills.technical.length > 0 || skills.tools.length > 0 || skills.languages.length > 0) {
    children.push(createSectionHeading(isEn ? "SKILLS" : "KEAHLIAN"));

    if (skills.technical.length > 0) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: isEn ? "Technical Skills: " : "Keahlian Teknis: ",
              bold: true,
              size: 19,
              font: "Times New Roman",
            }),
            new TextRun({
              text: skills.technical.join(", "),
              size: 19,
              font: "Times New Roman",
            }),
          ],
        })
      );
    }

    if (skills.tools.length > 0) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: isEn ? "Tools & Software: " : "Perangkat Lunak / Tools: ",
              bold: true,
              size: 19,
              font: "Times New Roman",
            }),
            new TextRun({
              text: skills.tools.join(", "),
              size: 19,
              font: "Times New Roman",
            }),
          ],
        })
      );
    }

    if (skills.languages.length > 0) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: isEn ? "Languages: " : "Bahasa: ",
              bold: true,
              size: 19,
              font: "Times New Roman",
            }),
            new TextRun({
              text: skills.languages.join(", "),
              size: 19,
              font: "Times New Roman",
            }),
          ],
        })
      );
    }
  }

  // 7. CERTIFICATIONS
  if (certifications.length > 0) {
    children.push(createSectionHeading(isEn ? "CERTIFICATIONS" : "SERTIFIKASI"));

    for (const cert of certifications) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: cert.name,
              bold: true,
              size: 19,
              font: "Times New Roman",
            }),
            new TextRun({
              text: ` — ${cert.issuer}${cert.credentialId ? ` (ID: ${cert.credentialId})` : ""}`,
              size: 19,
              font: "Times New Roman",
            }),
            new TextRun({
              text: `\t${cert.issueDate}`,
              size: 19,
              font: "Times New Roman",
            }),
          ],
        })
      );
    }
  }

  // 8. AWARDS
  if (awards.length > 0) {
    children.push(createSectionHeading(isEn ? "HONORS & AWARDS" : "PENGHARGAAN"));

    for (const award of awards) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: award.title,
              bold: true,
              size: 19,
              font: "Times New Roman",
            }),
            new TextRun({
              text: ` — ${award.issuer}${award.description ? ` (${award.description})` : ""}`,
              size: 19,
              font: "Times New Roman",
            }),
            new TextRun({
              text: `\t${award.year}`,
              size: 19,
              font: "Times New Roman",
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
