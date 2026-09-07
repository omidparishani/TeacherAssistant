"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";

const PRESETS: Record<string, { baseUrl: string; model: string }> = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-20b" },
  openai: { baseUrl: "", model: "gpt-4o-mini" },
  xai: { baseUrl: "https://api.x.ai/v1", model: "grok-2-latest" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "openrouter/free" },
  custom: { baseUrl: "", model: "" },
};

const emptyForm = {
  name: "",
  provider: "groq",
  apiKey: "",
  baseUrl: "https://api.groq.com/openai/v1",
  model: "openai/gpt-oss-20b",
  maxTokens: 4096,
  temperature: 0.7,
  notes: "",
  isActive: false,
};

export default function AISettingsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/ai-providers")
      .then((r) => r.json())
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function applyPreset(provider: string) {
    const p = PRESETS[provider] || PRESETS.custom;
    setForm((f) => ({ ...f, provider, baseUrl: p.baseUrl, model: p.model || f.model }));
  }

  function startEdit(item: any) {
    setEditingId(item.id);
    setShowForm(true);
    setForm({
      name: item.name,
      provider: item.provider,
      apiKey: item.apiKey || "",
      baseUrl: item.baseUrl || "",
      model: item.model,
      maxTokens: item.maxTokens,
      temperature: item.temperature,
      notes: item.notes || "",
      isActive: item.isActive,
    });
  }

  function startNew() {
    setEditingId(null);
    setForm({ ...emptyForm, name: "Provider جدید", isActive: list.length === 0 });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const url = editingId ? `/api/ai-providers/${editingId}` : "/api/ai-providers";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "خطا");
        return;
      }
      setMsg("ذخیره شد");
      setShowForm(false);
      load();
    } catch {
      setError("خطا در ارتباط");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(id: string) {
    await fetch(`/api/ai-providers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف این Provider؟")) return;
    await fetch(`/api/ai-providers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">تنظیمات AI / Providerها</h1>
          <p className="text-sm text-slate-600 mt-1">
            چند Provider تعریف کنید، یکی را فعال کنید و مدل اضافه کنید
          </p>
        </div>
        <Button onClick={startNew} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          افزودن Provider
        </Button>
      </div>

      {msg && <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">{msg}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10 text-slate-500 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          بارگذاری...
        </div>
      ) : list.length === 0 && !showForm ? (
        <Card className="p-8 text-center text-slate-600">
          هنوز Providerی ثبت نشده. روی «افزودن Provider» کلیک کنید.
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <Card key={p.id} className={p.isActive ? "border-sky-400 border-2" : ""}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{p.name}</h3>
                      {p.isActive && (
                        <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          فعال
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1 font-mono dir-ltr text-left">
                      {p.provider} · {p.model}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono dir-ltr text-left truncate max-w-md">
                      {p.baseUrl || "default"}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!p.isActive && (
                      <Button size="sm" variant="outline" onClick={() => setActive(p.id)}>
                        فعال‌سازی
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? "ویرایش Provider" : "Provider جدید"}
            </CardTitle>
            <CardDescription>
              مدل‌های پیشنهادی Groq: openai/gpt-oss-20b ، openai/gpt-oss-120b ، qwen/qwen3.6-27b
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نام نمایشی</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="مثلاً Groq رایگان"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع Provider</Label>
                  <select
                    value={form.provider}
                    onChange={(e) => applyPreset(e.target.value)}
                    className="flex h-10 w-full rounded-lg border px-3 text-sm"
                  >
                    <option value="groq">Groq</option>
                    <option value="openai">OpenAI</option>
                    <option value="xai">xAI Grok</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="custom">سفارشی</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  dir="ltr"
                  className="text-left font-mono"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder="gsk_... یا sk-..."
                  required={!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  dir="ltr"
                  className="text-left font-mono text-sm"
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>مدل (Model)</Label>
                <Input
                  dir="ltr"
                  className="text-left font-mono text-sm"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>max_tokens</Label>
                  <Input
                    type="number"
                    value={form.maxTokens}
                    onChange={(e) => setForm({ ...form, maxTokens: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>temperature</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={form.temperature}
                    onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                همین Provider فعال باشد (برای تحلیل استفاده شود)
              </label>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ذخیره"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
