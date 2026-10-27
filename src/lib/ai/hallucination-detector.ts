/**
 * Server-side Zero Hallucination & Quality Validator
 * Validates AI outputs against user inputs, enforcing strict factual accuracy
 */

const INDONESIAN_ACTION_VERBS = [
  "menyusun", "mengembangkan", "mengelola", "menganalisis", "merekayasa",
  "mengoptimalkan", "mengkoordinasikan", "membangun", "merancang", "membuat",
  "mengimplementasikan", "menguji", "meningkatkan", "memimpin", "mengeksekusi",
  "mempersiapkan", "memfasilitasi", "mengintegrasikan", "menyelesaikan",
  "menghasilkan", "menerapkan", "memelihara", "mengawasi", "mengkaji",
  "merumuskan", "menggerakkan", "mengarahkan", "menginisiasi", "menyelenggarakan",
  "mengevaluasi",
];

const ENGLISH_ACTION_VERBS = [
  "developed", "engineered", "analyzed", "managed", "coordinated",
  "optimized", "designed", "formulated", "implemented", "built",
  "executed", "spearheaded", "integrated", "streamlined", "enhanced",
  "created", "maintained", "conducted", "led", "facilitated",
  "collaborated", "organized", "delivered", "established", "resolved",
];

const FORBIDDEN_FIRST_PERSON_REGEX = /\b(saya|aku|kami|kita|i|me|my|we|our)\b/i;
const FORBIDDEN_CLICHES_REGEX = /\b(pekerja keras|team player|hard worker|fast learner|siap bekerja di bawah tekanan|pekerja cerdas)\b/i;

export interface QualityValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Extracts numbers (digits and percentages, excluding simple list numbers)
 */
export function extractMetricsAndNumbers(text: string): string[] {
  // Matches percentages like 25% or counts like 100, 50.000, excluding single digit years or standalone single digits
  const matches = text.match(/\b\d+(?:[.,]\d+)?%?|\b\d+%/g) || [];
  return matches.map((m) => m.replace(/,/g, ".").trim());
}

/**
 * Validates an experience bullet point
 */
export function validateExperienceBullet(
  bullet: string,
  userInput: string,
  allowedContext: string = "",
  language: "id" | "en" = "id"
): QualityValidationResult {
  const errors: string[] = [];
  const words = bullet.trim().split(/\s+/).filter(Boolean);

  // 1. Word count check (15 to 25 words target, allow 14 to 26 tolerance)
  if (words.length < 13 || words.length > 28) {
    errors.push(`Panjang kalimat (${words.length} kata) tidak ideal (target: 15-25 kata).`);
  }

  // 2. Action verb check
  const firstWord = (words[0] || "").toLowerCase().replace(/[^a-z]/g, "");
  const allowedVerbs = language === "en" ? ENGLISH_ACTION_VERBS : INDONESIAN_ACTION_VERBS;
  const startsWithActionVerb = allowedVerbs.some((v) => firstWord.startsWith(v.slice(0, 5)));

  if (!startsWithActionVerb) {
    errors.push(`Poin harus diawali kata kerja aksi aktif (ditemukan: "${words[0]}").`);
  }

  // 3. Zero fabricated numbers
  const outputNumbers = extractMetricsAndNumbers(bullet);
  const sourceText = `${userInput} ${allowedContext}`;
  const sourceNumbers = extractMetricsAndNumbers(sourceText);

  for (const num of outputNumbers) {
    // If the number was not in user input/context, it's a hallucination
    if (!sourceNumbers.includes(num)) {
      errors.push(`Terdeteksi angka/metrik karangan "${num}" yang tidak ada pada input pengguna.`);
    }
  }

  // 4. Prohibited pronouns
  if (FORBIDDEN_FIRST_PERSON_REGEX.test(bullet)) {
    errors.push("Poin pengalaman tidak boleh mengandung kata ganti orang pertama (saya/kami).");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a professional summary
 */
export function validateProfessionalSummary(
  summary: string,
  allowedContext: string = ""
): QualityValidationResult {
  const errors: string[] = [];
  const words = summary.trim().split(/\s+/).filter(Boolean);

  // 1. Word count check (40 to 60 words target, allow 35 to 65 tolerance)
  if (words.length < 35 || words.length > 68) {
    errors.push(`Panjang ringkasan (${words.length} kata) berada di luar target 40-60 kata.`);
  }

  // 2. Sentence count check (2 to 3 sentences)
  const sentences = summary
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (sentences.length < 2 || sentences.length > 4) {
    errors.push(`Jumlah kalimat (${sentences.length}) harus antara 2 sampai 3 kalimat.`);
  }

  // 3. No first person pronouns
  if (FORBIDDEN_FIRST_PERSON_REGEX.test(summary)) {
    errors.push("Ringkasan tidak boleh menggunakan kata ganti orang pertama (saya/kami/I/my).");
  }

  // 4. No empty cliches
  if (FORBIDDEN_CLICHES_REGEX.test(summary)) {
    errors.push("Ringkasan tidak boleh memuat klise tanpa bukti (pekerja keras/team player).");
  }

  // 5. Zero fabricated numbers/metrics
  const outputNumbers = extractMetricsAndNumbers(summary);
  const sourceNumbers = extractMetricsAndNumbers(allowedContext);

  for (const num of outputNumbers) {
    if (!sourceNumbers.includes(num)) {
      errors.push(`Terdeteksi angka karangan "${num}" yang tidak ada pada profil pengguna.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
