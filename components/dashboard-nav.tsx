"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  LayoutDashboard,
  Star,
  Settings,
  LogOut,
  PlusCircle,
  Sparkles,
  MessageSquareText,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/dashboard/books", label: "کتاب‌های من", icon: BookOpen },
  { href: "/dashboard/books/new", label: "افزودن کتاب", icon: PlusCircle },
  { href: "/dashboard/analyses", label: "تحلیل‌ها", icon: Star },
  { href: "/dashboard/ai-settings", label: "Providerها / AI", icon: Sparkles },
  { href: "/dashboard/prompts", label: "پرامپت‌ها", icon: MessageSquareText },
  { href: "/dashboard/settings", label: "تنظیمات کلاس", icon: Settings },
];

export function DashboardNav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavContent = (
    <>
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-sky-600" />
          <div>
            <p className="font-bold text-sm">دستیار معلم</p>
            <p className="text-xs text-slate-500">پایه سوم</p>
          </div>
        </div>
        <button className="lg:hidden p-2" onClick={() => setOpen(false)} aria-label="بستن">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t pt-4 mt-4">
        <p className="text-xs text-slate-500 px-3 mb-2 truncate">{userName || "معلم"}</p>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-600"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-5 w-5" />
          خروج
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* موبایل: دکمه منو */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b h-14 flex items-center px-4 gap-3">
        <button onClick={() => setOpen(true)} className="p-2 -mr-2" aria-label="منو">
          <Menu className="h-6 w-6" />
        </button>
        <span className="font-bold text-sm">دستیار معلم پایه سوم</span>
      </div>

      {/* Overlay موبایل */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* سایدبار */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 right-0 z-50 w-64 border-l bg-white p-4 flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {NavContent}
      </aside>
    </>
  );
}
