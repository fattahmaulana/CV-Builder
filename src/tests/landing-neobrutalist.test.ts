import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { isWeakDevice, shouldEnableRichAnimations, isReducedMotionPreferred } from "@/lib/animations/device";

describe("Tahap 2: Neobrutalist Landing Page & Animations Verification", () => {
  const landingDir = path.resolve(process.cwd(), "src/components/landing");

  describe("1. Navbar Architecture & Interactions", () => {
    const navbarClientPath = path.join(landingDir, "NavbarClient.tsx");
    const navbarContent = fs.readFileSync(navbarClientPath, "utf-8");

    it("declares sticky shrink after 80px scroll and hard shadows", () => {
      expect(navbarContent).toContain("isScrolledPast80");
      expect(navbarContent).toContain("shadow-[6px_6px_0_0_#000000]");
      expect(navbarContent).toContain("shadow-[4px_4px_0_0_#000000]");
    });

    it("supports 3D flip effect on desktop links", () => {
      expect(navbarContent).toContain("perspective-[500px]");
      expect(navbarContent).toContain("rotateX(-90deg)");
      expect(navbarContent).toContain("navbar-hover-pill");
    });

    it("includes mobile full-screen menu with staggered entrance and sequence numbers", () => {
      expect(navbarContent).toContain("isMobileOpen");
      expect(navbarContent).toContain("0{idx + 1}");
      expect(navbarContent).toContain("Escape");
    });

    it("renders clean navbar without scroll progress bar line", () => {
      expect(navbarContent).not.toContain("scrollProgress");
    });
  });

  describe("2. Device Performance & Reduced Motion Guard", () => {
    it("provides device capability detection functions", () => {
      expect(typeof isWeakDevice).toBe("function");
      expect(typeof isReducedMotionPreferred).toBe("function");
      expect(typeof shouldEnableRichAnimations).toBe("function");
    });
  });

  describe("3. 10 Core Animations & Sections Verification", () => {
    it("Hero (Animation 1): has mask-reveal word stagger, bouncing stickers, and 3D card stack", () => {
      const heroPath = path.join(landingDir, "HeroSection.tsx");
      const heroContent = fs.readFileSync(heroPath, "utf-8");
      const stackPath = path.join(landingDir, "Hero3DCardStack.tsx");
      const stackContent = fs.readFileSync(stackPath, "utf-8");

      expect(heroContent).toContain("HEADLINE_WORDS_LINE_1");
      expect(heroContent).toContain("animationDelay");
      expect(heroContent).toContain("sticker-left");
      expect(heroContent).toContain("sticker-right");
      expect(heroContent).toContain("Hero3DCardStack");

      // Verify CSS 3D transforms without Three.js
      expect(stackContent).toContain("perspective-[1200px]");
      expect(stackContent).toContain("transform-style-3d");
      expect(stackContent).toContain("rotateX");
      expect(stackContent).toContain("rotateY");
      expect(stackContent).not.toContain("three");
    });

    it("Marquee (Animation 2): moving ribbon with dynamic scroll acceleration", () => {
      const marqueePath = path.join(landingDir, "MarqueeRibbon.tsx");
      const marqueeContent = fs.readFileSync(marqueePath, "utf-8");

      expect(marqueeContent).toContain("CV ATS");
      expect(marqueeContent).toContain("FORMAT HARVARD");
      expect(marqueeContent).toContain("KATA KUNCI COCOK");
      expect(marqueeContent).toContain("RP5.000");
      expect(marqueeContent).toContain("ScrollTrigger");
    });

    it("Transform Demo (Animation 3): interactive arcade typewriter with cartridges, coin insert, and polished ATS output", () => {
      const demoPath = path.join(landingDir, "TransformDemo.tsx");
      const demoContent = fs.readFileSync(demoPath, "utf-8");

      expect(demoContent).toContain("CARTRIDGES");
      expect(demoContent).toContain("Mesin Poles CV");
      expect(demoContent).toContain("KOIN");
      expect(demoContent).toContain("cartridge.raw");
    });

    it("How It Works (Animation 4): 3-step interactive card workflow with connectors", () => {
      const hiwPath = path.join(landingDir, "HowItWorksSticky.tsx");
      const hiwContent = fs.readFileSync(hiwPath, "utf-8");

      expect(hiwContent).toContain("STEPS");
      expect(hiwContent).toContain("Connector");
      expect(hiwContent).toContain("setActive");
    });

    it("Career Ecosystem: unified interactive showcase for CV Maker, Cari Lowongan, and Pelacak Lamaran", () => {
      const ecoPath = path.join(landingDir, "CareerEcosystemSection.tsx");
      const ecoContent = fs.readFileSync(ecoPath, "utf-8");

      expect(ecoContent).toContain("Pembuat CV ATS");
      expect(ecoContent).toContain("Cari Lowongan");
      expect(ecoContent).toContain("Pelacak Lamaran");
      expect(ecoContent).toContain("Wawancara");
      expect(ecoContent).toContain("activeTab");
    });

    it("Text Fill (Animation 7): giant statement text filling color on scroll", () => {
      const textFillPath = path.join(landingDir, "TextFillScrollSection.tsx");
      const textFillContent = fs.readFileSync(textFillPath, "utf-8");

      expect(textFillContent).toContain("STATEMENT_WORDS");
      expect(textFillContent).toContain("fill-word");
      expect(textFillContent).toContain("scrub: 0.5");
    });

    it("Pricing (Animation 8): 3D cursor tilt with single Rp5.000 fee and no subscriptions", () => {
      const pricingPath = path.join(landingDir, "PricingSection.tsx");
      const pricingContent = fs.readFileSync(pricingPath, "utf-8");

      expect(pricingContent).toContain("rotateX");
      expect(pricingContent).toContain("rotateY");
      expect(pricingContent).toContain("5.000");
      expect(pricingContent.toUpperCase()).toContain("SEKALI BAYAR");
    });

    it("FAQ (Animation 9): accordion using grid-template-rows height animation", () => {
      const faqPath = path.join(landingDir, "FaqSection.tsx");
      const faqContent = fs.readFileSync(faqPath, "utf-8");

      expect(faqContent).toContain("grid-rows-[1fr]");
      expect(faqContent).toContain("grid-rows-[0fr]");
      expect(faqContent).toContain("FAQS");
    });

    it("Smooth Scroll: Lenis integrated on landing page only with ScrollTrigger sync", () => {
      const lenisPath = path.join(landingDir, "LenisProvider.tsx");
      const lenisContent = fs.readFileSync(lenisPath, "utf-8");

      expect(lenisContent).toContain("new Lenis");
      expect(lenisContent).toContain("shouldEnableRichAnimations");
    });
  });
});
