import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildCvModel } from "@/lib/cv/buildCvModel";
import { cvDataSchema, initialCvData, CvData } from "@/types/cv";
import { DownloadClient } from "./DownloadClient";
import { Metadata } from "next";

interface DownloadPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  props: DownloadPageProps
): Promise<Metadata> {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: cv } = await supabase
    .from("cvs")
    .select("title")
    .eq("id", id)
    .maybeSingle();

  return {
    title: cv?.title
      ? `Unduh Berkas - ${cv.title} | CVBuilder`
      : "Unduh Berkas CV ATS | CVBuilder",
  };
}

export default async function CvDownloadPage(props: DownloadPageProps) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/cv/${id}/download`);
  }

  // Fetch CV with IDOR prevention
  const { data: cv, error: cvError } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (cvError || !cv) {
    notFound();
  }

  // Fetch order status
  const { data: order } = await supabase
    .from("orders")
    .select("status, invoice_number, paid_at, revisions_used, max_revisions")
    .eq("cv_id", id)
    .eq("status", "PAID")
    .maybeSingle();

    const isPaid = order?.status === "PAID";

  // Normalize CV data using single source of truth
  const cvData: CvData = buildCvModel(cv.data) as CvData;

  return (
    <DownloadClient
      cvId={id}
      cvTitle={cv.title || "CV ATS Saya"}
      cvData={cvData}
      isPaid={isPaid}
      orderInfo={
        order
          ? {
              orderNumber: order.invoice_number,
              paidAt: order.paid_at || undefined,
              revisionsUsed: order.revisions_used || 0,
              maxRevisions: order.max_revisions || 3,
            }
          : undefined
      }
    />
  );
}
