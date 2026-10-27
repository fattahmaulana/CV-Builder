"use client";

import dynamic from "next/dynamic";

export const MarqueeRibbon = dynamic(
  () =>
    import("@/components/landing/MarqueeRibbon").then(
      (mod) => mod.MarqueeRibbon
    ),
  {
    ssr: false,
    loading: () => <div className="h-14 bg-[var(--accent)] border-y-[3px] border-black" />,
  }
);

export const TransformDemo = dynamic(
  () =>
    import("@/components/landing/TransformDemo").then(
      (mod) => mod.TransformDemo
    ),
  {
    ssr: false,
    loading: () => <div className="py-12 min-h-[300px]" />,
  }
);

export const HowItWorksSticky = dynamic(
  () =>
    import("@/components/landing/HowItWorksSticky").then(
      (mod) => mod.HowItWorksSticky
    ),
  {
    ssr: false,
    loading: () => <div className="py-24 min-h-[500px]" />,
  }
);

export const CareerEcosystemSection = dynamic(
  () =>
    import("@/components/landing/CareerEcosystemSection").then(
      (mod) => mod.CareerEcosystemSection
    ),
  {
    ssr: false,
    loading: () => <div className="py-24 min-h-[500px]" />,
  }
);

export const MatchScoreSection = dynamic(
  () =>
    import("@/components/landing/MatchScoreSection").then(
      (mod) => mod.MatchScoreSection
    ),
  {
    ssr: false,
    loading: () => <div className="py-24 min-h-[400px]" />,
  }
);

export const AtsAuditSection = dynamic(
  () =>
    import("@/components/landing/AtsAuditSection").then(
      (mod) => mod.AtsAuditSection
    ),
  {
    ssr: false,
    loading: () => <div className="py-24 min-h-[450px]" />,
  }
);

export const TextFillScrollSection = dynamic(
  () =>
    import("@/components/landing/TextFillScrollSection").then(
      (mod) => mod.TextFillScrollSection
    ),
  {
    ssr: false,
    loading: () => <div className="py-32 min-h-[300px]" />,
  }
);

export const FaqSection = dynamic(
  () =>
    import("@/components/landing/FaqSection").then((mod) => mod.FaqSection),
  {
    ssr: false,
    loading: () => <div className="py-24 min-h-[400px]" />,
  }
);
