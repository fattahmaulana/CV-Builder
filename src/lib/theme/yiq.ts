/**
 * YIQ Contrast Formula Utility
 * Automatically determines whether black (#000000) or white (#FFFFFF) text
 * provides the highest readable contrast against a given background color.
 *
 * Formula: ((r * 299) + (g * 587) + (b * 114)) / 1000
 * Threshold: >= 128 -> #000000, < 128 -> #FFFFFF
 */

export function calculateYiqContrast(hexColor: string): "#000000" | "#FFFFFF" {
  let hex = hexColor.replace("#", "").trim();

  // Expand short hex e.g. "FFF" -> "FFFFFF"
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (hex.length !== 6) {
    return "#000000"; // fallback
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return "#000000";
  }

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

/**
 * Returns text color for the primary Neobrutalist accents
 */
export function getAccentTextColor(
  variant: "accent" | "accent-2" | "accent-3" | string
): "#000000" | "#FFFFFF" {
  switch (variant) {
    case "accent":
    case "#FFE500":
      return calculateYiqContrast("#FFE500"); // Black
    case "accent-2":
    case "#FF6B9D":
      return calculateYiqContrast("#FF6B9D"); // Black
    case "accent-3":
    case "#4D7CFF":
      return calculateYiqContrast("#4D7CFF"); // White
    case "surface":
    case "#FFFFFF":
      return "#000000";
    case "black":
    case "#000000":
      return "#FFFFFF";
    default:
      return hexColorSafe(variant);
  }
}

function hexColorSafe(color: string): "#000000" | "#FFFFFF" {
  if (color.startsWith("#")) {
    return calculateYiqContrast(color);
  }
  return "#000000";
}
