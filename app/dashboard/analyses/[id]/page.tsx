"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisResultView } from "@/components/analysis/analysis-result";

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(search.get("edit") === "1");
  const [title, setTitle] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/analyses/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setData(d);
          setTitle(d.title || "");
          setJsonText(JSON.stringify(d.rawContent || d, null, 2));
        }
      })
      .catch(() => setError("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      let parsed: any = {};
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        setError("JSON نامعتبر است");
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/analyses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ...parsed,
          rawContent: parsed,
          isSaved: true,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "خطا در ذخیره");
        return;
      }
      setData(d);
      setSaved(true);
      setEditMode(false);
    } catch {
      setError("خطا در ارتباط");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("حذف این تحلیل؟")) return;
    await fetch(`/api/analyses/${id}`, { method: "DELETE" });
    router.push("/dashboard/analyses");
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 justify-center py-20 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        بارگذاری...
      </div>
    );
  }

  if (error && !data) {
    return <p className="text-red-600 p-4">{error}</p>;
  }

  const viewData = data?.rawContent || data;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/analyses">
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4 ml-1" />
              بازگشت
            </Button>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold truncate">{data?.title || "تحلیل"}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!editMode ? (
            <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
              ویرایش
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
              ذخیره
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-red-600" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 ml-1" />
            حذف
          </Button>
        </div>
      </div>

      {saved && <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">ذخیره شد.</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      {editMode ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ویرایش تحلیل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>محتوای JSON</Label>
              <textarea
                className="w-full min-h-[320px] rounded-lg border p-3 font-mono text-xs dir-ltr text-left"
                dir="ltr"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        viewData && <AnalysisResultView data={viewData} />
      )}
    </div>
  );
}
