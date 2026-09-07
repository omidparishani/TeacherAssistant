import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const row = await prisma.teachingAnalysis.findFirst({
    where: { id: params.id, userId },
    include: { book: { select: { title: true, subject: true, id: true } } },
  });
  if (!row) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const existing = await prisma.teachingAnalysis.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  const body = await req.json();
  const row = await prisma.teachingAnalysis.update({
    where: { id: params.id },
    data: {
      title: body.title ?? existing.title,
      learningObjectives: body.learningObjectives ?? existing.learningObjectives,
      teachingMethod: body.teachingMethod ?? existing.teachingMethod,
      motivationIdeas: body.motivationIdeas ?? existing.motivationIdeas,
      classroomActivities: body.classroomActivities ?? existing.classroomActivities,
      questions: body.questions ?? existing.questions,
      assessmentMethods: body.assessmentMethods ?? existing.assessmentMethods,
      importantTeacherNotes: body.importantTeacherNotes ?? existing.importantTeacherNotes,
      vocabulary: body.vocabulary ?? existing.vocabulary,
      creativeActivities: body.creativeActivities ?? existing.creativeActivities,
      sourceNote: body.sourceNote ?? existing.sourceNote,
      rawContent: body.rawContent ?? existing.rawContent,
      isSaved: body.isSaved !== undefined ? body.isSaved : existing.isSaved,
    },
  });

  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const existing = await prisma.teachingAnalysis.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  await prisma.teachingAnalysis.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
