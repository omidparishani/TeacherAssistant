import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * ذخیره PDF:
 * - اگر BLOB_READ_WRITE_TOKEN باشد → Vercel Blob (مناسب production / Vercel)
 * - در غیر این صورت → public/uploads (فقط localhost)
 */
async function savePdf(file: File): Promise<string> {
  const fileId = randomUUID();
  const fileName = `${fileId}.pdf`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    const blob = await put(`books/${fileName}`, bytes, {
      access: "public",
      contentType: "application/pdf",
      token,
    });
    return blob.url;
  }

  // Local development only
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, fileName), bytes);
  return `/uploads/${fileName}`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { error: "نشست نامعتبر است. لطفاً دوباره وارد شوید." },
        { status: 401 }
      );
    }

    // اطمینان از وجود کاربر در دیتابیس (جلوگیری از خطای FK)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        {
          error:
            "کاربر در دیتابیس یافت نشد. از حساب خارج شوید و دوباره وارد شوید.",
        },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const subject = formData.get("subject") as string;
    const academicYear = formData.get("academicYear") as string;
    const grade = parseInt((formData.get("grade") as string) || "3");

    if (!file || !title || !subject) {
      return NextResponse.json(
        { error: "فایل، عنوان و درس الزامی است" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf" && !file.name?.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "فقط فایل PDF مجاز است" }, { status: 400 });
    }

    // محدودیت اندازه تقریبی (مثلاً 20MB) برای جلوگیری از timeout
    const maxBytes = 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "حجم فایل حداکثر ۲۰ مگابایت باشد" },
        { status: 400 }
      );
    }

    let pdfUrl: string;
    try {
      pdfUrl = await savePdf(file);
    } catch (storageErr: any) {
      console.error("Storage error:", storageErr);
      return NextResponse.json(
        {
          error:
            storageErr?.message?.includes("BLOB") || !process.env.BLOB_READ_WRITE_TOKEN
              ? "ذخیره فایل ناموفق بود. روی Vercel باید BLOB_READ_WRITE_TOKEN را تنظیم کنید."
              : "خطا در ذخیره فایل: " + (storageErr?.message || "نامشخص"),
        },
        { status: 500 }
      );
    }

    const book = await prisma.book.create({
      data: {
        title,
        subject,
        grade,
        academicYear: academicYear || null,
        pdfUrl,
        totalPages: 0,
        status: "processing",
        userId,
      },
    });

    // پردازش سبک بدون setTimeout (روی serverless قابل اعتمادتر است)
    try {
      await prisma.book.update({
        where: { id: book.id },
        data: {
          status: "ready",
          totalPages: 30,
        },
      });

      const pagesData = Array.from({ length: 10 }, (_, i) => ({
        bookId: book.id,
        pageNumber: i + 1,
        extractedText: `متن نمونه صفحه ${i + 1} از کتاب ${title}. در نسخه کامل متن از PDF استخراج می‌شود.`,
        analysisStatus: "pending",
      }));
      await prisma.bookPage.createMany({ data: pagesData });
    } catch (e) {
      console.error("Post-upload processing error:", e);
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
            : error?.message || "خطا در آپلود فایل",
      },
      { status: 500 }
    );
  }
}
