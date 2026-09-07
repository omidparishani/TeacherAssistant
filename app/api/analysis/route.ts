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

      if (book.pages?.length) {
        pageText =
          book.pages
            .map((p: any) => `--- صفحه ${p.pageNumber} ---\n${p.extractedText || ""}`)
            .join("\n\n") + (extraText ? "\n\n" + extraText : "");
      }
    }

    if (!pageText.trim() && imageBase64) {
      pageText =
        "محتوای اصلی در تصویر پیوست است. بر اساس تصویر، راهنمای تدریس پایه سوم تولید کن.";
    }

    if (!pageText.trim()) {
      pageText = `محتوای صفحات ${pageNumbers.join("، ")} از کتاب ${bookTitle}`;
    }

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

    return NextResponse.json({
      id: analysis.id,
      ...result,
    });
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
