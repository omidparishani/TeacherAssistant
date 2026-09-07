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
    // اول سعی می‌کنیم provider فعال رو بگیریم، اگر نبود آخرین مورد
    const row =
      (await prisma.aIProvider.findFirst({
        where: { isActive: true },
      })) ||
      (await prisma.aIProvider.findFirst({
        orderBy: { updatedAt: "desc" },
      }));

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
    return NextResponse.json(
      { error: "جدول تنظیمات هنوز ساخته نشده. prisma db push بزنید." },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: "provider و model الزامی است" },
      { status: 400 }
    );
  }

  // پیدا کردن رکورد فعلی (فعال یا آخرین)
  const existing =
    (await prisma.aIProvider.findFirst({
      where: { isActive: true },
    })) ||
    (await prisma.aIProvider.findFirst({
      orderBy: { updatedAt: "desc" },
    }));

  // اگر apiKey ستاره باشد یعنی کاربر تغییر نداده
  const keyToSave =
    apiKey && !String(apiKey).startsWith("********")
      ? apiKey
      : existing?.apiKey || "";

  if (!keyToSave) {
    return NextResponse.json(
      { error: "کلید API الزامی است" },
      { status: 400 }
    );
  }

  let row;

  if (existing) {
    // آپدیت رکورد موجود
    row = await prisma.aIProvider.update({
      where: { id: existing.id },
      data: {
        name: provider, // چون name الزامی است
        provider,
        apiKey: keyToSave,
        baseUrl: baseUrl || null,
        model,
        maxTokens: Number(maxTokens) || 4096,
        temperature: Number(temperature) || 0.7,
        isActive: true,
      },
    });
  } else {
    // ساخت رکورد جدید
    row = await prisma.aIProvider.create({
      data: {
        name: provider,
        provider,
        apiKey: keyToSave,
        baseUrl: baseUrl || null,
        model,
        maxTokens: Number(maxTokens) || 4096,
        temperature: Number(temperature) || 0.7,
        isActive: true,
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