"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AdminBottomNav from "./_components/admin-bottom-nav";
import AdminEventsClient from "./events/admin-events-client";
import { UsersClient } from "./users/users-client";
import { BillingAdmin } from "./_components/billing-admin";
import UserMenu from "@/components/user-menu";
import { isEventActive } from "@kenangan/lib";
import { ManageEventSheet } from "../dashboard/_components/manage-event-sheet";
import { type CreatedEvent } from "@/lib/data/dashboard";

// Types
type ActivityRow = {
  id: string;
  nickname: string | null;
  captured_at: string;
  events: { name: string } | null;
};

type Event = {
  id: string;
  name: string;
  event_date: string;
  event_code: string;
  gallery_visible: boolean;
  reveal_mode: string;
  created_by: string | null;
  isOpen?: boolean;
  photoCount?: number;
  coverImageUrl?: string | null;
  cover_image_path?: string | null;
  upload_limit_enabled?: boolean;
  max_uploads_per_user?: number | null;
  max_uploads_total?: number | null;
  theme_filter?: string;
};

type Props = {
  // Overview metrics
  totalPhotos: number;
  activeEventsCount: number;
  totalGuests: number;
  activityRows: ActivityRow[];
  
  // Events tab
  allEvents: Event[];
  creatorMap: Record<string, string>;
  
  initialTab?: "overview" | "events" | "users";
  displayName: string;
  avatarUrl: string | null;
};

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatCard({
  label,
  value,
  iconBg,
  icon,
}: {
  label: string;
  value: string;
  iconBg: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      </div>
      <div className={`rounded-full p-3 ${iconBg}`}>{icon}</div>
    </div>
  );
}

export default function AdminClient({
  totalPhotos,
  activeEventsCount,
  totalGuests,
  activityRows,
  allEvents,
  creatorMap,
  initialTab = "overview",
  displayName,
  avatarUrl
}: Props) {
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab") as any;
  const [tab, setTab] = useState<"overview" | "events" | "users" | "analytics" | "billing">(queryTab || initialTab);
  const [managingEvent, setManagingEvent] = useState<CreatedEvent | null>(null);

  // Sync with browser history manually if we want to support back button, 
  // but for a pure SPA dashboard, simple state is usually fine.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  return (
    <div className="relative min-h-screen-fix bg-slate-50 pt-safe">
      <ManageEventSheet
        event={managingEvent}
        isOpen={managingEvent !== null}
        onClose={() => setManagingEvent(null)}
        isAdmin={true}
        onDeleted={() => { window.location.reload(); }}
      />
      
      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <main className="mx-auto max-w-[448px] px-4 pb-28 pt-6">
          {/* Metrics */}
          <section className="mb-6 grid grid-cols-1 gap-2">
            <StatCard
              label="Total Photos"
              value={totalPhotos.toLocaleString()}
              iconBg="bg-blue-50"
              icon={
                <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              }
            />
            <StatCard
              label="Active Events"
              value={activeEventsCount.toLocaleString()}
              iconBg="bg-green-50"
              icon={
                <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
            <StatCard
              label="Total Guests"
              value={totalGuests.toLocaleString()}
              iconBg="bg-violet-50"
              icon={
                <svg className="h-6 w-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-900">
              Recent Activity
            </h2>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {activityRows.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">
                  No recent activity.
                </p>
              ) : (
                activityRows.map((row) => (
                  <div key={row.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700">
                        <strong className="font-semibold">
                          {row.nickname ?? "Guest"}
                        </strong>{" "}
                        uploaded a photo to{" "}
                        <span className="font-medium text-slate-900">
                          {row.events?.name ?? "an event"}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {timeAgo(row.captured_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      )}

      {/* ── EVENTS TAB ── */}
      {tab === "events" && (
        <main className="mx-auto max-w-[448px] px-4 pb-28 pt-6">
          <div className="mt-4">
            <AdminEventsClient events={allEvents} creatorMap={creatorMap} onManageEvent={(event) => setManagingEvent(event as any)} />
          </div>
        </main>
      )}

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <main className="mx-auto max-w-[448px] px-4 pb-28 pt-6">
          <div className="mt-4">
            <h1 className="text-xl font-semibold">User Management</h1>
            <p className="mt-1 text-sm text-slate-600">Toggle user roles between admin and standard user.</p>
            <div className="mt-4">
              <UsersClient />
            </div>
          </div>
        </main>
      )}

      {/* ── BILLING TAB ── */}
      {tab === "billing" && (
        <main className="mx-auto max-w-[448px] px-4 pb-28 pt-6">
          <div className="mt-4">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Billing & Promotions</h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">Manage pricing plans and discount codes.</p>
            <div className="mt-8">
              <BillingAdmin />
            </div>
          </div>
        </main>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === "analytics" && (
        <main className="mx-auto max-w-[448px] px-4 pb-28 pt-6">
          <div className="mt-4">
            <h1 className="text-xl font-semibold">Analytics</h1>
            <p className="mt-1 text-sm text-slate-600">Analytics dashboard coming soon.</p>
          </div>
        </main>
      )}

      {/* Floating Action Button */}
      {tab === "overview" && (
        <Link
          href="/events/new"
          aria-label="Create new event"
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform duration-150 active:scale-95"
        >
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      )}

      {/* Interactive Bottom Nav */}
      <AdminBottomNav activeTab={tab} onTabChange={(t) => setTab(t as any)} />
    </div>
  );
}
