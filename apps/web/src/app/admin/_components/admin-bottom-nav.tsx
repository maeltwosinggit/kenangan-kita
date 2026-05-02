"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({
  href,
  label,
  isActive,
  onClick,
  activeIcon,
  inactiveIcon,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
}) {
  const content = (
    <>
      <div
        className={[
          "rounded-full p-3 transition-colors duration-150",
          isActive ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-700",
        ].join(" ")}
      >
        {isActive ? activeIcon : inactiveIcon}
      </div>
      <span
        className={[
          "mt-0.5 text-[10px] font-semibold uppercase tracking-wide",
          isActive ? "text-slate-900" : "text-slate-400",
        ].join(" ")}
      >
        {label}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="flex flex-col items-center">
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className="flex flex-col items-center">
      {content}
    </Link>
  );
}

/* ── Icons ── */
const GridFilled = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
    <rect x="13" y="13" width="8" height="8" rx="1" />
  </svg>
);
const GridOutline = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
    <rect x="13" y="13" width="8" height="8" rx="1" />
  </svg>
);

const CalendarFilled = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" fill="currentColor" opacity="0.15" />
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const CalendarOutline = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PhotoFilled = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.15" />
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const PhotoOutline = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const UsersFilled = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);
const UsersOutline = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);


const BarChartFilled = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="12" width="4" height="9" rx="1" />
    <rect x="10" y="7" width="4" height="14" rx="1" />
    <rect x="17" y="3" width="4" height="18" rx="1" opacity="0.5" />
  </svg>
);
const BarChartOutline = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export default function AdminBottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab?: "overview" | "events" | "users" | "analytics";
  onTabChange?: (tab: "overview" | "events" | "users" | "analytics") => void;
}) {
  const pathname = usePathname();

  const getIsActive = (tabName: string, pathPrefix: string) => {
    if (activeTab) return activeTab === tabName;
    return pathname === pathPrefix || pathname.startsWith(pathPrefix + "/");
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-20 max-w-[448px] items-center justify-around border-t border-slate-200 bg-white px-6">
      <NavItem
        href="/admin"
        label="Overview"
        isActive={activeTab ? activeTab === "overview" : pathname === "/admin"}
        onClick={onTabChange ? () => onTabChange("overview") : undefined}
        activeIcon={<GridFilled />}
        inactiveIcon={<GridOutline />}
      />
      <NavItem
        href="/admin?tab=events"
        label="Events"
        isActive={getIsActive("events", "/admin/events")}
        onClick={onTabChange ? () => onTabChange("events") : undefined}
        activeIcon={<CalendarFilled />}
        inactiveIcon={<CalendarOutline />}
      />
      <NavItem
        href="/admin?tab=users"
        label="Users"
        isActive={getIsActive("users", "/admin/users")}
        onClick={onTabChange ? () => onTabChange("users") : undefined}
        activeIcon={<UsersFilled />}
        inactiveIcon={<UsersOutline />}
      />
      <NavItem
        href="/admin?tab=analytics"
        label="Analytics"
        isActive={getIsActive("analytics", "/admin/analytics")}
        onClick={onTabChange ? () => onTabChange("analytics") : undefined}
        activeIcon={<BarChartFilled />}
        inactiveIcon={<BarChartOutline />}
      />
    </nav>
  );
}
