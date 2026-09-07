import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const userId = (session.user as any).id;
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

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "فقط فایل PDF مجاز است" }, { status: 400 });
    }

    // ذخیره فایل در پوشه public/uploads (در production از Object Storage استفاده کنید)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const fileId = randomUUID();
    const fileName = `${fileId}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const pdfUrl = `/uploads/${fileName}`;

    // ایجاد رکورد کتاب
    // در نسخه کامل: پردازش PDF در صف (queue) انجام می‌شود
    // اینجا برای MVP تعداد صفحات را تقریبی می‌گذاریم و وضعیت ready می‌کنیم
    const book = await prisma.book.create({
      data: {
        title,
        subject,
        grade,
        academicYear: academicYear || null,
        pdfUrl,
        totalPages: 0, // بعداً با پردازش به‌روز می‌شود
        status: "processing",
        userId,
      },
    });

    // شبیه‌سازی پردازش ساده (در production از Job Queue استفاده کنید)
    // برای MVP می‌توانید بعداً صفحه را دستی اضافه کنید یا پردازش واقعی PDF اضافه کنید
    setTimeout(async () => {
      try {
        // در نسخه واقعی: pdf-parse + OCR
        await prisma.book.update({
          where: { id: book.id },
          data: {
            status: "ready",
            totalPages: 50, // placeholder - با پردازش واقعی جایگزین شود
          },
        });

        // ایجاد چند صفحه نمونه برای تست
        const pagesData = Array.from({ length: 10 }, (_, i) => ({
          bookId: book.id,
          pageNumber: i + 1,
          extractedText: `متن نمونه صفحه ${i + 1} از کتاب ${title}. این متن برای تست سیستم تحلیل هوشمند است. در نسخه واقعی متن از PDF استخراج می‌شود.`,
          analysisStatus: "pending",
        }));
        await prisma.bookPage.createMany({ data: pagesData });
      } catch (e) {
        console.error("Background processing error:", e);
        await prisma.book.update({
          where: { id: book.id },
          data: { status: "failed" },
        });
      }
    }, 2000);

    return NextResponse.json({ bookId: book.id, message: "کتاب با موفقیت آپلود شد" });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "خطا در آپلود فایل" },
      { status: 500 }
    );
  }
}
