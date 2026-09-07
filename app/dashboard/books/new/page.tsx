"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const subjects = [
  "فارسی",
  "ریاضی",
  "علوم",
  "مطالعات اجتماعی",
  "هدیه‌های آسمانی",
  "قرآن",
  "سایر",
];

export default function NewBookPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("فارسی");
  const [academicYear, setAcademicYear] = useState("۱۴۰۴-۱۴۰۵");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("لطفاً فایل PDF را انتخاب کنید");
      return;
    }

    setError("");
    setLoading(true);
    setProgress("در حال آپلود فایل...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("subject", subject);
      formData.append("academicYear", academicYear);
      formData.append("grade", "3");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطا در آپلود");
        return;
      }

      setProgress("کتاب با موفقیت اضافه شد. در حال انتقال...");
      router.push(`/books/${data.bookId}`);
      router.refresh();
    } catch {
      setError("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">افزودن کتاب جدید</CardTitle>
          <CardDescription>
            فایل PDF کتاب درسی پایه سوم را آپلود کنید تا سیستم آن را پردازش کند.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان کتاب</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: فارسی سوم دبستان"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">نام درس</Label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">سال تحصیلی</Label>
              <Input
                id="year"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="۱۴۰۴-۱۴۰۵"
              />
            </div>

            <div className="space-y-2">
              <Label>فایل PDF کتاب</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  file ? "border-sky-400 bg-sky-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10 text-sky-600" />
                      <p className="font-medium text-sky-700">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(1)} مگابایت
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-10 w-10 text-slate-400" />
                      <p className="text-slate-600">کلیک کنید یا فایل را بکشید</p>
                      <p className="text-xs text-slate-400">فقط فایل PDF</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}
            {progress && !error && (
              <p className="text-sm text-sky-700 bg-sky-50 p-3 rounded-lg">{progress}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading || !file}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                "آپلود و ذخیره کتاب"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
