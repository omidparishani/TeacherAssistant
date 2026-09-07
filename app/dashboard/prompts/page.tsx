"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";

export default function PromptsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/ai-prompts")
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setList(arr);
        const map: Record<string, string> = {};
        arr.forEach((p: any) => {
          map[p.key] = p.content;
        });
        setEdits(map);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(key: string) {
    setSavingKey(key);
    setMsg("");
    try {
      const res = await fetch("/api/ai-prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, content: edits[key] }),
      });
      if (res.ok) setMsg(`پرامپت «${key}» ذخیره شد`);
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-500 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        بارگذاری پرامپت‌ها...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">ویرایش پرامپت‌ها</h1>
        <p className="text-sm text-slate-600 mt-1">
          متن دستوراتی که به مدل AI داده می‌شود را اینجا تغییر دهید
        </p>
      </div>

      {msg && <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">{msg}</p>}

      <div className="space-y-4">
        {list.map((p) => (
          <Card key={p.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{p.title || p.key}</CardTitle>
              <CardDescription className="font-mono text-xs">{p.key}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="sr-only">محتوا</Label>
              <textarea
                className="w-full min-h-[140px] rounded-lg border p-3 text-sm leading-relaxed"
                value={edits[p.key] ?? ""}
                onChange={(e) => setEdits({ ...edits, [p.key]: e.target.value })}
              />
              <Button
                size="sm"
                onClick={() => save(p.key)}
                disabled={savingKey === p.key}
                className="gap-1"
              >
                {savingKey === p.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                ذخیره این پرامپت
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
