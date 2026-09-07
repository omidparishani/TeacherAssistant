"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Copy, Printer, Check, Loader2 } from "lucide-react";

interface AnalysisData {
  id?: string;
  learningObjectives?: {
    knowledge?: string[];
    skills?: string[];
    attitude?: string[];
  };
  motivationIdeas?: string[];
  teachingMethod?: {
    start?: { description: string; minutes: number };
    presentation?: { description: string; minutes: number };
    studentActivity?: { description: string; minutes: number };
    summary?: { description: string; minutes: number };
  };
  classroomActivities?: string[];
  questions?: {
    simple?: string[];
    comprehension?: string[];
    conceptual?: string[];
    creative?: string[];
  };
  assessmentMethods?: string[];
  importantTeacherNotes?: string[];
  vocabulary?: { word: string; meaning: string }[];
  creativeActivities?: string[];
  sourceNote?: string;
  title?: string;
}

function toPlainText(data: AnalysisData): string {
  const lines: string[] = [];
  lines.push(data.title || "راهنمای تدریس");
  lines.push(data.sourceNote || "");
  lines.push("");

  if (data.learningObjectives) {
    lines.push("🎯 اهداف یادگیری");
    data.learningObjectives.knowledge?.forEach((x) => lines.push("• دانشی: " + x));
    data.learningObjectives.skills?.forEach((x) => lines.push("• مهارتی: " + x));
    data.learningObjectives.attitude?.forEach((x) => lines.push("• نگرشی: " + x));
    lines.push("");
  }
  if (data.motivationIdeas?.length) {
    lines.push("💡 ایجاد انگیزه");
    data.motivationIdeas.forEach((x) => lines.push("• " + x));
    lines.push("");
  }
  if (data.teachingMethod) {
    lines.push("👩‍🏫 روش تدریس");
    const m = data.teachingMethod;
    if (m.start) lines.push(`شروع (${m.start.minutes}د): ${m.start.description}`);
    if (m.presentation) lines.push(`ارائه (${m.presentation.minutes}د): ${m.presentation.description}`);
    if (m.studentActivity) lines.push(`فعالیت (${m.studentActivity.minutes}د): ${m.studentActivity.description}`);
    if (m.summary) lines.push(`جمع‌بندی (${m.summary.minutes}د): ${m.summary.description}`);
    lines.push("");
  }
  if (data.classroomActivities?.length) {
    lines.push("🎲 فعالیت کلاسی");
    data.classroomActivities.forEach((x) => lines.push("• " + x));
    lines.push("");
  }
  if (data.questions) {
    lines.push("❓ سوال‌ها");
    data.questions.simple?.forEach((x) => lines.push("ساده: " + x));
    data.questions.comprehension?.forEach((x) => lines.push("درک مطلب: " + x));
    data.questions.conceptual?.forEach((x) => lines.push("مفهومی: " + x));
    data.questions.creative?.forEach((x) => lines.push("خلاق: " + x));
    lines.push("");
  }
  if (data.assessmentMethods?.length) {
    lines.push("📝 ارزشیابی");
    data.assessmentMethods.forEach((x) => lines.push("• " + x));
    lines.push("");
  }
  if (data.importantTeacherNotes?.length) {
    lines.push("📌 نکات معلم");
    data.importantTeacherNotes.forEach((x) => lines.push("• " + x));
    lines.push("");
  }
  if (data.vocabulary?.length) {
    lines.push("📚 واژه‌ها");
    data.vocabulary.forEach((v) => lines.push(`• ${v.word}: ${v.meaning}`));
    lines.push("");
  }
  if (data.creativeActivities?.length) {
    lines.push("✏️ فعالیت تکمیلی");
    data.creativeActivities.forEach((x) => lines.push("• " + x));
  }
  return lines.join("\n");
}

