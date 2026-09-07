import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { BookViewer } from "@/components/pdf/book-viewer";

export default async function BookPage({
  params,
}: {
  params: { bookId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const book = await prisma.book.findFirst({
    where: { id: params.bookId, userId },
    include: {
      pages: {
        orderBy: { pageNumber: "asc" },
        take: 100,
      },
      lessons: {
        orderBy: { lessonNumber: "asc" },
      },
    },
  });

  if (!book) notFound();

  return (
    <div className="min-h-screen bg-slate-100">
      <BookViewer book={book} />
    </div>
  );
}
