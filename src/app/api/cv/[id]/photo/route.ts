import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await createClient();

    // 1. Verify User Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    // 2. Verify CV Ownership
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("id, data")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cvError || !cv) {
      return NextResponse.json({ error: "Dokumen CV tidak ditemukan" }, { status: 404 });
    }

    // 3. Process Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const base64Data = formData.get("base64") as string | null;

    let buffer: Buffer;
    let mimeType = "image/jpeg";

    if (file) {
      // Validate file size: Max 2MB
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran berkas melebihi batas maksimal 2MB." },
          { status: 400 }
        );
      }

      mimeType = file.type || "image/jpeg";
      if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
        return NextResponse.json(
          { error: "Format berkas harus JPG, PNG, atau WEBP." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (base64Data && base64Data.startsWith("data:image/")) {
      const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: "Format base64 tidak valid." }, { status: 400 });
      }
      mimeType = match[1];
      const base64Content = match[2];
      buffer = Buffer.from(base64Content, "base64");

      if (buffer.length > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran berkas melebihi batas maksimal 2MB." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: "Berkas foto wajib diunggah." }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const filePath = `${user.id}/${id}-photo.jpg`;

    // 4. Upload to Supabase Storage (Private cv-photos bucket)
    const { error: uploadError } = await adminClient.storage
      .from("cv-photos")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    let photoUrl = "";
    if (uploadError) {
      console.warn("Storage upload warning (mock or fallback to base64):", uploadError.message);
      // Fallback in local/mock environments: use data URL
      photoUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    } else {
      // Create a 7-day signed URL
      const { data: signedData, error: signError } = await adminClient.storage
        .from("cv-photos")
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);

      if (signError || !signedData?.signedUrl) {
        photoUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
      } else {
        photoUrl = signedData.signedUrl;
      }
    }

    // 5. Update CV Data
    const currentData = (typeof cv.data === "object" && cv.data !== null ? cv.data : {}) as any;
    const updatedData = {
      ...currentData,
      personalInfo: {
        ...(currentData.personalInfo || {}),
        photoUrl,
      },
      metadata: {
        ...(currentData.metadata || {}),
        template: "with-photo",
      },
    };

    await supabase
      .from("cvs")
      .update({
        data: updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      photoUrl,
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/cv/[id]/photo:", error);
    const msg = error instanceof Error ? error.message : "Gagal mengunggah foto.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("id, data")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cvError || !cv) {
      return NextResponse.json({ error: "Dokumen CV tidak ditemukan" }, { status: 404 });
    }

    // Delete from storage
    const adminClient = createAdminClient();
    const filePath = `${user.id}/${id}-photo.jpg`;
    await adminClient.storage.from("cv-photos").remove([filePath]);

    // Update CV data
    const currentData = (typeof cv.data === "object" && cv.data !== null ? cv.data : {}) as any;
    const updatedData = {
      ...currentData,
      personalInfo: {
        ...(currentData.personalInfo || {}),
        photoUrl: "",
      },
    };

    await supabase
      .from("cvs")
      .update({
        data: updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error in DELETE /api/cv/[id]/photo:", error);
    const msg = error instanceof Error ? error.message : "Gagal menghapus foto.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
