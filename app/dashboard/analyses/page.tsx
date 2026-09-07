"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, FileText, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnalysesPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/analyses")
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این تحلیل مطمئن هستید؟")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/analyses/${id}`, { method: "DELETE" });
      if (res.ok) setList((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">تحلیل‌های ذخیره‌شده</h1>
        <p className="text-slate-600 text-sm mt-1">{list.length} تحلیل</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          در حال بارگذاری...
        </div>
      ) : list.length === 0 ? (
        <Card className="p-10 sm:p-16 text-center">
          <Star className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">هنوز تحلیلی ندارید</p>
          <p className="text-sm text-slate-400 mt-2">از بخش کتاب‌ها صفحه را انتخاب و تحلیل کنید</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <Card key={a.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{a.title || "تحلیل بدون عنوان"}</h3>
                      <p className="text-sm text-slate-500 mt-0.5 truncate">
                        {a.book?.title} • {a.book?.subject}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(a.generatedAt).toLocaleDateString("fa-IR")} •{" "}
                        {a.analysisType === "quick" ? "سریع" : a.analysisType === "creative" ? "جذاب" : "کامل"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        a.sourceNote?.includes("راهنمای معلم")
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {a.sourceNote?.includes("راهنمای معلم") ? "راهنمای معلم" : "پیشنهاد AI"}
                    </span>
                    <Link href={`/dashboard/analyses/${a.id}`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        مشاهده
                      </Button>
                    </Link>
                    <Link href={`/dashboard/analyses/${a.id}?edit=1`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Pencil className="h-3.5 w-3.5" />
                        ویرایش
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-red-600 hover:bg-red-50"
                      disabled={deleting === a.id}
                      onClick={() => handleDelete(a.id)}
                    >
                      {deleting === a.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
