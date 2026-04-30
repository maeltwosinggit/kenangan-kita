import Link from "next/link";

type Crumb = { label: string; href?: string };

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {isLast || !crumb.href ? (
              <span className={isLast ? "font-medium text-slate-800" : "text-slate-400"}>
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="text-slate-500 hover:text-slate-800">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
