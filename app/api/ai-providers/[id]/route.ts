import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const existing = await prisma.aIProvider.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  if (body.isActive) {
    await prisma.aIProvider.updateMany({ data: { isActive: false } });
  }

  const keyToSave =
    body.apiKey && !String(body.apiKey).startsWith("********")
      ? body.apiKey
      : existing.apiKey;

  const row = await prisma.aIProvider.update({
    where: { id: params.id },
    data: {
      name: body.name ?? existing.name,
      provider: body.provider ?? existing.provider,
      apiKey: keyToSave,
      baseUrl: body.baseUrl !== undefined ? body.baseUrl : existing.baseUrl,
      model: body.model ?? existing.model,
      maxTokens: body.maxTokens !== undefined ? Number(body.maxTokens) : existing.maxTokens,
      temperature: body.temperature !== undefined ? Number(body.temperature) : existing.temperature,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      isActive: body.isActive !== undefined ? !!body.isActive : existing.isActive,
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.aIProvider.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
