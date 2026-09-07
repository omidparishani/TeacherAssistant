import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, PlusCircle, Star, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const subjectIcons: Record<string, string> = {
  فارسی: "📖",
  ریاضی: "➗",
  علوم: "🔬",
  "مطالعات اجتماعی": "🌍",
  "هدیه‌های آسمانی": "🕌",
  قرآن: "📖",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const [books, analysesCount] = await Promise.all([
    prisma.book.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.teachingAnalysis.count({
      where: { userId, isSaved: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          سلام {session?.user?.name || "معلم عزیز"} 👋
        </h1>
        <p className="text-slate-600 mt-1">به داشبورد دستیار هوشمند معلم خوش آمدید</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">کتاب‌ها</CardTitle>
            <BookOpen className="h-5 w-5 text-sky-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{books.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">تحلیل‌های ذخیره‌شده</CardTitle>
            <Star className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analysesCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">آماده برای تدریس</CardTitle>
            <FileText className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{books.filter((b) => b.status === "ready").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/books/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            افزودن کتاب جدید
          </Button>
        </Link>
        <Link href="/dashboard/books">
          <Button variant="outline">مشاهده همه کتاب‌ها</Button>
        </Link>
      </div>

      {/* Recent books */}
      <div>
        <h2 className="text-lg font-semibold mb-4">کتاب‌های من</h2>
        {books.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">هنوز کتابی آپلود نکرده‌اید</p>
            <Link href="/dashboard/books/new">
              <Button>اولین کتاب را اضافه کنید</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <Link key={book.id} href={`/books/${book.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="text-3xl mb-3">
                      {subjectIcons[book.subject] || "📚"}
                    </div>
                    <h3 className="font-semibold text-slate-900">{book.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{book.subject} — پایه {book.grade}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          book.status === "ready"
                            ? "bg-emerald-100 text-emerald-700"
                            : book.status === "processing"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {book.status === "ready"
                          ? "آماده"
                          : book.status === "processing"
                          ? "در حال پردازش"
                          : "خطا"}
                      </span>
                      {book.totalPages > 0 && (
                        <span className="text-xs text-slate-400">{book.totalPages} صفحه</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
