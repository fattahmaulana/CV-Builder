import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { CvData } from "@/types/cv";
import { buildCvModel } from "@/lib/cv/buildCvModel";

// Disable automatic hyphenation for pristine ATS textual parsing and reading order
Font.registerHyphenationCallback((word) => [word]);

// Standard ATS Harvard Typography styles using native standard PDF fonts
const styles = StyleSheet.create({
  page: {
    paddingTop: 54, // 0.75 - 1 inch
    paddingBottom: 54,
    paddingLeft: 54,
    paddingRight: 54,
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.3,
    color: "#000000",
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
  },
  headerWithPhoto: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    paddingBottom: 6,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  photo: {
    width: 60,
    height: 75,
    objectFit: "cover",
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: "#444444",
  },
  name: {
    fontSize: 16,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  contactRow: {
    fontSize: 9,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
    color: "#222222",
  },
  section: {
    marginBottom: 9,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 0.8,
    borderBottomColor: "#000000",
    borderBottomStyle: "solid",
    paddingBottom: 1.5,
    marginBottom: 4,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  entryTitle: {
    fontFamily: "Times-Bold",
    fontSize: 10,
  },
  entrySubtitle: {
    fontFamily: "Times-Italic",
    fontSize: 9.5,
  },
  entryMeta: {
    fontFamily: "Times-Roman",
    fontSize: 9,
    textAlign: "right",
  },
  bulletList: {
    marginTop: 2,
    paddingLeft: 12,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 1.5,
  },
  bulletPoint: {
    width: 8,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.25,
  },
  summaryText: {
    fontSize: 9.5,
    textAlign: "justify",
    lineHeight: 1.3,
  },
  skillRow: {
    fontSize: 9.5,
    marginBottom: 2,
    lineHeight: 1.25,
  },
  bold: {
    fontFamily: "Times-Bold",
  },
});

export function HarvardPdfDocument({
  data,
  isPaid = false,
}: {
  data: CvData;
  isPaid?: boolean;
}) {
  const model = buildCvModel(data);
  const isEn = model.metadata.language === "en";
  const { personalInfo, educations, experiences, skills, certifications, awards } = model;

  const contactItems: string[] = [];
  if (personalInfo.city) contactItems.push(personalInfo.city);
  if (personalInfo.phone) contactItems.push(personalInfo.phone);
  if (personalInfo.email) contactItems.push(personalInfo.email);
  if (personalInfo.linkedinUrl) {
    contactItems.push(personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ""));
  }
  if (personalInfo.portfolioUrl) {
    contactItems.push(personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, ""));
  }

  const isPhotoTemplate = model.metadata.template === "with-photo";
  const hasPhoto = Boolean(personalInfo.photoUrl);

  return (
    <Document title={`CV - ${personalInfo.fullName || "CVBuilder"}`} author="CVBuilder">
      <Page size="A4" style={styles.page}>
        {/* HEADER: Candidate Name & Contacts (with photo if Template B) */}
        {isPhotoTemplate && hasPhoto ? (
          <View style={styles.headerWithPhoto}>
            <View style={styles.headerLeft}>
              <Text style={[styles.name, { textAlign: "left" }]}>
                {personalInfo.fullName || (isEn ? "YOUR FULL NAME" : "NAMA LENGKAP ANDA")}
              </Text>
              <Text style={[styles.contactRow, { justifyContent: "flex-start", textAlign: "left" }]}>
                {contactItems.join("  •  ")}
              </Text>
              {personalInfo.summary ? (
                <Text style={[styles.summaryText, { marginTop: 4 }]}>{personalInfo.summary}</Text>
              ) : null}
            </View>
            <Image src={personalInfo.photoUrl} style={styles.photo} />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.name}>
                {personalInfo.fullName || (isEn ? "YOUR FULL NAME" : "NAMA LENGKAP ANDA")}
              </Text>
              <Text style={styles.contactRow}>
                {contactItems.join("  •  ")}
              </Text>
            </View>

            {/* SUMMARY */}
            {personalInfo.summary ? (
              <View style={styles.section}>
                <Text style={styles.summaryText}>{personalInfo.summary}</Text>
              </View>
            ) : null}
          </>
        )}

        {/* EDUCATION */}
        {educations.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              {isEn ? "EDUCATION" : "PENDIDIKAN"}
            </Text>
            {educations.map((edu) => (
              <View key={edu.id} style={{ marginBottom: 4 }}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{edu.institution}</Text>
                  <Text style={styles.entryMeta}>{edu.city || ""}</Text>
                </View>
                <View style={styles.entryHeader}>
                  <Text style={styles.entrySubtitle}>
                    {edu.degree} {edu.fieldOfStudy}
                    {edu.gpa ? ` — IPK: ${edu.gpa}` : ""}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {edu.startDate} – {edu.current ? (isEn ? "Present" : "Sekarang") : edu.endDate}
                  </Text>
                </View>
                {edu.description ? (
                  <Text style={{ fontSize: 9, color: "#333333", marginTop: 1 }}>
                    {edu.description}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* EXPERIENCE */}
        {experiences.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              {isEn ? "EXPERIENCE & ORGANIZATIONS" : "PENGALAMAN KERJA & ORGANISASI"}
            </Text>
            {experiences.map((exp) => (
              <View key={exp.id} style={{ marginBottom: 4 }}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{exp.organization}</Text>
                  <Text style={styles.entryMeta}>{exp.city || ""}</Text>
                </View>
                <View style={styles.entryHeader}>
                  <Text style={styles.entrySubtitle}>{exp.role}</Text>
                  <Text style={styles.entryMeta}>
                    {exp.startDate} – {exp.current ? (isEn ? "Present" : "Sekarang") : exp.endDate}
                  </Text>
                </View>
                <View style={styles.bulletList}>
                  {exp.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={styles.bulletItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* SKILLS */}
        {skills.technical.length > 0 || skills.tools.length > 0 || skills.languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              {isEn ? "SKILLS" : "KEAHLIAN"}
            </Text>
            {skills.technical.length > 0 ? (
              <Text style={styles.skillRow}>
                <Text style={styles.bold}>
                  {isEn ? "Technical Skills: " : "Keahlian Teknis: "}
                </Text>
                {skills.technical.join(", ")}
              </Text>
            ) : null}
            {skills.tools.length > 0 ? (
              <Text style={styles.skillRow}>
                <Text style={styles.bold}>
                  {isEn ? "Tools & Software: " : "Perangkat Lunak / Tools: "}
                </Text>
                {skills.tools.join(", ")}
              </Text>
            ) : null}
            {skills.languages.length > 0 ? (
              <Text style={styles.skillRow}>
                <Text style={styles.bold}>
                  {isEn ? "Languages: " : "Bahasa: "}
                </Text>
                {skills.languages.join(", ")}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* CERTIFICATIONS */}
        {certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              {isEn ? "CERTIFICATIONS" : "SERTIFIKASI"}
            </Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={[styles.entryHeader, { marginBottom: 2 }]}>
                <Text style={{ fontSize: 9.5 }}>
                  <Text style={styles.bold}>{cert.name}</Text> — {cert.issuer}
                  {cert.credentialId ? ` (ID: ${cert.credentialId})` : ""}
                </Text>
                <Text style={styles.entryMeta}>{cert.issueDate}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* AWARDS */}
        {awards.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              {isEn ? "HONORS & AWARDS" : "PENGHARGAAN"}
            </Text>
            {awards.map((award) => (
              <View key={award.id} style={[styles.entryHeader, { marginBottom: 2 }]}>
                <Text style={{ fontSize: 9.5 }}>
                  <Text style={styles.bold}>{award.title}</Text> — {award.issuer}
                  {award.description ? ` (${award.description})` : ""}
                </Text>
                <Text style={styles.entryMeta}>{award.year}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
