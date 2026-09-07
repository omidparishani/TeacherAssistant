import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return NextResponse.json(settings || {});
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const body = await req.json();

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: {
      studentAge: body.studentAge,
      classType: body.classType,
      sessionMinutes: body.sessionMinutes,
      studentCount: body.studentCount,
    },
    create: {
      userId,
      studentAge: body.studentAge ?? 9,
      classType: body.classType ?? "mixed",
      sessionMinutes: body.sessionMinutes ?? 45,
      studentCount: body.studentCount ?? 25,
    },
  });

  return NextResponse.json(settings);
}
