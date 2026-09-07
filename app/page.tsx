import Link from "next/link";
import { BookOpen, Sparkles, Upload, Lightbulb, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-edu-gradient">
      <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-sm shadow-sky-200">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">دستیار هوشمند معلم</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login">
              <Button variant="ghost" className="rounded-xl">ورود</Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-xl shadow-md shadow-sky-200">ثبت‌نام رایگان</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/80 border border-sky-100 text-sky-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 shadow-sm animate-in">
          <Sparkles className="h-4 w-4" />
          مخصوص معلمان پایه سوم ابتدایی ایران
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
          کتاب را آپلود کنید
          <br />
          <span className="bg-gradient-to-l from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            راهنمای تدریس هوشمند بگیرید
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          دیگر نیازی به تحلیل صفحه‌به‌صفحه نیست. اهداف، روش تدریس، ایده‌های انگیزه و فعالیت‌های کلاسی
          را در چند ثانیه دریافت کنید — مناسب کلاس واقعی پایه سوم.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-base px-8 rounded-xl shadow-lg shadow-sky-200 w-full sm:w-auto">
              شروع رایگان
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-base px-8 rounded-xl bg-white/80 w-full sm:w-auto">
              ورود به حساب
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Upload,
              color: "bg-sky-100 text-sky-600",
              title: "آپلود کتاب PDF",
              desc: "فارسی، ریاضی، علوم و سایر دروس را آپلود کنید؛ سیستم صفحات را آماده تحلیل می‌کند.",
            },
            {
              icon: Zap,
              color: "bg-amber-100 text-amber-600",
              title: "تحلیل هوشمند",
              desc: "صفحه یا درس را انتخاب کنید و اهداف، روش تدریس، سوال و فعالیت بگیرید.",
            },
            {
              icon: Lightbulb,
              color: "bg-emerald-100 text-emerald-600",
              title: "مناسب کلاس واقعی",
              desc: "پیشنهادها ساده، عملی و برای دانش‌آموزان حدود ۹ ساله طراحی شده‌اند.",
            },
            {
              icon: Sparkles,
              color: "bg-violet-100 text-violet-600",
              title: "سه حالت تحلیل",
              desc: "سریع، کامل یا جذاب — بسته به وقتی که دارید انتخاب کنید.",
            },
            {
              icon: Shield,
              color: "bg-rose-100 text-rose-600",
              title: "دستیار، نه جایگزین",
              desc: "بین پیشنهاد AI و راهنمای رسمی معلم تفاوت مشخص است.",
            },
            {
              icon: BookOpen,
              color: "bg-teal-100 text-teal-600",
              title: "ذخیره و چاپ",
              desc: "تحلیل‌ها را ذخیره، کپی یا چاپ کنید و در کلاس استفاده کنید.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-sm border border-white/80 card-hover text-right"
            >
              <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/50 bg-white/40 py-8 text-center text-sm text-slate-500">
        <p className="font-medium text-slate-700">دستیار هوشمند معلم پایه سوم</p>
        <p className="mt-1">این سامانه جایگزین راهنمای رسمی معلم نیست؛ دستیار آموزشی است.</p>
      </footer>
    </div>
  );
}
