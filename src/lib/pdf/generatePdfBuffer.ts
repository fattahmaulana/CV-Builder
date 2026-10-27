import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { HarvardPdfDocument } from "./HarvardPdfDocument";
import { CvData } from "@/types/cv";

/**
 * Generates an ATS-compliant Harvard PDF buffer strictly on the server
 */
export async function generateHarvardPdfBuffer(
  data: CvData,
  isPaid: boolean = false
): Promise<Buffer> {
  // Pass document component directly to renderToBuffer
  const docElement = React.createElement(HarvardPdfDocument, {
    data,
    isPaid,
  }) as unknown as React.ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(docElement);
  return buffer;
}
