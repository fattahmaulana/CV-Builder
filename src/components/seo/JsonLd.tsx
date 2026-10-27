import * as React from "react";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CVBuilder",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://cvbuilder.id",
    logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://cvbuilder.id"}/icon.png`,
    description:
      "Platform pembuat CV format ATS standar Harvard untuk pencari kerja dan fresh graduate di Indonesia.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function ProductJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CVBuilder - Pembuat CV ATS Harvard",
    description:
      "Aplikasi web pembuat CV dengan format terbaca ATS gaya Harvard dan penyesuaian kata kunci lowongan kerja.",
    offers: {
      "@type": "Offer",
      price: "5000",
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: process.env.NEXT_PUBLIC_APP_URL || "https://cvbuilder.id",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function FaqJsonLd({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
