import { describe, it, expect } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { FAQS } from "../components/landing/FaqSection";

describe("SEO Infrastructure & Policy Compliance", () => {
  it("should configure robots.txt protecting private routes while exposing educational content", () => {
    const rules = robots();
    expect(rules.sitemap).toContain("/sitemap.xml");

    const rootRule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    expect(rootRule).toBeDefined();

    const disallow = Array.isArray(rootRule.disallow)
      ? rootRule.disallow
      : [rootRule.disallow];

    // Crucial private routes must be disallowed
    expect(disallow).toContain("/dashboard/*");
    expect(disallow).toContain("/cv/*");
    expect(disallow).toContain("/tracker/*");
    expect(disallow).toContain("/api/*");

    const allow = Array.isArray(rootRule.allow)
      ? rootRule.allow
      : [rootRule.allow];
    expect(allow).toContain("/");
    expect(allow).toContain("/panduan/*");
  });

  it("should generate a complete sitemap.xml with proper priorities", () => {
    const siteUrls = sitemap();
    expect(siteUrls.length).toBeGreaterThanOrEqual(5);

    const home = siteUrls.find((s) => !s.url.includes("/panduan") && !s.url.includes("/privacy"));
    expect(home).toBeDefined();
    expect(home?.priority).toBe(1.0);

    const educationalPaths = siteUrls.filter((s) => s.url.includes("/panduan/"));
    expect(educationalPaths.length).toBe(3);
  });

  it("should include honest disclaimers in FAQs without prohibited claims", () => {
    // Prohibited: "pasti lolos", "auto lolos", "100% lolos"
    const passRateFaq = FAQS.find((f) =>
      f.question.toLowerCase().includes("pasti membuat saya lolos")
    );
    expect(passRateFaq).toBeDefined();

    const answer = passRateFaq!.answer.toLowerCase();
    // Must clearly state that no system can guarantee 100% acceptance
    expect(answer).toContain("tidak ada");
    expect(answer).toContain("menjamin");
    expect(answer).toContain("rekruter");

    // Prohibited marketing claim check:
    expect(answer).not.toContain("pasti lolos seleksi");
    expect(answer).not.toContain("auto lolos");
  });
});
