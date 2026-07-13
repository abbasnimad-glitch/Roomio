import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export default function CategoryCard({
  href,
  icon: Icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accent: "primary" | "secondary" | "accent";
}) {
  const accentClasses = {
    primary: "bg-primary-50 text-primary-600 group-hover:bg-primary-500",
    secondary: "bg-secondary-50 text-secondary-600 group-hover:bg-secondary-500",
    accent: "bg-accent-50 text-accent-600 group-hover:bg-accent-500",
  }[accent];

  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift focus-ring"
    >
      <span
        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:text-white ${accentClasses}`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
        <p className="mt-1 text-sm text-ink-500">{description}</p>
      </div>
    </Link>
  );
}
