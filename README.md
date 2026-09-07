# دستیار هوشمند معلم پایه سوم

سامانه حرفه‌ای فارسی و راست‌چین برای معلمان پایه سوم ابتدایی ایران.

معلم می‌تواند کتاب‌های درسی را به‌صورت PDF آپلود کند، صفحه یا درس را انتخاب کند و راهنمای تدریس عملی (اهداف یادگیری، روش تدریس، ایده‌های انگیزه، فعالیت‌ها، سوالات و ارزشیابی) دریافت کند.

---

## ویژگی‌های MVP

- ✅ ثبت‌نام و ورود (NextAuth + Credentials)
- ✅ آپلود PDF کتاب
- ✅ داشبورد فارسی RTL
- ✅ مشاهده کتاب و انتخاب صفحات
- ✅ تحلیل هوشمند صفحه با AI (سریع / کامل / جذاب)
- ✅ ذخیره تحلیل‌ها
- ✅ تنظیمات شخصی‌سازی کلاس
- ✅ Prisma + PostgreSQL

---

## پیش‌نیازها

- Node.js 18+
- PostgreSQL
- کلید API هوش مصنوعی (OpenAI یا Groq)

---

## نصب و اجرا

```bash
# کلون یا استخراج ZIP
cd smart-teacher-assistant

# نصب وابستگی‌ها
npm install

# کپی فایل محیطی
cp .env.example .env.local
```

فایل `.env.local` را ویرایش کنید:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/smart_teacher?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="یک-رشته-بلند-و-تصادفی-حداقل-۳۲-کاراکتر"
OPENAI_API_KEY="sk-..."
# یا
# GROQ_API_KEY="gsk_..."
```

```bash
# ساخت جداول
npx prisma db push
npx prisma generate

# اجرا در حالت توسعه
npm run dev
```

باز کنید: [http://localhost:3000](http://localhost:3000)

---

## ساختار پروژه

```
app/
  (auth)/          # ورود و ثبت‌نام
  dashboard/       # داشبورد، کتاب‌ها، تنظیمات، تحلیل‌ها
  books/[bookId]/ # ویوور کتاب + پنل تحلیل
  api/             # API Routes
lib/
  ai-provider.ts   # لایه مستقل AI (قابل تعویض)
  auth.ts
  prisma.ts
prisma/
  schema.prisma
components/
```

---

## نکات مهم

1. **این سامانه جایگزین راهنمای رسمی معلم نیست.** در خروجی‌ها بین «بر اساس راهنمای معلم» و «پیشنهاد آموزشی هوش مصنوعی» تفاوت مشخص است.
2. پردازش PDF کامل (OCR و استخراج واقعی) در نسخه فعلی به صورت placeholder است. برای production از queueهای مثل `pdf-parse` + Tesseract یا سرویس خارجی استفاده کنید و Job Queue (BullMQ) اضافه کنید.
3. فایل‌ها فعلاً در `public/uploads` ذخیره می‌شوند. در production از Vercel Blob یا S3 استفاده کنید.
4. API Key هوش مصنوعی فقط در Backend قرار دارد.

---

## Deploy

### Vercel
1. Repository را به Vercel وصل کنید.
2. Environment Variables را تنظیم کنید.
3. PostgreSQL خارجی (مثلاً Neon یا Supabase) وصل کنید.

### Docker
```bash
docker-compose up -d
```

### GitLab CI
فایل `.gitlab-ci.yml` آماده است (lint + build).

---

## توسعه آینده

- استخراج واقعی متن PDF + OCR
- آپلود راهنمای معلم و اولویت‌بندی منابع
- ساخت کاربرگ و سوال امتحانی
- طرح درس روزانه و برنامه هفتگی
- جستجوی هوشمند در کل محتوا

---

ساخته‌شده برای معلمان پایه سوم ایران 🇮🇷

---

## دیپلوی (GitHub + Vercel)

### روش پیشنهادی: اتصال مستقیم به Vercel (ساده‌ترین)

1. کد را روی **GitHub** پوش کنید:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - smart teacher assistant"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/smart-teacher-assistant.git
   git push -u origin main
   ```

2. به [vercel.com](https://vercel.com) بروید و با حساب GitHub وارد شوید.

3. **Add New Project** → ریپوی `smart-teacher-assistant` را انتخاب کنید.

4. در Environment Variables این‌ها را اضافه کنید:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Connection string دیتابیس PostgreSQL (Neon / Supabase / Vercel Postgres) |
| `NEXTAUTH_URL` | آدرس سایت بعد از دیپلوی، مثلاً `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | یک رشته تصادفی بلند (حداقل ۳۲ کاراکتر) |
| `GROQ_API_KEY` | کلید Groq (اختیاری اگر از داشبورد Provider می‌گذارید) |
| `OPENAI_API_KEY` | در صورت نیاز |

5. Deploy را بزنید.

6. بعد از دیپلوی، در دیتابیس production یک‌بار schema را اعمال کنید:
   - از Vercel CLI یا ماشین محلی با `DATABASE_URL` پروداکشن:
   ```bash
   npx prisma db push
   ```

### دیتابیس رایگان پیشنهادی برای Vercel

- [Neon](https://neon.tech) — PostgreSQL رایگان
- [Supabase](https://supabase.com) — PostgreSQL رایگان
- Vercel Postgres (اگر پلن دارید)

### دیپلوی با GitHub Actions

فایل‌های workflow در `.github/workflows/` هستند:

- `ci.yml` — روی هر push به main: install، prisma generate، build
- `deploy-vercel.yml` — دیپلوی به Vercel (نیاز به Secrets)

**Secrets لازم در GitHub (Settings → Secrets and variables → Actions):**

| Secret | از کجا بیاید |
|--------|----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | خروجی `vercel project ls` یا فایل `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | همان |

```bash
npm i -g vercel
vercel login
vercel link
# سپس ORG_ID و PROJECT_ID را از .vercel/project.json بخوانید
```

### نکات Production

1. فایل‌های PDF روی دیسک محلی (`public/uploads`) در Vercel ماندگار نیستند. برای production از **Vercel Blob** یا S3 استفاده کنید.
2. `NEXTAUTH_URL` باید دقیقاً دامنه نهایی باشد.
3. بعد از هر تغییر schema: `npx prisma db push` روی دیتابیس production.
4. کلیدهای API را فقط در Environment Variables یا جدول Provider داخل اپ بگذارید؛ در Git commit نکنید.

### دستورات سریع Git

```bash
git status
git add .
git commit -m "feat: update teacher assistant"
git push origin main
```

بعد از push، اگر پروژه به Vercel وصل باشد، دیپلوی خودکار شروع می‌شود.
