import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { generateHarvardPdfBuffer } from "@/lib/pdf/generatePdfBuffer";
import { generateHarvardDocxBuffer } from "@/lib/docx/harvardDocxGenerator";
import { buildCvModel } from "@/lib/cv/buildCvModel";
import { CvData, cvDataSchema, initialCvData } from "@/types/cv";
import { refreshGoogleAccessToken, appendApplicationRow } from "@/lib/sheets/google-sheets-service";
import { decryptSecret } from "@/lib/sheets/token-crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "pdf"; // 'pdf' | 'docx'

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch CV
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (cvError || !cv) {
      return NextResponse.json({ error: "Dokumen CV tidak ditemukan" }, { status: 404 });
    }

    // Verify paid status
    const { data: order } = await supabase
      .from("orders")
      .select("status")
      .eq("cv_id", id)
      .eq("status", "PAID")
      .maybeSingle();

    const isPaid = order?.status === "PAID";

    // In development mode, allow test download if query flag test=true is provided
    const isDev = process.env.NODE_ENV === "development";
    const allowDownload = isPaid || (isDev && searchParams.get("test") === "true");

    if (!allowDownload) {
      return NextResponse.json(
        {
          error: "Unduhan dokumen resmi membutuhkan pembayaran (Rp5.000).",
          requiresPayment: true,
        },
        { status: 402 }
      );
    }

    const cvModel = buildCvModel(cv.data);
    const sanitizedName = (cvModel.personalInfo.fullName || "CVBuilder")
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    // Dynamic hash based on final cv.data + template + language + version + payment
    const hashPayload = JSON.stringify({
      data: cvModel,
      template: cvModel.metadata.template,
      language: cvModel.metadata.language,
      version: cv.version,
      isPaid,
      format,
    });
    const etag = `"${crypto.createHash("sha256").update(hashPayload).digest("hex")}"`;

    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // Background auto-record application & Google Sheets sync upon download
    if (cvModel.metadata.targetCompany || cvModel.metadata.targetPosition) {
      try {
        const companyName = cvModel.metadata.targetCompany || "Target Perusahaan";
        const positionName = cvModel.metadata.targetPosition || "Posisi Target";

        const { data: existingApp } = await supabase
          .from("applications")
          .select("id")
          .eq("user_id", user.id)
          .eq("cv_id", id)
          .maybeSingle();

        if (!existingApp) {
          const appliedDate = new Date().toISOString().split("T")[0];
          await supabase.from("applications").insert({
            user_id: user.id,
            cv_id: id,
            company: companyName,
            position: positionName,
            status: "Terkirim",
            applied_date: appliedDate,
            cv_version: cvModel.metadata.template === "with-photo" ? "Dengan Foto" : "ATS Harvard",
            notes: `Diunduh via CVBuilder (${format.toUpperCase()})`,
          });
        }

        const { data: gConn } = await supabase
          .from("google_connections")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_connected", true)
          .maybeSingle();

        if (
          gConn &&
          !gConn.needs_reconnect &&
          gConn.spreadsheet_id_encrypted &&
          gConn.refresh_token_encrypted
        ) {
          const spreadsheetId = decryptSecret(gConn.spreadsheet_id_encrypted);
          const { oauth2Client } = await refreshGoogleAccessToken(gConn.refresh_token_encrypted);
          await appendApplicationRow(oauth2Client, spreadsheetId, {
            company: companyName,
            position: positionName,
            status: "Terkirim",
            applied_date: new Date().toISOString().split("T")[0],
            notes: `Diunduh (${format.toUpperCase()})`,
          });
        }
      } catch (syncErr) {
        console.warn("Background tracking on download non-fatal error:", syncErr);
      }
    }

    if (format === "docx") {
      const docxBuffer = await generateHarvardDocxBuffer(cvModel as unknown as CvData, isPaid);
      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="CV_${sanitizedName}_Harvard.docx"`,
          "ETag": etag,
          "Cache-Control": "private, no-cache, must-revalidate",
        },
      });
    } else {
      const pdfBuffer = await generateHarvardPdfBuffer(cvModel as unknown as CvData, isPaid);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="CV_${sanitizedName}_Harvard.pdf"`,
          "ETag": etag,
          "Cache-Control": "private, no-cache, must-revalidate",
        },
      });
    }
  } catch (error) {
    console.error("Error generating download file:", error);
    return NextResponse.json(
      { error: "Gagal membuat berkas unduhan" },
      { status: 500 }
    );
  }
}
