import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const subjectIcons: Record<string, string> = {
  فارسی: "📖",
  ریاضی: "➗",
  علوم: "🔬",
  "مطالعات اجتماعی": "🌍",
  "هدیه‌های آسمانی": "🕌",
  قرآن: "📖",
};

export default async function BooksPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const books = await prisma.book.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">کتاب‌های من</h1>
          <p className="text-slate-600 text-sm mt-1">{books.length} کتاب</p>
        </div>
        <Link href="/dashboard/books/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            افزودن کتاب
          </Button>
        </Link>
      </div>

      {books.length === 0 ? (
        <Card className="p-16 text-center">
          <BookOpen className="h-14 w-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-6">هنوز کتابی اضافه نکرده‌اید</p>
          <Link href="/dashboard/books/new">
            <Button>اولین کتاب را آپلود کنید</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{subjectIcons[book.subject] || "📚"}</div>
                  <h3 className="font-semibold text-lg">{book.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {book.subject} • پایه {book.grade}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        book.status === "ready"
                          ? "bg-emerald-100 text-emerald-700"
                          : book.status === "processing"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {book.status === "ready"
                        ? "✅ آماده استفاده"
                        : book.status === "processing"
                        ? "⏳ در حال پردازش"
                        : "❌ خطا"}
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
  );
}
