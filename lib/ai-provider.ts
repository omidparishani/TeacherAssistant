/**
 * لایه AI — تنظیمات از دیتابیس (Provider فعال + پرامپت‌ها)
 */

import OpenAI from "openai";
import { prisma } from "./prisma";

export type AnalysisType = "quick" | "full" | "creative";

export interface AnalysisResult {
  learningObjectives: {
    knowledge: string[];
    skills: string[];
    attitude: string[];
  };
  motivationIdeas: string[];
  teachingMethod: {
    start: { description: string; minutes: number };
    presentation: { description: string; minutes: number };
    studentActivity: { description: string; minutes: number };
    summary: { description: string; minutes: number };
  };
  classroomActivities: string[];
  questions: {
    simple: string[];
    comprehension: string[];
    conceptual: string[];
    creative: string[];
  };
  assessmentMethods: string[];
  importantTeacherNotes: string[];
  vocabulary: { word: string; meaning: string }[];
  creativeActivities: string[];
  sourceNote: string;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  baseUrl: string | null;
  model: string;
  maxTokens: number;
  temperature: number;
}

const DEFAULT_SYSTEM = `تو دستیار معلم پایه سوم ابتدایی ایران هستی.
خروجی را فقط JSON معتبر و فشرده به زبان فارسی برگردان.
قوانین: مناسب دانش‌آموز ۹ ساله، ساده و عملی، بدون اختراع اهداف رسمی کتاب.
اگر اطلاعات رسمی نداری در sourceNote بنویس: پیشنهاد آموزشی هوش مصنوعی`;

const DEFAULT_PROMPTS: Record<string, string> = {
  system: DEFAULT_SYSTEM,
  quick: "تحلیل سریع و کوتاه. حداکثر ۲ مورد در هر لیست. فقط JSON.",
  full: "تحلیل کامل ولی مختصر. در هر لیست ۲ تا ۴ مورد. فقط JSON.",
  creative: "تمرکز روی انگیزه، بازی و مشارکت دانش‌آموز. فقط JSON.",
};

export async function getAIConfig(): Promise<AIConfig> {
  try {
    const active = await prisma.aIProvider.findFirst({
      where: { isActive: true },
    });
    if (active?.apiKey) {
      return {
        provider: active.provider,
        apiKey: active.apiKey,
        baseUrl: active.baseUrl,
        model: active.model,
        maxTokens: active.maxTokens,
        temperature: active.temperature,
      };
    }
  } catch {
    /* migrate نشده */
  }

  if (process.env.GROQ_API_KEY) {
    return {
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: "https://api.groq.com/openai/v1",
      model: process.env.AI_MODEL || "openai/gpt-oss-20b",
      maxTokens: Number(process.env.AI_MAX_TOKENS) || 4096,
      temperature: 0.7,
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: null,
      model: process.env.AI_MODEL || "gpt-4o-mini",
      maxTokens: 4096,
      temperature: 0.7,
    };
  }

  throw new Error(
    "هیچ Provider فعالی تنظیم نشده. از داشبورد → تنظیمات AI یک Provider اضافه و فعال کنید."
  );
}

async function getPrompt(key: string): Promise<string> {
  try {
    const row = await prisma.aIPrompt.findUnique({ where: { key } });
    if (row && typeof row.content === "string" && row.content.trim()) {
      return row.content;
    }
  } catch (e) {
    console.warn("getPrompt fallback:", key, e);
  }
  return DEFAULT_PROMPTS[key] || DEFAULT_SYSTEM;
}

function buildUserPrompt(
  pageText: string,
  analysisType: AnalysisType,
  bookTitle: string,
  subject: string,
  typeInstruction: string,
  settings?: {
    studentAge?: number;
    classType?: string;
    sessionMinutes?: number;
    studentCount?: number;
  }
): string {
  const isQuick = analysisType === "quick";
  const schema = `{
  "learningObjectives": { "knowledge": ["..."], "skills": ["..."], "attitude": [] },
  "motivationIdeas": ["..."],
  "teachingMethod": {
    "start": { "description": "...", "minutes": 5 },
    "presentation": { "description": "...", "minutes": 15 },
    "studentActivity": { "description": "...", "minutes": 15 },
    "summary": { "description": "...", "minutes": 5 }
  },
  "classroomActivities": ["..."],
  "questions": { "simple": ["..."], "comprehension": ["..."], "conceptual": ["..."], "creative": ["..."] },
  "assessmentMethods": ["..."],
  "importantTeacherNotes": ["..."],
  "vocabulary": [{ "word": "...", "meaning": "..." }],
  "creativeActivities": ["..."],
  "sourceNote": "پیشنهاد آموزشی هوش مصنوعی"
}`;

  return `کتاب: ${bookTitle} | درس: ${subject}
سن: ${settings?.studentAge ?? 9} | جلسه: ${settings?.sessionMinutes ?? 45} دقیقه | کلاس: ${
    settings?.classType === "girls" ? "دخترانه" : settings?.classType === "boys" ? "پسرانه" : "مختلط"
  }
${typeInstruction}

متن صفحه:
${pageText.slice(0, isQuick ? 3000 : 5000)}

فقط JSON با این ساختار:
${schema}`;
}

