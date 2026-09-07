"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisResultView } from "@/components/analysis/analysis-result";

const PDFDocument = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false, loading: () => <PDFLoading /> }
);
const PDFPage = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

function PDFLoading() {
  return (
    <div className="flex items-center justify-center h-96 text-slate-500 gap-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      در حال بارگذاری PDF...
    </div>
  );
}

interface BookPage {
  id: string;
  pageNumber: number;
  extractedText: string | null;
  analysisStatus: string;
}

interface Book {
  id: string;
  title: string;
  subject: string;
  pdfUrl: string;
  totalPages: number;
  status: string;
  pages: BookPage[];
  lessons: {
    id: string;
    title: string;
    lessonNumber: number;
    startPage: number;
    endPage: number;
  }[];
}

export function BookViewer({ book }: { book: Book }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(book.totalPages || 0);
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [analysisType, setAnalysisType] = useState<"quick" | "full" | "creative">("full");
  const [systemPromptKey, setSystemPromptKey] = useState("system");
  const [prompts, setPrompts] = useState<{ key: string; title: string }[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1.1);
  const [pdfError, setPdfError] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-pdf").then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
        setWorkerReady(true);
      });
    }
  }, []);

  useEffect(() => {
    fetch("/api/ai-prompts")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setPrompts(d.map((p: any) => ({ key: p.key, title: p.title || p.key })));
        }
      })
      .catch(() => {});
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPdfError(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setPdfError(true);
  }, []);

  function togglePage(pageNum: number) {
    setSelectedPages((prev) =>
      prev.includes(pageNum)
        ? prev.filter((p) => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b)
    );
  }

  function goToPage(page: number) {
    const p = Math.max(1, Math.min(page, numPages || 1));
    setCurrentPage(p);
  }

  async function handleAnalyze() {
    if (!imageFile && selectedPages.length === 0) {
      setError("حداقل یک صفحه انتخاب کنید یا تصویر آپلود کنید");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      let res: Response;
      if (imageFile) {
        const form = new FormData();
        form.append("bookId", book.id);
        form.append("pageNumbers", JSON.stringify(selectedPages.length ? selectedPages : [currentPage]));
        form.append("analysisType", analysisType);
        form.append("systemPromptKey", systemPromptKey);
        form.append("image", imageFile);
        res = await fetch("/api/analysis", { method: "POST", body: form });
      } else {
        res = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: book.id,
            pageNumbers: selectedPages,
            analysisType,
            systemPromptKey,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در تحلیل");
        return;
      }
      setAnalysis(data);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }

  const pageRecord = book.pages.find((p) => p.pageNumber === currentPage);
  const fallbackText =
    pageRecord?.extractedText ||
    "متن این صفحه هنوز استخراج نشده است. می‌توانید با انتخاب صفحه، تحلیل را انجام دهید.";

  const total = numPages || book.totalPages || book.pages.length || 20;

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/books">
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4 ml-1" />
              بازگشت
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-slate-900">{book.title}</h1>
            <p className="text-xs text-slate-500">{book.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full ${
              book.status === "ready"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {book.status === "ready" ? "آماده" : "در حال پردازش"}
          </span>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col bg-slate-200 overflow-hidden">
          <div className="bg-white border-b px-4 py-2 flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <span className="text-sm flex items-center gap-1">
              صفحه
              <input
                type="number"
                min={1}
                max={total}
                value={currentPage}
                onChange={(e) => goToPage(Number(e.target.value) || 1)}
                className="w-14 text-center border rounded px-1 py-0.5 mx-1"
              />
              از {total}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= total}
              onClick={() => goToPage(currentPage + 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-slate-500 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
            {!pdfError ? (
              <div className="shadow-xl bg-white rounded overflow-hidden">
                {workerReady ? (
                  <PDFDocument
                    file={book.pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<PDFLoading />}
                    error={
                      <div className="p-8 text-center text-red-600">
                        خطا در بارگذاری PDF. مسیر فایل را بررسی کنید.
                      </div>
                    }
                  >
                    <PDFPage
                      pageNumber={currentPage}
                      scale={scale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="max-w-full"
                    />
                  </PDFDocument>
                ) : (
                  <PDFLoading />
                )}
              </div>
            ) : (
              <div className="bg-white shadow-lg rounded-lg max-w-2xl w-full p-8 min-h-[500px]">
                <div className="flex items-center gap-2 text-amber-600 text-sm mb-4">
                  <FileText className="h-4 w-4" />
                  نمایش متن صفحه (PDF بارگذاری نشد)
                </div>
                <div className="prose prose-sm max-w-none text-slate-800 leading-8 whitespace-pre-wrap">
                  {fallbackText}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="w-full lg:w-[400px] bg-white border-t lg:border-t-0 lg:border-r flex flex-col overflow-hidden shrink-0 max-h-[55vh] lg:max-h-none">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-600" />
              پنل هوشمند تدریس
            </h2>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-5">
            <div>
              <p className="text-sm font-medium mb-2">انتخاب صفحات برای تحلیل</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto">
                {Array.from({ length: Math.min(total, 60) }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => togglePage(num)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      selectedPages.includes(num)
                        ? "bg-sky-600 text-white"
                        : currentPage === num
                        ? "bg-sky-100 text-sky-700 border border-sky-300"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {selectedPages.length} صفحه انتخاب شده
                {selectedPages.length > 0 && (
                  <span className="mr-1">({selectedPages.join("، ")})</span>
                )}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setSelectedPages([currentPage])}
              >
                فقط صفحه فعلی
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">پرامپت سیستم</p>
              <select
                value={systemPromptKey}
                onChange={(e) => setSystemPromptKey(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {prompts.length === 0 ? (
                  <option value="system">پرامپت سیستم (پیش‌فرض)</option>
                ) : (
                  prompts.map((pr) => (
                    <option key={pr.key} value={pr.key}>
                      {pr.title}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-slate-400 mt-1">از منوی «پرامپت‌ها» قابل ویرایش است</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">تحلیل با تصویر (اختیاری)</p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-sky-300 hover:bg-sky-50/50 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
                {imagePreview ? (
                  <div className="text-center w-full">
                    <img src={imagePreview} alt="پیش‌نمایش" className="max-h-32 mx-auto rounded-lg object-contain mb-2" />
                    <p className="text-xs text-sky-700 truncate">{imageFile?.name}</p>
                    <button
                      type="button"
                      className="text-xs text-red-600 mt-1 underline"
                      onClick={(e) => {
                        e.preventDefault();
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      حذف تصویر
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-xs">
                    <p className="font-medium text-slate-600 mb-1">آپلود عکس صفحه / تخته / کاربرگ</p>
                    <p>JPG یا PNG — مدل باید Vision داشته باشد</p>
                  </div>
                )}
              </label>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">نوع تحلیل</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "quick", label: "⚡ سریع" },
                  { id: "full", label: "📚 کامل" },
                  { id: "creative", label: "🌟 جذاب" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setAnalysisType(t.id as any)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      analysisType === t.id
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleAnalyze}
              disabled={loading || (!imageFile && selectedPages.length === 0)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال تحلیل...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  تحلیل برای تدریس
                </>
              )}
            </Button>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            {analysis && <AnalysisResultView data={analysis} analysisId={analysis.id} />}
          </div>
        </aside>
      </div>
    </div>
  );
}
