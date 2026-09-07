"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    studentAge: 9,
    classType: "mixed",
    sessionMinutes: 45,
    studentCount: 25,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.studentAge) setSettings(data);
      })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">تنظیمات</h1>
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات کلاس</CardTitle>
          <CardDescription>
            هوش مصنوعی پیشنهادهای خود را بر اساس این تنظیمات شخصی‌سازی می‌کند.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label>سن تقریبی دانش‌آموزان</Label>
              <Input
                type="number"
                min={7}
                max={12}
                value={settings.studentAge}
                onChange={(e) =>
                  setSettings({ ...settings, studentAge: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>نوع کلاس</Label>
              <select
                value={settings.classType}
                onChange={(e) => setSettings({ ...settings, classType: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="mixed">مختلط</option>
                <option value="girls">دخترانه</option>
                <option value="boys">پسرانه</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>زمان هر جلسه (دقیقه)</Label>
              <Input
                type="number"
                min={20}
                max={90}
                value={settings.sessionMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, sessionMinutes: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>تعداد تقریبی دانش‌آموزان</Label>
              <Input
                type="number"
                min={5}
                max={50}
                value={settings.studentCount}
                onChange={(e) =>
                  setSettings({ ...settings, studentCount: Number(e.target.value) })
                }
              />
            </div>
            {saved && (
              <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                تنظیمات با موفقیت ذخیره شد.
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                "ذخیره تنظیمات"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
