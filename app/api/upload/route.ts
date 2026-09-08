import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * دو حالت:
 * 1) JSON: { pdfUrl, title, subject, ... } بعد از آپلود مستقیم کلاینت به Blob
 * 2) FormData با فایل: فقط برای localhost بدون Blob
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { error: "نشست نامعتبر. دوباره وارد شوید." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "کاربر یافت نشد. دوباره وارد شوید." },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let subject = "";
    let academicYear: string | null = null;
    let grade = 3;
    let pdfUrl = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      title = body.title;
      subject = body.subject;
      academicYear = body.academicYear || null;
      grade = parseInt(String(body.grade || "3"));
      pdfUrl = body.pdfUrl;

      if (!pdfUrl || !title || !subject) {
        return NextResponse.json(
          { error: "pdfUrl، عنوان و درس الزامی است" },
          { status: 400 }
        );
      }
    } else {
      // FormData — فقط برای توسعه محلی یا فایل خیلی کوچک
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      title = formData.get("title") as string;
      subject = formData.get("subject") as string;
      academicYear = (formData.get("academicYear") as string) || null;
      grade = parseInt((formData.get("grade") as string) || "3");

      if (!file || !title || !subject) {
        return NextResponse.json(
          { error: "فایل، عنوان و درس الزامی است" },
          { status: 400 }
        );
      }

      const fileId = randomUUID();
      const fileName = `${fileId}.pdf`;
      const bytes = Buffer.from(await file.arrayBuffer());
      const token = process.env.BLOB_READ_WRITE_TOKEN;

      if (token) {
        // روی Vercel این مسیر برای فایل‌های بزرگ خطا می‌دهد — کلاینت باید مستقیم آپلود کند
        if (file.size > 3.5 * 1024 * 1024) {
          return NextResponse.json(
            {
              error:
                "فایل بزرگ است. صفحه را رفرش کنید تا آپلود مستقیم به Blob فعال شود.",
            },
            { status: 413 }
          );
        }
        const blob = await put(`books/${fileName}`, bytes, {
          access: "public",
          contentType: "application/pdf",
          token,
        });
        pdfUrl = blob.url;
      } else {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });
        await writeFile(path.join(uploadsDir, fileName), bytes);
        pdfUrl = `/uploads/${fileName}`;
      }
    }

    const book = await prisma.book.create({
      data: {
        title,
        subject,
        grade,
        academicYear,
        pdfUrl,
        totalPages: 0,
        status: "processing",
        userId,
      },
    });

    try {
      await prisma.book.update({
        where: { id: book.id },
        data: { status: "ready", totalPages: 30 },
      });

      await prisma.bookPage.createMany({
        data: Array.from({ length: 10 }, (_, i) => ({
          bookId: book.id,
          pageNumber: i + 1,
          extractedText: `متن نمونه صفحه ${i + 1} از کتاب ${title}.`,
          analysisStatus: "pending",
        })),
      });
    } catch (e) {
      console.error("Post-upload processing:", e);
      await prisma.book.update({
        where: { id: book.id },
        data: { status: "ready" },
      });
    }

    return NextResponse.json({
      bookId: book.id,
      pdfUrl,
      message: "کتاب با موفقیت آپلود شد",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error?.code === "P2003"
            ? "کاربر معتبر نیست. دوباره وارد شوید."
            : error?.message || "خطا در ثبت کتاب",
      },
      { status: 500 }
    );
  }
}