export function AnalysisResultView({
  data,
  analysisId,
  onSaved,
}: {
  data: AnalysisData;
  analysisId?: string;
  onSaved?: () => void;
}) {
  const sourceIsOfficial = data.sourceNote?.includes("راهنمای معلم");
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(toPlainText(data));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg("کپی نشد. مرورگر اجازه نداد.");
    }
  }

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) {
      setMsg("پنجره چاپ مسدود شد. اجازه پاپ‌آپ بدهید.");
      return;
    }
    win.document.write(`<!DOCTYPE html><html lang="fa" dir="rtl"><head>
      <meta charset="utf-8"/>
      <title>${data.title || "راهنمای تدریس"}</title>
      <style>
        body { font-family: Tahoma, Vazirmatn, sans-serif; padding: 24px; line-height: 1.8; color: #1e293b; }
        h1,h2,h3 { color: #0f172a; }
        .badge { display:inline-block; padding:4px 10px; border-radius:8px; font-size:12px; margin-bottom:16px; }
        .card { border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:12px; }
        ul { padding-right: 20px; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  }

  async function handleSave() {
    if (!analysisId) {
      // اگر id نداریم، فقط در کلیپبورد/محلی علامت بزن
      setMsg("تحلیل همین الان در سیستم ذخیره شده. از منوی «تحلیل‌ها» ببینید.");
      setSaved(true);
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/analyses/${analysisId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSaved: true, title: data.title }),
      });
      if (res.ok) {
        setSaved(true);
        setMsg("با موفقیت به علاقه‌مندی‌ها اضافه شد.");
        onSaved?.();
      } else {
        setMsg("خطا در ذخیره");
      }
    } catch {
      setMsg("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 text-sm animate-in fade-in duration-300">
      <div
        className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
          sourceIsOfficial
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "bg-amber-50 text-amber-800 border border-amber-200"
        }`}
      >
        {sourceIsOfficial ? "📌 بر اساس راهنمای معلم" : "💡 پیشنهاد آموزشی هوش مصنوعی"}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={saved ? "default" : "outline"}
          className="gap-1.5 text-xs"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Heart className="h-3.5 w-3.5" />
          )}
          {saved ? "ذخیره شد" : "ذخیره"}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "کپی شد" : "کپی"}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handlePrint}>
          <Printer className="h-3.5 w-3.5" />
          چاپ
        </Button>
      </div>

      {msg && (
        <p className="text-xs text-sky-700 bg-sky-50 border border-sky-100 px-3 py-2 rounded-lg">{msg}</p>
      )}

      <div ref={printRef} className="space-y-3" id="analysis-print-area">
        {data.learningObjectives && (
          <Card className="border-sky-100 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="py-3 px-4 bg-gradient-to-l from-sky-50 to-transparent rounded-t-xl">
              <CardTitle className="text-sm">🎯 اهداف یادگیری</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2 pt-3">
              {data.learningObjectives.knowledge?.length ? (
                <div>
                  <p className="font-medium text-xs text-sky-600 mb-1">دانشی</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                    {data.learningObjectives.knowledge.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data.learningObjectives.skills?.length ? (
                <div>
                  <p className="font-medium text-xs text-emerald-600 mb-1">مهارتی</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {data.learningObjectives.skills.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data.learningObjectives.attitude?.length ? (
                <div>
                  <p className="font-medium text-xs text-violet-600 mb-1">نگرشی</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {data.learningObjectives.attitude.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {data.motivationIdeas?.length ? (
          <Card className="border-amber-100 shadow-sm">
            <CardHeader className="py-3 px-4 bg-gradient-to-l from-amber-50 to-transparent rounded-t-xl">
              <CardTitle className="text-sm">💡 ایجاد انگیزه</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-3">
              <ul className="list-disc list-inside space-y-1">
                {data.motivationIdeas.map((idea, i) => (
                  <li key={i}>{idea}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {data.teachingMethod && (
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="py-3 px-4 bg-gradient-to-l from-indigo-50 to-transparent rounded-t-xl">
              <CardTitle className="text-sm">👩‍🏫 روش پیشنهادی تدریس</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3 pt-3">
              {data.teachingMethod.start && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-medium text-xs text-indigo-700">
                    شروع کلاس ({data.teachingMethod.start.minutes} دقیقه)
                  </p>
                  <p className="mt-1 text-slate-700">{data.teachingMethod.start.description}</p>
                </div>
              )}
              {data.teachingMethod.presentation && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-medium text-xs text-indigo-700">
                    ارائه درس ({data.teachingMethod.presentation.minutes} دقیقه)
                  </p>
                  <p className="mt-1">{data.teachingMethod.presentation.description}</p>
                </div>
              )}
              {data.teachingMethod.studentActivity && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-medium text-xs text-indigo-700">
                    فعالیت دانش‌آموزان ({data.teachingMethod.studentActivity.minutes} دقیقه)
                  </p>
                  <p className="mt-1">{data.teachingMethod.studentActivity.description}</p>
                </div>
              )}
              {data.teachingMethod.summary && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-medium text-xs text-indigo-700">
                    جمع‌بندی ({data.teachingMethod.summary.minutes} دقیقه)
                  </p>
                  <p className="mt-1">{data.teachingMethod.summary.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {data.classroomActivities?.length ? (
          <Card className="border-rose-100 shadow-sm">
            <CardHeader className="py-3 px-4 bg-gradient-to-l from-rose-50 to-transparent rounded-t-xl">
              <CardTitle className="text-sm">🎲 فعالیت جذاب کلاسی</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-3">
              <ul className="list-disc list-inside space-y-1">
                {data.classroomActivities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {data.questions && (
          <Card className="border-teal-100 shadow-sm">
            <CardHeader className="py-3 px-4 bg-gradient-to-l from-teal-50 to-transparent rounded-t-xl">
              <CardTitle className="text-sm">❓ سوال‌های پیشنهادی</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2 pt-3">
              {data.questions.simple?.length ? (
                <div>
                  <p className="font-medium text-xs text-slate-500">ساده و مستقیم</p>
                  <ul className="list-disc list-inside">
                    {data.questions.simple.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data.questions.comprehension?.length ? (
                <div>
                  <p className="font-medium text-xs text-slate-500">درک مطلب</p>
                  <ul className="list-disc list-inside">
                    {data.questions.comprehension.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data.questions.conceptual?.length ? (
                <div>
                  <p className="font-medium text-xs text-slate-500">مفهومی</p>
                  <ul className="list-disc list-inside">
                    {data.questions.conceptual.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data.questions.creative?.length ? (
                <div>
                  <p className="font-medium text-xs text-slate-500">تفکر و خلاقیت</p>
                  <ul className="list-disc list-inside">
                    {data.questions.creative.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {data.assessmentMethods?.length ? (
          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4 bg-gradient-to-l from-slate-50 to-transparent rounded-t-xl">
              <CardTitle className="text-sm">📝 ارزشیابی</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-3">
              <ul className="list-disc list-inside space-y-1">
                {data.assessmentMethods.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {data.importantTeacherNotes?.length ? (
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="py-3 px-4 bg-gradient-to-l from-orange-50 to-transparent rounded-t-xl">
              <CardTitle className="text-sm">📌 نکات مهم برای معلم</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-3">
              <ul className="list-disc list-inside space-y-1">
                {data.importantTeacherNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {data.vocabulary?.length ? (
          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4 bg-gradient-to-l from-cyan-50 to-transparent rounded-t-xl">
              <CardTitle className="text-sm">📚 واژه‌های مهم</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right">
                    <th className="pb-1 font-medium">واژه</th>
                    <th className="pb-1 font-medium">معنی ساده</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vocabulary.map((v, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1.5 font-medium text-sky-800">{v.word}</td>
                      <td className="py-1.5 text-slate-600">{v.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : null}

        {data.creativeActivities?.length ? (
          <Card className="border-fuchsia-100 shadow-sm">
            <CardHeader className="py-3 px-4 bg-gradient-to-l from-fuchsia-50 to-transparent rounded-t-xl">
              <CardTitle className="text-sm">✏️ فعالیت تکمیلی</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-3">
              <ul className="list-disc list-inside space-y-1">
                {data.creativeActivities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