function extractJson(text: string): any {
  let cleaned = text.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) cleaned = fence[1].trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);
  return JSON.parse(cleaned);
}

function normalizeResult(parsed: any): AnalysisResult {
  return {
    learningObjectives: {
      knowledge: parsed?.learningObjectives?.knowledge || [],
      skills: parsed?.learningObjectives?.skills || [],
      attitude: parsed?.learningObjectives?.attitude || [],
    },
    motivationIdeas: parsed?.motivationIdeas || [],
    teachingMethod: {
      start: parsed?.teachingMethod?.start || { description: "", minutes: 5 },
      presentation: parsed?.teachingMethod?.presentation || { description: "", minutes: 15 },
      studentActivity: parsed?.teachingMethod?.studentActivity || { description: "", minutes: 15 },
      summary: parsed?.teachingMethod?.summary || { description: "", minutes: 5 },
    },
    classroomActivities: parsed?.classroomActivities || [],
    questions: {
      simple: parsed?.questions?.simple || [],
      comprehension: parsed?.questions?.comprehension || [],
      conceptual: parsed?.questions?.conceptual || [],
      creative: parsed?.questions?.creative || [],
    },
    assessmentMethods: parsed?.assessmentMethods || [],
    importantTeacherNotes: parsed?.importantTeacherNotes || [],
    vocabulary: parsed?.vocabulary || [],
    creativeActivities: parsed?.creativeActivities || [],
    sourceNote: parsed?.sourceNote || "پیشنهاد آموزشی هوش مصنوعی",
  };
}


function pickContent(response: any): string | null {
  if (!response) return null;
  // OpenAI standard
  const c1 = response?.choices?.[0]?.message?.content;
  if (typeof c1 === "string" && c1.trim()) return c1;
  // array content parts
  if (Array.isArray(c1)) {
    const text = c1
      .map((p: any) => (typeof p === "string" ? p : p?.text || ""))
      .join("")
      .trim();
    if (text) return text;
  }
  // legacy / alternate
  const c2 = response?.choices?.[0]?.text;
  if (typeof c2 === "string" && c2.trim()) return c2;
  // some gateways
  if (typeof response?.content === "string" && response.content.trim()) return response.content;
  if (typeof response?.output_text === "string" && response.output_text.trim()) return response.output_text;
  if (typeof response?.message === "string" && response.message.trim()) return response.message;
  if (typeof response?.data === "string" && response.data.trim()) return response.data;
  // nested data.choices
  const c3 = response?.data?.choices?.[0]?.message?.content;
  if (typeof c3 === "string" && c3.trim()) return c3;
  return null;
}

function describeEmptyResponse(response: any): string {
  try {
    const keys = response ? Object.keys(response).join(", ") : "null";
    const err =
      response?.error?.message ||
      response?.error ||
      response?.message ||
      "";
    const preview = JSON.stringify(response)?.slice(0, 400);
    return `پاسخ خالی از مدل. کلیدهای پاسخ: [${keys}] ${err ? " | " + err : ""} | نمونه: ${preview}`;
  } catch {
    return "پاسخ خالی از مدل دریافت شد. Base URL، مدل و کلید را بررسی کنید.";
  }
}

