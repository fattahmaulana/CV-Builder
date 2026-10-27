import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";
import { LenisProvider } from "@/components/landing/LenisProvider";
import { OrganizationJsonLd, ProductJsonLd } from "@/components/seo/JsonLd";
import {
  MarqueeRibbon,
  TransformDemo,
  HowItWorksSticky,
  CareerEcosystemSection,
  TextFillScrollSection,
  FaqSection,
} from "@/components/landing/LandingInteractiveWidgets";

export default function HomePage() {
  return (
    <LenisProvider>
      {/* Search Engine Structured Data */}
      <OrganizationJsonLd />
      <ProductJsonLd />

      <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)]">
        {/* Professional Neobrutalist Navbar */}
        <Navbar />

        <main id="main-content" className="flex-1">
          {/* Section 1: Hero with 3D Stack, Word Stagger Reveal & Bouncing Stickers */}
          <HeroSection />

          {/* Section 2: Infinite Marquee Ribbon with dynamic scroll speed */}
          <MarqueeRibbon />

          {/* Section 3: Interactive Transform Demo */}
          <TransformDemo />

          {/* Section 4: Pinned How It Works Steps & Dynamic Step Card */}
          <HowItWorksSticky />

          {/* Section 5: Ekosistem Lengkap (CV Maker, Cari Lowongan, Pelacak Lamaran) */}
          <CareerEcosystemSection />

          {/* Section 6: Giant Manifesto Text Filling Color on Scroll */}
          <TextFillScrollSection />

          {/* Section 8: Neobrutalist Pricing Card with 3D Cursor Tilt */}
          <PricingSection />

          {/* Section 9: FAQ Accordion with Grid-Template-Rows Height Animation */}
          <FaqSection />
        </main>

        <Footer />
      </div>
    </LenisProvider>
  );
}
