import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cvbuilder.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/panduan/*", "/privacy", "/terms", "/auth/login"],
        disallow: [
          "/dashboard/*",
          "/cv/*",
          "/tracker/*",
          "/jobs/*",
          "/api/*",
          "/auth/callback",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
