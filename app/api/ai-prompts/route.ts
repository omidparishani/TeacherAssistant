import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultPrompts } from "@/lib/ai-provider";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureDefaultPrompts();
  const list = await prisma.aIPrompt.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json(list);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { key, content, title, description } = body;
  if (!key || content === undefined) {
    return NextResponse.json({ error: "key و content الزامی است" }, { status: 400 });
  }

  const row = await prisma.aIPrompt.upsert({
    where: { key },
    create: {
      key,
      title: title || key,
      content,
      description: description || "",
    },
    update: {
      content,
      ...(title ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  });

  return NextResponse.json(row);
}
