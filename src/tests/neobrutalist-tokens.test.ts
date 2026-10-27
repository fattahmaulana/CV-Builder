import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { calculateYiqContrast, getAccentTextColor } from "@/lib/theme/yiq";

describe("Tahap 1: Neobrutalist Design Tokens & YIQ Contrast Verification", () => {
  const tokensPath = path.resolve(process.cwd(), "src/styles/tokens.css");
  const globalsPath = path.resolve(process.cwd(), "src/app/globals.css");
  const tokensContent = fs.readFileSync(tokensPath, "utf-8");
  const globalsContent = fs.readFileSync(globalsPath, "utf-8");

  describe("1. Exact Design Tokens Verification", () => {
    it("declares exact required Neobrutalist color tokens", () => {
      expect(tokensContent).toContain("--bg: #FFFBEB;");
      expect(tokensContent).toContain("--surface: #FFFFFF;");
      expect(tokensContent).toContain("--text: #000000;");
      expect(tokensContent).toContain("--border: #000000;");
      expect(tokensContent).toContain("--accent: #FFE500;");
      expect(tokensContent).toContain("--accent-2: #FF6B9D;");
      expect(tokensContent).toContain("--accent-3: #4D7CFF;");
      expect(tokensContent).toContain("--shadow: 4px 4px 0 0 #000000;");
    });

    it("restricts border radius to maximum 4px and enforces 2px-3px borders", () => {
      expect(tokensContent).toContain("--border-width: 3px;");
      expect(tokensContent).toContain("--radius-max: 4px;");
    });
  });

  describe("2. YIQ Formula Contrast Calculation", () => {
    it("determines high-contrast black text for bright yellow accent (#FFE500)", () => {
      expect(calculateYiqContrast("#FFE500")).toBe("#000000");
      expect(getAccentTextColor("accent")).toBe("#000000");
    });

    it("determines high-contrast black text for bubblegum pink accent (#FF6B9D)", () => {
      expect(calculateYiqContrast("#FF6B9D")).toBe("#000000");
      expect(getAccentTextColor("accent-2")).toBe("#000000");
    });

    it("determines high-contrast white text for deep royal blue accent (#4D7CFF)", () => {
      expect(calculateYiqContrast("#4D7CFF")).toBe("#FFFFFF");
      expect(getAccentTextColor("accent-3")).toBe("#FFFFFF");
    });

    it("handles short hex colors and extreme values", () => {
      expect(calculateYiqContrast("#000")).toBe("#FFFFFF");
      expect(calculateYiqContrast("#FFF")).toBe("#000000");
      expect(calculateYiqContrast("#FFFFFF")).toBe("#000000");
      expect(calculateYiqContrast("#000000")).toBe("#FFFFFF");
    });
  });

  describe("3. Global Neobrutalist Interaction Classes", () => {
    it("includes .hard-drop class with duration under 80ms", () => {
      expect(globalsContent).toContain(".hard-drop");
      expect(globalsContent).toContain("70ms");
      expect(globalsContent).toContain("transform: translate(4px, 4px) !important;");
      expect(globalsContent).toContain("box-shadow: 0 0 0 0 #000000 !important;");
    });

    it("includes .sticker classes with 2 to 4 degree tilts", () => {
      expect(globalsContent).toContain(".sticker");
      expect(globalsContent).toContain(".sticker-left");
      expect(globalsContent).toContain("rotate(-3deg)");
      expect(globalsContent).toContain(".sticker-right");
      expect(globalsContent).toContain("rotate(3deg)");
    });

    it("enforces thick yellow focus outline with black border", () => {
      expect(globalsContent).toContain(":focus-visible");
      expect(globalsContent).toContain("3px solid #000000");
      expect(globalsContent).toContain("var(--accent)");
    });
  });
});
