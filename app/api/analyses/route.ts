import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const list = await prisma.teachingAnalysis.findMany({
    where: { userId },
    orderBy: { generatedAt: "desc" },
    include: { book: { select: { title: true, subject: true } } },
  });
  return NextResponse.json(list);
}