export async function generateTeachingAnalysis(
  pageText: string,
  analysisType: AnalysisType = "full",
  bookTitle: string = "کتاب درسی",
  subject: string = "عمومی",
  settings?: {
    studentAge?: number;
    classType?: string;
    sessionMinutes?: number;
    studentCount?: number;
  },
  options?: {
    systemPromptKey?: string;
    imageBase64?: string; // data:image/...;base64,... یا فقط base64
    imageMime?: string;
  }
): Promise<AnalysisResult> {
  const config = await getAIConfig();
  const systemPrompt = await getPrompt(options?.systemPromptKey || "system");
  const typeInstruction = await getPrompt(analysisType);

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined,
  });

  const userText = buildUserPrompt(pageText, analysisType, bookTitle, subject, typeInstruction, settings);

  // پشتیبانی از تصویر (Vision) در صورت وجود
  type Msg = { role: "system" | "user"; content: any };
  const messages: Msg[] = [
    { role: "system", content: systemPrompt },
  ];

  if (options?.imageBase64) {
    let b64 = options.imageBase64;
    let mime = options.imageMime || "image/jpeg";
    if (b64.startsWith("data:")) {
      const m = b64.match(/^data:([^;]+);base64,(.+)$/);
      if (m) {
        mime = m[1];
        b64 = m[2];
      }
    }
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userText + "\n\nتصویر صفحه/محتوای آموزشی پیوست شده است. بر اساس تصویر و متن بالا تحلیل کن." },
        { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
      ],
    });
  } else {
    messages.push({ role: "user", content: userText });
  }

  let content: string | null = null;
  try {
    // بعضی gatewayها (مثل AgentRouter) با response_format مشکل دارند
    const useJsonMode = !["custom", "openrouter", "xai"].includes(
      (config.provider || "").toLowerCase()
    ) && !(config.baseUrl || "").includes("agentrouter");

    const requestBody: any = {
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages,
    };
    if (useJsonMode) {
      requestBody.response_format = { type: "json_object" };
    }

    const response: any = await client.chat.completions.create(requestBody);

    content = pickContent(response);

    if (!content) {
      if (response?.error) {
        throw new Error(
          typeof response.error === "string"
            ? response.error
            : response.error?.message || "خطای API"
        );
      }
      // نگه داشتن برای پیام نهایی
      (globalThis as any).__lastAIResponse = response;
    }
  } catch (err: any) {
    const msg = String(err?.message || err || "");
    // تلاش دوم بدون json_object
    if (
      msg.includes("json") ||
      msg.includes("JSON") ||
      msg.includes("response_format") ||
      err?.code === "json_validate_failed" ||
      err?.status === 400
    ) {
      try {
        const response: any = await client.chat.completions.create({
          model: config.model,
          temperature: config.temperature,
          max_tokens: Math.max(config.maxTokens || 0, 4096),
          messages: [
            ...messages,
            {
              role: "user",
              content:
                "فقط یک آبجکت JSON معتبر برگردان. هیچ متنی قبل یا بعد از JSON ننویس.",
            },
          ],
        });
        content = pickContent(response);
        if (!content) (globalThis as any).__lastAIResponse = response;
      } catch (err2: any) {
        throw new Error(
          err2?.message ||
            msg ||
            "خطا در ارتباط با مدل. Base URL، کلید و نام مدل را بررسی کنید."
        );
      }
    } else {
      throw new Error(
        msg || "خطا در ارتباط با مدل. Base URL، کلید و نام مدل را بررسی کنید."
      );
    }
  }

  if (!content) {
    const last = (globalThis as any).__lastAIResponse;
    throw new Error(describeEmptyResponse(last));
  }
  try {
    return normalizeResult(extractJson(content));
  } catch {
    throw new Error("خروجی مدل قابل تبدیل به JSON نبود. پرامپت یا مدل را تغییر دهید.");
  }
}

/** Seed پرامپت‌های پیش‌فرض اگر خالی باشند */
export async function ensureDefaultPrompts() {
  try {
    const titles: Record<string, string> = {
      system: "پرامپت سیستم",
      quick: "دستور تحلیل سریع",
      full: "دستور تحلیل کامل",
      creative: "دستور تحلیل جذاب",
    };
    const entries = Object.entries(DEFAULT_PROMPTS || {});
    for (const entry of entries) {
      const key = entry[0];
      const content = entry[1];
      if (!key || content === undefined) continue;
      await prisma.aIPrompt.upsert({
        where: { key },
        create: {
          key,
          title: titles[key] || key,
          content: String(content),
          description: "",
        },
        update: {},
      });
    }
  } catch (e) {
    console.warn("ensureDefaultPrompts skipped:", e);
  }
}
