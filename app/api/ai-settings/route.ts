import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const row = await prisma.aISettings.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!row) {
      return NextResponse.json({
        provider: "groq",
        apiKey: "",
        baseUrl: "https://api.groq.com/openai/v1",
        model: "openai/gpt-oss-20b",
        maxTokens: 4096,
        temperature: 0.7,
        hasKey: false,
      });
    }

    return NextResponse.json({
      provider: row.provider,
      apiKey: row.apiKey ? "********" + row.apiKey.slice(-4) : "",
      baseUrl: row.baseUrl,
      model: row.model,
      maxTokens: row.maxTokens,
      temperature: row.temperature,
      hasKey: !!row.apiKey,
      rawKeySet: true,
    });
  } catch (e) {
    return NextResponse.json({ error: "جدول تنظیمات هنوز ساخته نشده. prisma db push بزنید." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { provider, apiKey, baseUrl, model, maxTokens, temperature } = body;

  if (!provider || !model) {
    return NextResponse.json({ error: "provider و model الزامی است" }, { status: 400 });
  }

  const existing = await prisma.aISettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  // اگر apiKey ستاره باشد یعنی تغییر نکرده
  const keyToSave =
    apiKey && !String(apiKey).startsWith("********")
      ? apiKey
      : existing?.apiKey || "";

  if (!keyToSave) {
    return NextResponse.json({ error: "کلید API الزامی است" }, { status: 400 });
  }

  let row;
  if (existing) {
    row = await prisma.aISettings.update({
      where: { id: existing.id },
      data: {
        provider,
        apiKey: keyToSave,
        baseUrl: baseUrl || null,
        model,
        maxTokens: Number(maxTokens) || 4096,
        temperature: Number(temperature) || 0.7,
      },
    });
  } else {
    row = await prisma.aISettings.create({
      data: {
        provider,
        apiKey: keyToSave,
        baseUrl: baseUrl || null,
        model,
        maxTokens: Number(maxTokens) || 4096,
        temperature: Number(temperature) || 0.7,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    provider: row.provider,
    model: row.model,
    baseUrl: row.baseUrl,
    maxTokens: row.maxTokens,
    temperature: row.temperature,
  });
}
