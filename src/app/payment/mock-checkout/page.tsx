import { Metadata } from "next";
import QRCode from "qrcode";
import { MockCheckoutClient } from "./MockCheckoutClient";

export const metadata: Metadata = {
  title: "Pembayaran QRIS | CVBuilder",
};

interface MockCheckoutPageProps {
  searchParams: Promise<{
    invoice?: string;
    cvId?: string;
    token?: string;
    qr?: string;
  }>;
}

export default async function MockCheckoutPage(props: MockCheckoutPageProps) {
  const { invoice, cvId, token, qr } = await props.searchParams;

  const qrString =
    qr ||
    `00020101021226650013ID.CO.QRIS.WWW011893600848000000000052045812530336054050005802ID5912CVBUILDER6007JAKARTA6304`;

  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(qrString, {
      width: 400,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("Gagal generate QR Data URL:", err);
  }

  return (
    <MockCheckoutClient
      invoiceNumber={invoice || `INV-CVB-DEMO-${Date.now().toString(36).toUpperCase()}`}
      cvId={cvId || ""}
      token={token}
      qrImageUrl={qrDataUrl}
    />
  );
}
