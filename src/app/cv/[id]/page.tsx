import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkUserAIConsent } from "@/lib/auth-server";
import { CvEditor } from "@/components/cv/CvEditor";
import { cvDataSchema, initialCvData, CvData } from "@/types/cv";
import { Metadata } from "next";

interface CvEditorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  props: CvEditorPageProps
): Promise<Metadata> {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: cv } = await supabase
    .from("cvs")
    .select("title")
    .eq("id", id)
    .maybeSingle();

  return {
    title: cv?.title ? `${cv.title} | Editor CVBuilder` : "Editor CV ATS | CVBuilder",
  };
}

export default async function CvEditorPage(props: CvEditorPageProps) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/cv/${id}`);
  }

  // Fetch the CV draft ensuring ownership (IDOR prevention)
  const { data: cv, error: cvError } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (cvError || !cv) {
    notFound();
  }

  // Check payment status
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("cv_id", id)
    .eq("status", "PAID")
    .maybeSingle();

  const isPaid = order?.status === "PAID";

  // Validate or normalize CV data structure
  let cvData: CvData;
  const parsed = cvDataSchema.safeParse(cv.data);
  if (parsed.success) {
    cvData = parsed.data;
  } else {
    // Graceful fallback merging existing json with defaults
    cvData = {
      ...initialCvData,
      ...(typeof cv.data === "object" && cv.data !== null ? cv.data : {}),
      metadata: {
        ...initialCvData.metadata,
        language: (cv.language as "id" | "en") || "id",
      },
    };
  }

  return (
    <CvEditor
      cvId={id}
      initialData={cvData}
      initialTitle={cv.title || "CV ATS Saya"}
      isPaid={isPaid}
      initialVersion={cv.version || 1}
    />
  );
}
