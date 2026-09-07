import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.aIProvider.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    list.map((p) => ({
      ...p,
      apiKey: p.apiKey ? "********" + p.apiKey.slice(-4) : "",
      hasKey: !!p.apiKey,
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, provider, apiKey, baseUrl, model, maxTokens, temperature, notes, isActive } = body;

  if (!name || !provider || !apiKey || !model) {
    return NextResponse.json({ error: "نام، نوع، کلید و مدل الزامی است" }, { status: 400 });
  }

  if (isActive) {
    await prisma.aIProvider.updateMany({ data: { isActive: false } });
  }

  const row = await prisma.aIProvider.create({
    data: {
      name,
      provider,
      apiKey,
      baseUrl: baseUrl || null,
      model,
      maxTokens: Number(maxTokens) || 4096,
      temperature: Number(temperature) ?? 0.7,
      notes: notes || null,
      isActive: !!isActive,
    },
  });

  return NextResponse.json({ id: row.id, ok: true });
}
