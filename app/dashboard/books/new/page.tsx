"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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

    try {
      let pdfUrl = "";

      // روی production: آپلود مستقیم به Vercel Blob از مرورگر
      // (از محدودیت ۴.۵MB سرور رد می‌شود)
      if (process.env.NEXT_PUBLIC_USE_BLOB !== "0") {
        setProgress("در حال آپلود مستقیم به فضای ابری...");
        try {
          const blob = await upload(`books/${Date.now()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/blob",
            contentType: "application/pdf",
          });
          pdfUrl = blob.url;
        } catch (blobErr: any) {
          console.error(blobErr);
          // اگر Blob در دسترس نبود، برای فایل کوچک از API قدیمی استفاده کن
          if (file.size > 3.5 * 1024 * 1024) {
            setError(
              "آپلود ابری ناموفق بود. BLOB_READ_WRITE_TOKEN و اتصال Blob به پروژه را بررسی کنید. " +
                (blobErr?.message || "")
            );
            return;
          }
        }
      }

      setProgress("در حال ثبت کتاب...");

      let res: Response;
      if (pdfUrl) {
        res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfUrl,
            title,
            subject,
            academicYear,
            grade: 3,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("subject", subject);
        formData.append("academicYear", academicYear);
        formData.append("grade", "3");
        res = await fetch("/api/upload", { method: "POST", body: formData });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در ثبت کتاب");
        return;
      }

      setProgress("موفق! در حال انتقال...");
      router.push(`/books/${data.bookId}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "خطایی رخ داد. لطفاً دوباره تلاش کنید.");
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
            فایل PDF را انتخاب کنید. روی Vercel فایل مستقیم به فضای ابری آپلود می‌شود.
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
              <Label>فایل PDF</Label>
              <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-sky-400 transition-colors">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  id="pdf-upload"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10 text-sky-600" />
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(1)} مگابایت
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Upload className="h-10 w-10" />
                      <p className="text-sm">کلیک کنید یا فایل را بکشید</p>
                      <p className="text-xs">حداکثر حدود ۵۰ مگابایت</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}
            {progress && loading && (
              <p className="text-sm text-sky-700 bg-sky-50 p-3 rounded-lg flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                "آپلود و افزودن کتاب"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
