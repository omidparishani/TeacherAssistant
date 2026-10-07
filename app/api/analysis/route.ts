export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTeachingAnalysis, AnalysisType } from "@/lib/ai-provider";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const contentType = req.headers.get("content-type") || "";

    let bookId: string | undefined;
    let pageNumbers: number[] = [];
    let analysisType: AnalysisType = "full";
    let systemPromptKey = "system";
    let imageBase64: string | undefined;
    let imageMime: string | undefined;
    let extraText = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      bookId = (form.get("bookId") as string) || undefined;
      const pagesRaw = form.get("pageNumbers") as string;
      if (pagesRaw) {
        try {
          pageNumbers = JSON.parse(pagesRaw);
        } catch {
          pageNumbers = pagesRaw.split(",").map((n) => Number(n.trim())).filter(Boolean);
        }
      }
      analysisType = ((form.get("analysisType") as string) || "full") as AnalysisType;
      systemPromptKey = (form.get("systemPromptKey") as string) || "system";
      extraText = (form.get("extraText") as string) || "";
      const file = form.get("image") as File | null;
      if (file && file.size > 0) {
        const buf = Buffer.from(await file.arrayBuffer());
        imageBase64 = buf.toString("base64");
        imageMime = file.type || "image/jpeg";
      }
    } else {
      const body = await req.json();
      bookId = body.bookId;
      pageNumbers = body.pageNumbers || [];
      analysisType = body.analysisType || "full";
      systemPromptKey = body.systemPromptKey || "system";
      imageBase64 = body.imageBase64;
      imageMime = body.imageMime;
      extraText = body.extraText || "";
    }

    if (!imageBase64 && (!bookId || !pageNumbers?.length)) {
      return NextResponse.json(
        { error: "صفحه کتاب یا تصویر برای تحلیل لازم است" },
        { status: 400 }
      );
    }

    let bookTitle = "محتوای آموزشی";
    let subject = "عمومی";
    let book: any = null;
    let pageText = extraText;

    if (bookId) {
      book = await prisma.book.findFirst({
        where: { id: bookId, userId },
        include: {
          pages: pageNumbers.length
            ? { where: { pageNumber: { in: pageNumbers } } }
            : false,
        },
      });

      if (!book) {
        return NextResponse.json({ error: "کتاب یافت نشد" }, { status: 404 });
      }

      bookTitle = book.title;
      subject = book.subject;

      const nums = pageNumbers.length ? pageNumbers : [1];
      const pageMap = new Map<number, string>();
      if (Array.isArray(book.pages)) {
        for (const p of book.pages as any[]) {
          pageMap.set(p.pageNumber, p.extractedText || "");
        }
      }

      const blocks = nums.map((num: number) => {
        const raw = (pageMap.get(num) || "").trim();
        const isSample =
          !raw ||
          raw.includes("متن نمونه") ||
          raw.includes("در نسخه واقعی") ||
          raw.includes("برای تست سیستم");
        if (isSample) {
          return (
            `--- صفحه ${num} از کتاب «${book.title}» | درس: ${book.subject} | پایه سوم ---\n` +
            `متن کامل این صفحه هنوز از PDF استخراج نشده است.\n` +
            `بر اساس عنوان کتاب، موضوع درس و شماره صفحه ${num}، راهنمای تدریس عملی مخصوص همین صفحه بنویس.\n` +
            `خروجی نباید با تحلیل صفحات دیگر یکسان باشد؛ محتوا را متناسب با صفحه ${num} متمایز کن.`
          );
        }
        return `--- صفحه ${num} ---\n${raw}`;
      });

      pageText = blocks.join("\n\n") + (extraText ? "\n\n" + extraText : "");
    }

    if (!pageText.trim() && imageBase64) {
      pageText =
        "محتوای اصلی در تصویر پیوست است. بر اساس تصویر، راهنمای تدریس پایه سوم تولید کن.";
    }

    if (!pageText.trim()) {
      pageText = `صفحات ${pageNumbers.join("، ")} از کتاب ${bookTitle} درس ${subject} پایه سوم. تحلیل مخصوص همین صفحات باشد.`;
    }

    // یکتاسازی ورودی برای جلوگیری از پاسخ تکراری مدل/کش
    pageText =
      `[درخواست جدید | زمان: ${new Date().toISOString()} | صفحات: ${pageNumbers.join(",")}]\n\n` +
      pageText;

        const settings = await prisma.userSettings.findUnique({ where: { userId } });

    const result = await generateTeachingAnalysis(
      pageText,
      analysisType,
      bookTitle,
      subject,
      settings
        ? {
            studentAge: settings.studentAge,
            classType: settings.classType,
            sessionMinutes: settings.sessionMinutes,
            studentCount: settings.studentCount,
          }
        : undefined,
      { systemPromptKey, imageBase64, imageMime }
    );

    const firstPage = book?.pages?.[0];
    const title = imageBase64
      ? `تحلیل تصویر — ${bookTitle}`
      : `تحلیل صفحات ${pageNumbers.join("، ")} — ${bookTitle}`;

    const analysis = await prisma.teachingAnalysis.create({
      data: {
        bookId: book?.id,
        bookPageId: firstPage?.id,
        userId,
        title,
        analysisType,
        learningObjectives: result.learningObjectives as any,
        teachingMethod: result.teachingMethod as any,
        motivationIdeas: result.motivationIdeas as any,
        classroomActivities: result.classroomActivities as any,
        questions: result.questions as any,
        assessmentMethods: result.assessmentMethods as any,
        importantTeacherNotes: result.importantTeacherNotes as any,
        vocabulary: result.vocabulary as any,
        creativeActivities: result.creativeActivities as any,
        rawContent: result as any,
        sourceNote: result.sourceNote,
      },
    });

    return NextResponse.json(
      {
        id: analysis.id,
        ...result,
        _pageNumbers: pageNumbers,
        _generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "خطا در تولید تحلیل. کلید API، مدل و پرامپت را بررسی کنید.",
      },
      { status: 500 }
    );
  }
}
