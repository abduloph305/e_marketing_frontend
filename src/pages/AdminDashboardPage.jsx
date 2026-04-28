import {
  AlertTriangle,
  Activity,
  BadgeIndianRupee,
  Ban,
  Bell,
  ChevronDown,
  CreditCard,
  FileText,
  Home,
  KeyRound,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  MoreHorizontal,
  Receipt,
  RefreshCcw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sun,
  TicketPercent,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { ToastContext } from "../context/ToastContext.jsx";
import { api } from "../lib/api.js";

const navSections = [
  {
    title: "User Management",
    items: [
      ["Users", Users],
      ["Verification / KYC", UserCheck],
      ["User Activity", ListChecks],
      ["Roles & Permissions", KeyRound],
    ],
  },
  {
    title: "Risk & Abuse",
    items: [
      ["Risk Monitoring", ShieldAlert],
      ["Spam Complaints", Bell],
      ["Blocked Domains", Ban],
      ["Suppressions", ShieldCheck],
    ],
  },
  {
    title: "Billing & Subscription",
    items: [
      ["Plans", FileText],
      ["Subscriptions", CreditCard],
      ["Payments", WalletCards],
      ["Invoices", Receipt],
      ["Coupons", TicketPercent],
      ["Credits & Refunds", BadgeIndianRupee],
    ],
  },
  {
    title: "System",
    items: [
      ["Email Sending Overview", Mail],
      ["Activity Logs", ListChecks],
      ["Settings", Settings],
    ],
  },
];

const numberFormat = new Intl.NumberFormat("en-IN");
const currencyFormat = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

const formatNumber = (value = 0) => numberFormat.format(value || 0);
const formatCurrency = (value = 0) => currencyFormat.format(value || 0);
const formatPlanPrice = (value = 0, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value || 0);

const formatDate = (value) => {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatNotificationTime = (value) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
};

function AdminStatCard({ icon: Icon, label, value, tone, hint }) {
  return (
    <div className="border border-[#ded7ef] bg-white px-6 py-6 shadow-[0_10px_28px_rgba(42,31,72,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-[13px] font-medium ${tone}`}>{label}</p>
          <p className={`mt-9 text-[25px] font-semibold leading-none ${tone}`}>{value}</p>
          <p className="mt-2 text-[13px] text-[#9b8caf]">{hint}</p>
        </div>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
    </div>
  );
}

function MiniLineChart() {
  return (
    <div className="h-[260px] border border-[#eee9f8] bg-white px-5 py-6">
      <div className="flex h-full items-end gap-2">
        {[28, 46, 39, 66, 54, 82, 74, 92, 68, 86, 78, 98, 72, 62].map((height, index) => (
          <div key={index} className="flex flex-1 flex-col justify-end">
            <div
              className="rounded-t-[4px] bg-gradient-to-t from-[#7e22ce] to-[#8b5cf6]"
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ active = 0, suspended = 0 }) {
  const total = Math.max(active + suspended, 1);
  const activePercent = Math.round((active / total) * 100);

  return (
    <div className="flex flex-col items-center justify-center gap-5 border border-[#eee9f8] bg-white p-6">
      <div
        className="h-40 w-40 rounded-full"
        style={{
          background: `conic-gradient(#16b984 0 ${activePercent}%, #f59e0b ${activePercent}% 100%)`,
        }}
      >
        <div className="m-[28px] flex h-[104px] w-[104px] items-center justify-center rounded-full bg-white text-[20px] font-semibold text-[#21192d]">
          {activePercent}%
        </div>
      </div>
      <div className="space-y-3 text-[13px]">
        <div className="flex items-center gap-2 text-[#7f6f96]">
          <span className="h-3 w-3 rounded-full bg-[#16b984]" />
          Active vendors
          <span className="font-semibold text-[#21192d]">{formatNumber(active)}</span>
        </div>
        <div className="flex items-center gap-2 text-[#7f6f96]">
          <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
          Suspended vendors
          <span className="font-semibold text-[#21192d]">{formatNumber(suspended)}</span>
        </div>
      </div>
    </div>
  );
}

function AccessSummary({ label, values = [], emptyLabel = "No access assigned" }) {
  const count = Array.isArray(values) ? values.length : 0;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-[#9b8caf]">{label}</p>
      <p className="mt-1 text-[12px] font-medium text-[#5a4380]">
        {count ? `${formatNumber(count)} allowed` : emptyLabel}
      </p>
      {count ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.slice(0, 6).map((value) => (
            <span key={value} className="bg-[#f5efff] px-2 py-1 text-[11px] font-medium text-[#5a4380]">
              {value}
            </span>
          ))}
          {count > 6 ? (
            <span className="bg-[#f5efff] px-2 py-1 text-[11px] font-medium text-[#5a4380]">
              +{formatNumber(count - 6)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DetailMenuButton({ isOpen, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center border text-[#5a4380] transition hover:bg-[#f5efff] ${
        isOpen ? "border-[#b99be7] bg-[#f5efff]" : "border-[#ded7ef] bg-white"
      }`}
      title={label}
    >
      <MoreHorizontal className="h-5 w-5" />
    </button>
  );
}

function DetailPopover({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#21192d]/20 px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close details"
      />
      <div className="relative w-full max-w-[420px] border border-[#ded7ef] bg-white shadow-[0_24px_64px_rgba(42,31,72,0.22)]">
        <div className="flex items-center justify-between border-b border-[#eee9f8] px-5 py-4">
          <p className="text-[15px] font-semibold text-[#21192d]">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="border border-[#ded7ef] px-2.5 py-1 text-[12px] font-semibold text-[#5a4380] hover:bg-[#f5efff]"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 p-5">{children}</div>
      </div>
    </div>
  );
}

function MetricDetail({ label, value, tone = "text-[#21192d]" }) {
  return (
    <div className="border border-[#eee9f8] bg-[#fbf9ff] px-3 py-3">
      <p className="text-[11px] font-semibold uppercase text-[#9b8caf]">{label}</p>
      <p className={`mt-1 text-[18px] font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function UsageMeter({ label, usage = {} }) {
  const used = usage.used || 0;
  const limit = usage.limit || 0;
  const remaining = usage.remaining || 0;
  const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;
  const exhausted = usage.isExhausted || percentage >= 100;

  return (
    <div className="border border-[#eee9f8] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-[#21192d]">{label}</p>
        <p className={`text-[12px] font-semibold ${exhausted ? "text-rose-600" : "text-[#5a4380]"}`}>
          {formatNumber(used)} / {formatNumber(limit)}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden bg-[#eee9f8]">
        <div className={`h-full ${exhausted ? "bg-rose-500" : "bg-[#8338ec]"}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-[#7f6f96]">{formatNumber(remaining)} remaining</p>
    </div>
  );
}

function RecentList({ emptyLabel, items = [], renderItem, title }) {
  return (
    <section className="border border-[#eee9f8] bg-white">
      <div className="border-b border-[#eee9f8] px-4 py-3">
        <p className="text-[13px] font-semibold text-[#21192d]">{title}</p>
      </div>
      <div className="divide-y divide-[#f1ecfb]">
        {items.length ? (
          items.slice(0, 5).map(renderItem)
        ) : (
          <p className="px-4 py-4 text-[12px] text-[#7f6f96]">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}

function VendorProfileModal({ isLoading, onClose, profile }) {
  const vendor = profile?.vendor || {};
  const billing = profile?.billing || {};
  const plan = billing.plan || {};
  const subscription = billing.subscription || {};
  const marketing = profile?.marketing || {};
  const featureUsage = billing.featureUsage || {};
  const recent = profile?.recent || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#21192d]/35 px-4 py-6">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close profile" />
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col border border-[#ded7ef] bg-[#fbf9ff] shadow-[0_28px_80px_rgba(42,31,72,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#ded7ef] bg-white px-5 py-4">
          <div>
            <p className="text-[12px] font-semibold uppercase text-[#9b8caf]">Vendor profile</p>
            <h2 className="mt-1 text-[22px] font-semibold text-[#21192d]">
              {vendor.businessName || vendor.name || "Vendor"}
            </h2>
            <p className="mt-1 text-[13px] text-[#7f6f96]">{vendor.email || "No email"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-[#ded7ef] bg-white px-3 py-2 text-[12px] font-semibold text-[#5a4380] hover:bg-[#f5efff]"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {isLoading ? (
            <div className="border border-[#eee9f8] bg-white p-8 text-center text-[13px] font-semibold text-[#7f6f96]">
              Loading complete vendor profile...
            </div>
          ) : (
            <div className="space-y-5">
              <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className="border border-[#eee9f8] bg-white p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <MetricDetail label="Business" value={vendor.businessName || vendor.name || "Not set"} />
                    <MetricDetail label="Account Status" value={vendor.accountStatus === "inactive" ? "Suspended" : "Active"} />
                    <MetricDetail label="SellersLogin Vendor ID" value={vendor.sellersloginVendorId || "Not linked"} />
                    <MetricDetail label="Account Type" value={vendor.sellersloginAccountType || "vendor_owner"} />
                    <MetricDetail label="Phone" value={vendor.phone || "No phone"} />
                    <MetricDetail label="Last Login" value={formatDate(vendor.lastLoginAt)} />
                  </div>
                </div>

                <div className="border border-[#eee9f8] bg-white p-5">
                  <p className="text-[13px] font-semibold text-[#21192d]">Plan and validity</p>
                  <div className="mt-4 grid gap-3">
                    <MetricDetail label="Current Plan" value={plan.name || "Free Plan"} />
                    <MetricDetail label="Subscription Status" value={subscription.status || "free"} />
                    <MetricDetail label="Billing Cycle" value={subscription.billingCycle || "monthly"} />
                    <MetricDetail label="Valid Until" value={formatDate(subscription.currentPeriodEnd)} />
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricDetail label="Subscribers" value={formatNumber(marketing.subscribers)} />
                <MetricDetail label="Campaigns" value={formatNumber(marketing.campaigns)} />
                <MetricDetail label="Emails Sent" value={formatNumber(marketing.sent)} />
                <MetricDetail label="Delivered" value={formatNumber(marketing.delivered)} />
                <MetricDetail label="Templates" value={formatNumber(marketing.templates)} />
                <MetricDetail label="Automations" value={formatNumber(marketing.automations)} />
                <MetricDetail label="Segments" value={formatNumber(marketing.segments)} />
                <MetricDetail label="Risk" value={`${marketing.bounceRate || 0}% bounce`} tone="text-orange-600" />
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <UsageMeter label="Templates" usage={featureUsage.templates} />
                <UsageMeter label="Automations" usage={featureUsage.automations} />
                <UsageMeter label="Segments" usage={featureUsage.segments} />
                <UsageMeter label="Team Members" usage={featureUsage.teamMembers} />
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <RecentList
                  title="Recent campaigns"
                  emptyLabel="No campaigns created yet."
                  items={recent.campaigns || []}
                  renderItem={(item) => (
                    <div key={item._id} className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-[#21192d]">{item.name}</p>
                      <p className="mt-1 text-[12px] text-[#7f6f96]">
                        {item.status} · {formatNumber(item.totals?.sent)} sent · {formatDate(item.updatedAt)}
                      </p>
                    </div>
                  )}
                />
                <RecentList
                  title="Recent templates"
                  emptyLabel="No templates created yet."
                  items={recent.templates || []}
                  renderItem={(item) => (
                    <div key={item._id} className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-[#21192d]">{item.name}</p>
                      <p className="mt-1 text-[12px] text-[#7f6f96]">{item.subject || "No subject"} · {formatDate(item.updatedAt)}</p>
                    </div>
                  )}
                />
                <RecentList
                  title="Recent automations"
                  emptyLabel="No automations created yet."
                  items={recent.automations || []}
                  renderItem={(item) => (
                    <div key={item._id} className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-[#21192d]">{item.name}</p>
                      <p className="mt-1 text-[12px] text-[#7f6f96]">
                        {item.status} · {formatNumber(item.executionCount)} runs · {formatDate(item.updatedAt)}
                      </p>
                    </div>
                  )}
                />
                <RecentList
                  title="Recent activity"
                  emptyLabel="No activity recorded yet."
                  items={recent.activity || []}
                  renderItem={(item) => (
                    <div key={item._id} className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-[#21192d]">{item.title}</p>
                      <p className="mt-1 text-[12px] text-[#7f6f96]">{item.message} · {formatDate(item.createdAt)}</p>
                    </div>
                  )}
                />
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <RecentList
                  title="Invoices"
                  emptyLabel="No invoices generated yet."
                  items={billing.invoices || []}
                  renderItem={(item) => (
                    <div key={item._id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#21192d]">{item.invoiceNumber}</p>
                        <p className="mt-1 text-[12px] text-[#7f6f96]">{item.status} · {formatDate(item.issuedAt)}</p>
                      </div>
                      <p className="text-[13px] font-semibold text-[#21192d]">{formatPlanPrice(item.total, item.currency)}</p>
                    </div>
                  )}
                />
                <RecentList
                  title="Payments"
                  emptyLabel="No payments recorded yet."
                  items={billing.payments || []}
                  renderItem={(item) => (
                    <div key={item._id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#21192d]">{item.gateway}</p>
                        <p className="mt-1 text-[12px] text-[#7f6f96]">{item.status} · {formatDate(item.createdAt)}</p>
                      </div>
                      <p className="text-[13px] font-semibold text-[#21192d]">{formatPlanPrice(item.totalAmount, item.currency)}</p>
                    </div>
                  )}
                />
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminUsersView({
  isLoading,
  isProfileLoading,
  onOpenProfile,
  openDetail,
  profile,
  query,
  setQuery,
  setOpenDetail,
  stats,
  vendors,
}) {
  const toggleDetail = (vendorId, type) => {
    setOpenDetail((current) =>
      current?.vendorId === vendorId && current?.type === type ? null : { vendorId, type },
    );
  };
  const selectedVendor = vendors.find((vendor) => vendor.id === openDetail?.vendorId);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon={Users}
          label="Logged-in Vendors"
          value={formatNumber(stats.total)}
          tone="text-[#665cf5]"
          hint="Synced from SellersLogin"
        />
        <AdminStatCard
          icon={UserCheck}
          label="Active Users"
          value={formatNumber(stats.active)}
          tone="text-[#009b5a]"
          hint="Can access marketing"
        />
        <AdminStatCard
          icon={Ban}
          label="Suspended Users"
          value={formatNumber(stats.suspended)}
          tone="text-[#f97316]"
          hint="Blocked by admin"
        />
        <AdminStatCard
          icon={Mail}
          label="Emails Sent"
          value={formatNumber(stats.emailsSent)}
          tone="text-[#0084c7]"
          hint={`${formatNumber(stats.campaigns)} campaigns`}
        />
      </section>

      <section className="border border-[#ded7ef] bg-white shadow-[0_10px_28px_rgba(42,31,72,0.04)]">
        <div className="flex flex-col gap-4 border-b border-[#ded7ef] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-[#21192d]">Users</h2>
            <p className="mt-1 text-[13px] text-[#9b8caf]">
              Vendors who logged in to Email Marketing with SellersLogin credentials
            </p>
          </div>
          <label className="flex h-9 items-center gap-2 border border-[#ded7ef] bg-white px-3">
            <Search className="h-4 w-4 text-[#9b8caf]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users"
              className="w-full min-w-0 border-0 bg-transparent text-[13px] outline-none md:w-64"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-[13px] font-medium text-[#7f6f96]">
            Loading vendor users...
          </div>
        ) : null}

        {!isLoading && !vendors.length ? (
          <div className="p-10 text-center">
            <p className="text-[15px] font-semibold text-[#21192d]">No Email Marketing users yet</p>
            <p className="mt-2 text-[13px] text-[#7f6f96]">
              Vendors will appear here after they sign in to Email Marketing.
            </p>
          </div>
        ) : null}

        {vendors.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-[13px]">
              <thead className="bg-[#fbf9ff] text-[12px] font-semibold text-[#6e5a93]">
                <tr>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">SellersLogin Details</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Access</th>
                  <th className="px-5 py-3 font-medium">Marketing Usage</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="px-5 py-3 font-medium">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9f8]">
                {vendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="cursor-pointer align-top transition hover:bg-[#fbf9ff]"
                    onClick={() => onOpenProfile(vendor)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#21192d]">{vendor.businessName || vendor.name}</p>
                      <p className="mt-1 text-[12px] text-[#9b8caf]">{vendor.name}</p>
                      <button
                        type="button"
                        className="mt-2 text-[12px] font-semibold text-[#8338ec] hover:underline"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenProfile(vendor);
                        }}
                      >
                        View complete profile
                      </button>
                      <span
                        className={`mt-3 inline-flex px-2.5 py-1 text-[12px] font-semibold ${
                          vendor.accountStatus === "inactive"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {vendor.accountStatus === "inactive" ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#21192d]">{vendor.sellersloginVendorId}</p>
                      <p className="mt-1 text-[12px] text-[#7f6f96]">
                        {vendor.sellersloginAccountType || "vendor_owner"}
                      </p>
                      {vendor.sellersloginActorId ? (
                        <p className="mt-1 max-w-[190px] truncate text-[12px] text-[#9b8caf]">
                          Actor: {vendor.sellersloginActorId}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#21192d]">{vendor.email}</p>
                      <p className="mt-1 text-[12px] text-[#7f6f96]">{vendor.phone || "No phone"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <DetailMenuButton
                        isOpen={openDetail?.vendorId === vendor.id && openDetail?.type === "access"}
                        label="View access"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleDetail(vendor.id, "access");
                        }}
                      />
                    </td>
                    <td className="px-5 py-4 justify-center">
                      <DetailMenuButton
                        isOpen={openDetail?.vendorId === vendor.id && openDetail?.type === "usage"}
                        label="View marketing usage"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleDetail(vendor.id, "usage");
                        }}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <DetailMenuButton
                        isOpen={openDetail?.vendorId === vendor.id && openDetail?.type === "risk"}
                        label="View risk"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleDetail(vendor.id, "risk");
                        }}
                      />
                    </td>
                    <td className="px-5 py-4 text-[#7f6f96]">{formatDate(vendor.lastLoginAt)}</td>
                            </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {selectedVendor && openDetail?.type === "access" ? (
        <DetailPopover title="Access Details" onClose={() => setOpenDetail(null)}>
          <div>
            <p className="text-[13px] font-semibold text-[#21192d]">
              {selectedVendor.businessName || selectedVendor.name}
            </p>
            <p className="mt-1 text-[12px] text-[#9b8caf]">{selectedVendor.email}</p>
          </div>
          <AccessSummary
            label="Pages"
            values={selectedVendor.sellersloginPageAccess}
            emptyLabel={
              selectedVendor.sellersloginAccountType === "vendor_user" ? "No page access assigned" : "Full access"
            }
          />
          <AccessSummary
            label="Websites"
            values={selectedVendor.sellersloginWebsiteAccess}
            emptyLabel={
              selectedVendor.sellersloginAccountType === "vendor_user" ? "No website access assigned" : "All websites"
            }
          />
          <div className="border-t border-[#eee9f8] pt-3">
            <p className="text-[11px] font-semibold uppercase text-[#9b8caf]">Account Type</p>
            <p className="mt-1 text-[13px] font-semibold text-[#21192d]">
              {selectedVendor.sellersloginAccountType || "vendor_owner"}
            </p>
          </div>
        </DetailPopover>
      ) : null}

      {selectedVendor && openDetail?.type === "usage" ? (
        <DetailPopover title="Marketing Usage" onClose={() => setOpenDetail(null)}>
          <div>
            <p className="text-[13px] font-semibold text-[#21192d]">
              {selectedVendor.businessName || selectedVendor.name}
            </p>
            <p className="mt-1 text-[12px] text-[#9b8caf]">{selectedVendor.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricDetail label="Subscribers" value={formatNumber(selectedVendor.subscribers)} />
            <MetricDetail label="Campaigns" value={formatNumber(selectedVendor.campaigns)} />
            <MetricDetail label="Sent" value={formatNumber(selectedVendor.emailsSent)} />
            <MetricDetail label="Delivered" value={formatNumber(selectedVendor.delivered)} />
          </div>
        </DetailPopover>
      ) : null}

      {selectedVendor && openDetail?.type === "risk" ? (
        <DetailPopover title="Risk Signals" onClose={() => setOpenDetail(null)}>
          <div>
            <p className="text-[13px] font-semibold text-[#21192d]">
              {selectedVendor.businessName || selectedVendor.name}
            </p>
            <p className="mt-1 text-[12px] text-[#9b8caf]">{selectedVendor.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricDetail label="Bounce Rate" value={`${selectedVendor.bounceRate}%`} tone="text-orange-600" />
            <MetricDetail label="Complaint Rate" value={`${selectedVendor.complaintRate}%`} tone="text-rose-600" />
          </div>
          <div className="border border-[#eee9f8] bg-[#fbf9ff] px-3 py-3">
            <p className="text-[11px] font-semibold uppercase text-[#9b8caf]">Status</p>
            <p className="mt-1 text-[13px] font-semibold text-[#21192d]">
              {selectedVendor.accountStatus === "inactive" ? "Suspended by admin" : "No active block"}
            </p>
          </div>
        </DetailPopover>
      ) : null}

      {profile || isProfileLoading ? (
        <VendorProfileModal
          isLoading={isProfileLoading}
          onClose={() => onOpenProfile(null)}
          profile={profile}
        />
      ) : null}
    </div>
  );
}

const activityTypeLabels = {
  all: "All activity",
  login: "Login history",
  email: "Email events",
  campaign: "Campaign activity",
  automation: "Automation",
  activity: "Vendor actions",
};

const getActivityTone = (category) => {
  if (category === "login") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (category === "email") {
    return "bg-sky-50 text-sky-700";
  }

  if (category === "campaign") {
    return "bg-violet-50 text-violet-700";
  }

  if (category === "automation") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-[#f5efff] text-[#5a4380]";
};

function AdminActivityView({
  activities,
  activityType,
  isLoading,
  query,
  setActivityType,
  setQuery,
  stats,
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon={Users}
          label="Active Vendors"
          value={formatNumber(stats.vendors)}
          tone="text-[#665cf5]"
          hint="With activity records"
        />
        <AdminStatCard
          icon={Activity}
          label="Login Events"
          value={formatNumber(stats.logins)}
          tone="text-[#009b5a]"
          hint="Recent Email Marketing logins"
        />
        <AdminStatCard
          icon={Mail}
          label="Emails Sent"
          value={formatNumber(stats.emailsSent)}
          tone="text-[#0084c7]"
          hint={`${formatNumber(stats.campaigns)} campaigns`}
        />
        <AdminStatCard
          icon={AlertTriangle}
          label="Bounce Rate"
          value={`${stats.bounceRate || 0}%`}
          tone="text-[#dc2626]"
          hint={`${stats.complaintRate || 0}% complaint rate`}
        />
      </section>

      <section className="border border-[#ded7ef] bg-white shadow-[0_10px_28px_rgba(42,31,72,0.04)]">
        <div className="flex flex-col gap-4 border-b border-[#ded7ef] p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-[#21192d]">User Activity</h2>
            <p className="mt-1 text-[13px] text-[#9b8caf]">
              Login history, email events, campaign changes, and vendor actions
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex h-9 items-center gap-2 border border-[#ded7ef] bg-white px-3">
              <Search className="h-4 w-4 text-[#9b8caf]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search activity"
                className="w-full min-w-0 border-0 bg-transparent text-[13px] outline-none md:w-64"
              />
            </label>
            <select
              value={activityType}
              onChange={(event) => setActivityType(event.target.value)}
              className="h-9 border border-[#ded7ef] bg-white px-3 text-[13px] font-semibold text-[#5a4380] outline-none"
            >
              {Object.entries(activityTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-[13px] font-medium text-[#7f6f96]">
            Loading user activity...
          </div>
        ) : null}

        {!isLoading && !activities.length ? (
          <div className="p-10 text-center">
            <p className="text-[15px] font-semibold text-[#21192d]">No activity found</p>
            <p className="mt-2 text-[13px] text-[#7f6f96]">
              Vendor logins and marketing actions will appear here as they happen.
            </p>
          </div>
        ) : null}

        {activities.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-[13px]">
              <thead className="bg-[#fbf9ff] text-[12px] font-semibold text-[#6e5a93]">
                <tr>
                  <th className="px-5 py-3 font-medium">Activity</th>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Details</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9f8]">
                {activities.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#21192d]">{item.title}</p>
                      <p className="mt-1 max-w-[320px] truncate text-[12px] text-[#7f6f96]">{item.message}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#21192d]">{item.vendor?.name || "Vendor"}</p>
                      <p className="mt-1 text-[12px] text-[#9b8caf]">{item.vendor?.email || item.vendor?.vendorId}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-[12px] font-semibold ${getActivityTone(item.category)}`}>
                        {activityTypeLabels[item.category] || item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#7f6f96]">
                      <p>{item.entityType || "General"}</p>
                      {item.metrics ? (
                        <p className="mt-1 text-[12px]">
                          Sent {formatNumber(item.metrics.sent)} · Delivered {formatNumber(item.metrics.delivered)}
                        </p>
                      ) : null}
                      {item.metadata?.bounceType ? (
                        <p className="mt-1 text-[12px]">Bounce: {item.metadata.bounceType}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-[#f5efff] px-2.5 py-1 text-[12px] font-semibold text-[#5a4380]">
                        {item.status || item.action || "recorded"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#7f6f96]">{formatDate(item.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AdminRiskMonitoringView({
  isLoading,
  query,
  setQuery,
  stats,
  updatingVendorId,
  updateVendorStatus,
  vendors,
}) {
  const highRiskVendors = vendors.filter(
    (vendor) => (vendor.bounceRate || 0) >= 5 || (vendor.complaintRate || 0) >= 1,
  );

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon={ShieldAlert}
          label="Risky Vendors"
          value={formatNumber(highRiskVendors.length)}
          tone="text-[#dc2626]"
          hint="Bounce or complaint signals"
        />
        <AdminStatCard
          icon={Ban}
          label="Suspended"
          value={formatNumber(stats.suspended)}
          tone="text-[#f97316]"
          hint="Blocked by admin"
        />
        <AdminStatCard
          icon={Mail}
          label="Emails Sent"
          value={formatNumber(stats.emailsSent)}
          tone="text-[#0084c7]"
          hint="Across monitored vendors"
        />
        <AdminStatCard
          icon={Users}
          label="Monitored Vendors"
          value={formatNumber(stats.total)}
          tone="text-[#665cf5]"
          hint="Logged into marketing"
        />
      </section>

      <section className="border border-[#ded7ef] bg-white shadow-[0_10px_28px_rgba(42,31,72,0.04)]">
        <div className="flex flex-col gap-4 border-b border-[#ded7ef] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-[#21192d]">Risk Monitoring</h2>
            <p className="mt-1 text-[13px] text-[#9b8caf]">
              Vendor-wise risk signals and admin suspension controls
            </p>
          </div>
          <label className="flex h-9 items-center gap-2 border border-[#ded7ef] bg-white px-3">
            <Search className="h-4 w-4 text-[#9b8caf]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vendors"
              className="w-full min-w-0 border-0 bg-transparent text-[13px] outline-none md:w-64"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-[13px] font-medium text-[#7f6f96]">
            Loading risk monitoring...
          </div>
        ) : null}

        {!isLoading && !vendors.length ? (
          <div className="p-10 text-center">
            <p className="text-[15px] font-semibold text-[#21192d]">No monitored vendors found</p>
            <p className="mt-2 text-[13px] text-[#7f6f96]">
              Vendors will appear here after they sign in to Email Marketing.
            </p>
          </div>
        ) : null}

        {vendors.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-[13px]">
              <thead className="bg-[#fbf9ff] text-[12px] font-semibold text-[#6e5a93]">
                <tr>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Email Volume</th>
                  <th className="px-5 py-3 font-medium">Bounce Rate</th>
                  <th className="px-5 py-3 font-medium">Complaint Rate</th>
                  <th className="px-5 py-3 font-medium">Risk Level</th>
                  <th className="px-5 py-3 font-medium">Last Login</th>
                  <th className="px-5 py-3 font-medium">Admin Power</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9f8]">
                {vendors.map((vendor) => {
                  const isHighRisk = (vendor.bounceRate || 0) >= 5 || (vendor.complaintRate || 0) >= 1;
                  const isMediumRisk = !isHighRisk && ((vendor.bounceRate || 0) >= 2 || (vendor.complaintRate || 0) > 0);
                  const riskLabel = isHighRisk ? "High" : isMediumRisk ? "Medium" : "Low";
                  const riskClass = isHighRisk
                    ? "bg-rose-50 text-rose-700"
                    : isMediumRisk
                      ? "bg-orange-50 text-orange-700"
                      : "bg-emerald-50 text-emerald-700";

                  return (
                    <tr key={vendor.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#21192d]">{vendor.businessName || vendor.name}</p>
                        <p className="mt-1 text-[12px] text-[#9b8caf]">{vendor.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-[12px] font-semibold ${
                            vendor.accountStatus === "inactive"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {vendor.accountStatus === "inactive" ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#21192d]">{formatNumber(vendor.emailsSent)}</p>
                        <p className="mt-1 text-[12px] text-[#9b8caf]">
                          {formatNumber(vendor.campaigns)} campaigns
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-orange-600">{vendor.bounceRate}%</td>
                      <td className="px-5 py-4 font-semibold text-rose-600">{vendor.complaintRate}%</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-[12px] font-semibold ${riskClass}`}>{riskLabel}</span>
                      </td>
                      <td className="px-5 py-4 text-[#7f6f96]">{formatDate(vendor.lastLoginAt)}</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => updateVendorStatus(vendor)}
                          disabled={updatingVendorId === vendor.id}
                          className={`border px-3 py-2 text-[12px] font-semibold transition disabled:opacity-60 ${
                            vendor.accountStatus === "inactive"
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              : "border-rose-200 text-rose-700 hover:bg-rose-50"
                          }`}
                        >
                          {vendor.accountStatus === "inactive" ? "Activate" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

const emptyPlanForm = {
  name: "",
  slug: "",
  description: "",
  monthlyPrice: "",
  yearlyPrice: "",
  emailsPerDay: "",
  emailsPerMonth: "",
  features: "",
  automations: "",
  teamMembers: "",
  templates: "",
  segments: "",
  isActive: true,
  isDefault: false,
  sortOrder: "",
};

function AdminBillingView({
  billingView,
  invoices,
  isLoading,
  onPlanSubmit,
  onSubscriptionUpdate,
  payments,
  planForm,
  plans,
  setBillingView,
  setPlanForm,
  subscriptions,
  updatingSubscriptionId,
}) {
  const activePlans = plans.filter((plan) => plan.isActive);
  const activeSubscriptions = subscriptions.filter((item) => ["active", "free", "trial"].includes(item.status));
  const monthlyRevenue = subscriptions.reduce((sum, item) => {
    const plan = item.planId || {};
    if (item.status !== "active") {
      return sum;
    }

    return sum + Number(item.billingCycle === "yearly" ? (plan.yearlyPrice || 0) / 12 : plan.monthlyPrice || 0);
  }, 0);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon={FileText}
          label="Plans"
          value={formatNumber(plans.length)}
          tone="text-[#665cf5]"
          hint={`${formatNumber(activePlans.length)} active`}
        />
        <AdminStatCard
          icon={CreditCard}
          label="Subscriptions"
          value={formatNumber(subscriptions.length)}
          tone="text-[#009b5a]"
          hint={`${formatNumber(activeSubscriptions.length)} usable`}
        />
        <AdminStatCard
          icon={BadgeIndianRupee}
          label="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          tone="text-[#cf7a00]"
          hint="Projected from active plans"
        />
        <AdminStatCard
          icon={Receipt}
          label="Invoices"
          value={formatNumber(invoices.length)}
          tone="text-[#d9467a]"
          hint={`${formatNumber(payments.length)} payments`}
        />
      </section>

      <section className="border border-[#ded7ef] bg-white shadow-[0_10px_28px_rgba(42,31,72,0.04)]">
        <div className="flex flex-col gap-4 border-b border-[#ded7ef] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-[#21192d]">Billing & Subscription</h2>
            <p className="mt-1 text-[13px] text-[#9b8caf]">
              Plans, vendor subscriptions, payments, and GST-ready invoices
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["plans", "subscriptions", "payments", "invoices"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setBillingView(item)}
                className={`border px-3 py-2 text-[12px] font-semibold capitalize ${
                  billingView === item
                    ? "border-[#b99be7] bg-[#f5efff] text-[#3b176d]"
                    : "border-[#ded7ef] bg-white text-[#5a4380]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-[13px] font-medium text-[#7f6f96]">Loading billing...</div>
        ) : null}

        {billingView === "plans" ? (
          <div className="grid gap-5 p-5 xl:grid-cols-[360px_1fr]">
            <form className="space-y-3 border border-[#ded7ef] p-4" onSubmit={onPlanSubmit}>
              <div>
                <h3 className="text-[15px] font-semibold text-[#21192d]">
                  {planForm.id ? "Edit Plan" : "Create Plan"}
                </h3>
                <p className="mt-1 text-[12px] text-[#9b8caf]">Define quota, pricing, and features.</p>
              </div>
              {[
                ["name", "Plan name"],
                ["slug", "Slug"],
                ["description", "Description"],
                ["monthlyPrice", "Monthly price"],
                ["yearlyPrice", "Yearly price"],
                ["emailsPerDay", "Emails per day"],
                ["emailsPerMonth", "Emails per month"],
                ["automations", "Automation limit"],
                ["teamMembers", "Team members"],
                ["templates", "Template limit"],
                ["segments", "Segment limit"],
                ["sortOrder", "Sort order"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-[12px] font-semibold text-[#6e5a93]">{label}</span>
                  <input
                    value={planForm[key]}
                    onChange={(event) => setPlanForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="mt-1 h-9 w-full border border-[#ded7ef] px-3 text-[13px] outline-none"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-[12px] font-semibold text-[#6e5a93]">Features</span>
                <textarea
                  value={planForm.features}
                  onChange={(event) => setPlanForm((current) => ({ ...current, features: event.target.value }))}
                  className="mt-1 min-h-20 w-full border border-[#ded7ef] px-3 py-2 text-[13px] outline-none"
                  placeholder="One feature per line"
                />
              </label>
              <div className="flex gap-4 text-[12px] font-semibold text-[#5a4380]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={planForm.isActive}
                    onChange={(event) => setPlanForm((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={planForm.isDefault}
                    onChange={(event) => setPlanForm((current) => ({ ...current, isDefault: event.target.checked }))}
                  />
                  Default
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="border border-[#8338ec] bg-[#8338ec] px-4 py-2 text-[12px] font-semibold text-white">
                  {planForm.id ? "Update Plan" : "Create Plan"}
                </button>
                {planForm.id ? (
                  <button
                    type="button"
                    onClick={() => setPlanForm(emptyPlanForm)}
                    className="border border-[#ded7ef] px-4 py-2 text-[12px] font-semibold text-[#5a4380]"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <div key={plan._id} className="border border-[#ded7ef] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#21192d]">{plan.name}</h3>
                      <p className="mt-1 text-[12px] text-[#9b8caf]">{plan.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPlanForm({
                          id: plan._id,
                          name: plan.name || "",
                          slug: plan.slug || "",
                          description: plan.description || "",
                          monthlyPrice: plan.monthlyPrice || "",
                          yearlyPrice: plan.yearlyPrice || "",
                          emailsPerDay: plan.emailsPerDay || "",
                          emailsPerMonth: plan.emailsPerMonth || "",
                          features: (plan.features || []).join("\n"),
                          automations: plan.limits?.automations || "",
                          teamMembers: plan.limits?.teamMembers || "",
                          templates: plan.limits?.templates || "",
                          segments: plan.limits?.segments || "",
                          isActive: plan.isActive,
                          isDefault: plan.isDefault,
                          sortOrder: plan.sortOrder || "",
                        })
                      }
                      className="border border-[#ded7ef] px-3 py-1.5 text-[12px] font-semibold text-[#5a4380]"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                    <MetricDetail label="Monthly" value={formatPlanPrice(plan.monthlyPrice, plan.currency)} />
                    <MetricDetail label="Yearly" value={formatPlanPrice(plan.yearlyPrice, plan.currency)} />
                    <MetricDetail label="Daily Emails" value={formatNumber(plan.emailsPerDay)} />
                    <MetricDetail label="Monthly Emails" value={formatNumber(plan.emailsPerMonth)} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(plan.features || []).slice(0, 5).map((feature) => (
                      <span key={feature} className="bg-[#f5efff] px-2 py-1 text-[11px] font-semibold text-[#5a4380]">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {billingView === "subscriptions" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-[13px]">
              <thead className="bg-[#fbf9ff] text-[12px] font-semibold text-[#6e5a93]">
                <tr>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Current Plan</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Period End</th>
                  <th className="px-5 py-3 font-medium">Change Plan</th>
                  <th className="px-5 py-3 font-medium">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9f8]">
                {subscriptions.map((subscription) => (
                  <tr key={subscription._id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#21192d]">{subscription.vendor?.name}</p>
                      <p className="mt-1 text-[12px] text-[#9b8caf]">{subscription.vendor?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#21192d]">{subscription.planId?.name}</p>
                      <p className="mt-1 text-[12px] text-[#9b8caf]">
                        {formatPlanPrice(subscription.planId?.monthlyPrice, subscription.planId?.currency)} / month
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-[#f5efff] px-2.5 py-1 text-[12px] font-semibold text-[#5a4380]">
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#7f6f96]">{formatDate(subscription.currentPeriodEnd)}</td>
                    <td className="px-5 py-4">
                      <select
                        defaultValue={subscription.planId?._id}
                        onChange={(event) =>
                          onSubscriptionUpdate(subscription, { planId: event.target.value, status: "active" })
                        }
                        className="h-9 border border-[#ded7ef] bg-white px-3 text-[13px] outline-none"
                      >
                        {plans.map((plan) => (
                          <option key={plan._id} value={plan._id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={updatingSubscriptionId === subscription._id}
                          onClick={() => onSubscriptionUpdate(subscription, { status: "active" })}
                          className="border border-emerald-200 px-3 py-2 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          disabled={updatingSubscriptionId === subscription._id}
                          onClick={() => onSubscriptionUpdate(subscription, { status: "payment_failed" })}
                          className="border border-rose-200 px-3 py-2 text-[12px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        >
                          Limit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {billingView === "payments" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-[13px]">
              <thead className="bg-[#fbf9ff] text-[12px] font-semibold text-[#6e5a93]">
                <tr>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Gateway</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9f8]">
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-5 py-4 font-semibold text-[#21192d]">{payment.vendor?.name}</td>
                    <td className="px-5 py-4 text-[#7f6f96]">{payment.planId?.name || "Manual"}</td>
                    <td className="px-5 py-4 text-[#7f6f96]">{payment.gateway}</td>
                    <td className="px-5 py-4 font-semibold text-[#21192d]">
                      {formatPlanPrice(payment.totalAmount, payment.currency)}
                    </td>
                    <td className="px-5 py-4 text-[#7f6f96]">{payment.status}</td>
                    <td className="px-5 py-4 text-[#7f6f96]">{formatDate(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {billingView === "invoices" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-[13px]">
              <thead className="bg-[#fbf9ff] text-[12px] font-semibold text-[#6e5a93]">
                <tr>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">GST</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9f8]">
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="px-5 py-4 font-semibold text-[#21192d]">{invoice.invoiceNumber}</td>
                    <td className="px-5 py-4 text-[#7f6f96]">{invoice.vendor?.name}</td>
                    <td className="px-5 py-4 text-[#7f6f96]">{formatPlanPrice(invoice.gstAmount, invoice.currency)}</td>
                    <td className="px-5 py-4 font-semibold text-[#21192d]">
                      {formatPlanPrice(invoice.total, invoice.currency)}
                    </td>
                    <td className="px-5 py-4 text-[#7f6f96]">{invoice.status}</td>
                    <td className="px-5 py-4 text-[#7f6f96]">{formatDate(invoice.issuedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AdminDashboardPage() {
  const { admin, logout } = useContext(AuthContext);
  const toast = useContext(ToastContext);
  const [overview, setOverview] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [activityOverview, setActivityOverview] = useState({ activities: [], stats: {} });
  const [billingData, setBillingData] = useState({
    invoices: [],
    payments: [],
    plans: [],
    subscriptions: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [usersQuery, setUsersQuery] = useState("");
  const [riskQuery, setRiskQuery] = useState("");
  const [activityQuery, setActivityQuery] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [updatingVendorId, setUpdatingVendorId] = useState("");
  const [updatingSubscriptionId, setUpdatingSubscriptionId] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [billingView, setBillingView] = useState("plans");
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [openDetail, setOpenDetail] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [isVendorProfileLoading, setIsVendorProfileLoading] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [openSections, setOpenSections] = useState(() =>
    navSections.reduce((acc, section) => {
      acc[section.title] = section.title === "User Management";
      return acc;
    }, {}),
  );

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/admin-dashboard/overview");
      setOverview(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load admin dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data } = await api.get("/admin-notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load notifications");
    }
  };

  const loadAdminUsers = async () => {
    setIsUsersLoading(true);
    try {
      const { data } = await api.get("/admin-dashboard/vendors");
      setAdminUsers(data.vendors || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load users");
    } finally {
      setIsUsersLoading(false);
    }
  };

  const loadUserActivity = async () => {
    setIsActivityLoading(true);
    try {
      const { data } = await api.get("/admin-dashboard/vendor-activity");
      setActivityOverview({
        activities: data.activities || [],
        stats: data.stats || {},
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load user activity");
    } finally {
      setIsActivityLoading(false);
    }
  };

  const loadBilling = async () => {
    setIsBillingLoading(true);
    try {
      const [plansResponse, subscriptionsResponse, paymentsResponse, invoicesResponse] = await Promise.all([
        api.get("/billing/plans"),
        api.get("/billing/subscriptions"),
        api.get("/billing/payments"),
        api.get("/billing/invoices"),
      ]);

      setBillingData({
        invoices: invoicesResponse.data.invoices || [],
        payments: paymentsResponse.data.payments || [],
        plans: plansResponse.data.plans || [],
        subscriptions: subscriptionsResponse.data.subscriptions || [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load billing");
    } finally {
      setIsBillingLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadNotifications();
    loadAdminUsers();
    loadUserActivity();
    loadBilling();

    const intervalId = window.setInterval(loadNotifications, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  const vendors = useMemo(() => {
    const list = overview?.vendors || [];
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return list;
    }

    return list.filter((vendor) =>
      [vendor.name, vendor.email, vendor.businessName, vendor.accountStatus]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [overview?.vendors, query]);

  const filteredAdminUsers = useMemo(() => {
    const normalizedQuery = usersQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return adminUsers;
    }

    return adminUsers.filter((vendor) =>
      [
        vendor.name,
        vendor.email,
        vendor.phone,
        vendor.businessName,
        vendor.sellersloginVendorId,
        vendor.sellersloginAccountType,
        vendor.accountStatus,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [adminUsers, usersQuery]);

  const filteredRiskVendors = useMemo(() => {
    const normalizedQuery = riskQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return adminUsers;
    }

    return adminUsers.filter((vendor) =>
      [
        vendor.name,
        vendor.email,
        vendor.phone,
        vendor.businessName,
        vendor.sellersloginVendorId,
        vendor.accountStatus,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [adminUsers, riskQuery]);

  const adminUserStats = useMemo(
    () => ({
      active: adminUsers.filter((vendor) => vendor.accountStatus !== "inactive").length,
      campaigns: adminUsers.reduce((sum, vendor) => sum + (vendor.campaigns || 0), 0),
      emailsSent: adminUsers.reduce((sum, vendor) => sum + (vendor.emailsSent || 0), 0),
      subscribers: adminUsers.reduce((sum, vendor) => sum + (vendor.subscribers || 0), 0),
      suspended: adminUsers.filter((vendor) => vendor.accountStatus === "inactive").length,
      total: adminUsers.length,
    }),
    [adminUsers],
  );

  const filteredActivities = useMemo(() => {
    const normalizedQuery = activityQuery.trim().toLowerCase();
    const list = activityOverview.activities || [];

    return list.filter((item) => {
      const matchesType = activityType === "all" || item.category === activityType;
      const matchesQuery =
        !normalizedQuery ||
        [
          item.title,
          item.message,
          item.category,
          item.type,
          item.status,
          item.vendor?.name,
          item.vendor?.email,
          item.vendor?.vendorId,
          item.entityType,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesType && matchesQuery;
    });
  }, [activityOverview.activities, activityQuery, activityType]);

  const updateVendorStatus = async (vendor) => {
    const nextStatus = vendor.accountStatus === "inactive" ? "active" : "inactive";
    setUpdatingVendorId(vendor.id);

    try {
      await api.patch(`/admin-dashboard/vendors/${vendor.id}/status`, {
        status: nextStatus,
      });
      toast.success(nextStatus === "inactive" ? "Vendor suspended" : "Vendor activated");
      await loadOverview();
      await loadAdminUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update vendor");
    } finally {
      setUpdatingVendorId("");
    }
  };

  const openVendorProfile = async (vendor) => {
    if (!vendor) {
      setVendorProfile(null);
      setIsVendorProfileLoading(false);
      return;
    }

    setOpenDetail(null);
    setVendorProfile(null);
    setIsVendorProfileLoading(true);

    try {
      const { data } = await api.get(`/admin-dashboard/vendors/${vendor.id}/profile`);
      setVendorProfile(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load vendor profile");
      setVendorProfile(null);
    } finally {
      setIsVendorProfileLoading(false);
    }
  };

  const toggleSection = (sectionTitle) => {
    setOpenSections((current) => ({
      ...current,
      [sectionTitle]: !current[sectionTitle],
    }));
  };

  const openAdminUsers = () => {
    setActiveView("users");
    setOpenSections((current) => ({
      ...current,
      "User Management": true,
    }));
  };

  const openUserActivity = () => {
    setActiveView("activity");
    setOpenSections((current) => ({
      ...current,
      "User Management": true,
    }));
  };

  const openRiskMonitoring = () => {
    setActiveView("risk");
    setOpenSections((current) => ({
      ...current,
      "Risk & Abuse": true,
    }));
  };

  const openBilling = (nextView = "plans") => {
    setActiveView("billing");
    setBillingView(nextView);
    setOpenSections((current) => ({
      ...current,
      "Billing & Subscription": true,
    }));
  };

  const submitPlan = async (event) => {
    event.preventDefault();
    const payload = {
      ...planForm,
      limits: {
        automations: planForm.automations,
        segments: planForm.segments,
        teamMembers: planForm.teamMembers,
        templates: planForm.templates,
      },
    };

    try {
      if (planForm.id) {
        await api.patch(`/billing/plans/${planForm.id}`, payload);
        toast.success("Plan updated");
      } else {
        await api.post("/billing/plans", payload);
        toast.success("Plan created");
      }

      setPlanForm(emptyPlanForm);
      await loadBilling();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save plan");
    }
  };

  const updateSubscriptionPlan = async (subscription, updates = {}) => {
    setUpdatingSubscriptionId(subscription._id);
    try {
      await api.patch(`/billing/subscriptions/${subscription._id}`, {
        billingCycle: updates.billingCycle || subscription.billingCycle || "monthly",
        gateway: "manual",
        notes: subscription.notes || "",
        planId: updates.planId || subscription.planId?._id,
        status: updates.status || subscription.status,
      });
      toast.success("Subscription updated");
      await loadBilling();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update subscription");
    } finally {
      setUpdatingSubscriptionId("");
    }
  };

  const toggleNotifications = async () => {
    const nextOpen = !isNotificationOpen;
    setIsNotificationOpen(nextOpen);

    if (nextOpen && unreadCount > 0) {
      try {
        await api.patch("/admin-notifications/read-all");
        await loadNotifications();
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to mark notifications read");
      }
    }
  };

  const stats = overview?.stats || {};
  const isSidebarExpanded = isSidebarHovered;
  const handleRefresh = () => {
    if (activeView === "users") {
      loadAdminUsers();
      return;
    }

    if (activeView === "activity") {
      loadUserActivity();
      return;
    }

    if (activeView === "risk") {
      loadAdminUsers();
      return;
    }

    if (activeView === "billing") {
      loadBilling();
      return;
    }

    loadOverview();
  };

  return (
    <div className="grid h-screen overflow-hidden bg-[#f8f7fb] text-[#21192d] lg:grid-cols-[auto_minmax(0,1fr)]">
      <aside
        className={`hidden min-h-0 flex-col overflow-hidden border-r border-[#d8ccef] bg-[#f1eafc] text-[#4f3f6f] transition-[width] duration-200 ease-out lg:flex ${
          isSidebarExpanded ? "lg:w-[280px]" : "lg:w-[76px]"
        }`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <div className="border-b border-[#d8ccef] p-3">
          <div
            className={`flex items-center border border-[#d2c3ee] bg-[#eee5fb] py-3 transition-all ${
              isSidebarExpanded ? "gap-3 px-3" : "justify-center px-2"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#f8f4ff] text-[13px] font-semibold text-[#4c1d95]">
              SA
            </div>
            {isSidebarExpanded ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#2b2140]">{admin?.name || "Super Admin"}</p>
                  <p className="truncate text-[12px] text-[#6e5a93]">{admin?.email}</p>
                </div>
                <button className="text-[#5a4380]">
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>

        <nav className={`min-h-0 flex-1 overflow-y-auto py-4 ${isSidebarExpanded ? "px-3" : "px-2"}`}>
          {isSidebarExpanded ? (
            <p className="mb-2 px-1 text-[13px] font-medium text-[#715d9a]">Overview</p>
          ) : null}
          <button
            type="button"
            onClick={() => setActiveView("dashboard")}
            className={`flex w-full items-center bg-[#8338ec] py-3 text-left text-[14px] font-semibold text-white shadow-[0_12px_24px_rgba(131,56,236,0.22)] ${
              isSidebarExpanded ? "gap-3 px-3" : "justify-center px-2"
            }`}
            title="Dashboard"
          >
            <span className="flex h-6 w-6 items-center justify-center bg-[#c9f3de] text-[#0f7a48]">
              <Home className="h-4 w-4" />
            </span>
            {isSidebarExpanded ? "Dashboard" : null}
          </button>

          {navSections.map((section) => (
            <div key={section.title} className={isSidebarExpanded ? "mt-4" : "mt-3"}>
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className={`flex w-full items-center py-2 text-left text-[13px] font-medium text-[#715d9a] transition hover:text-[#3b176d] ${
                  isSidebarExpanded ? "justify-between px-1" : "justify-center px-2"
                }`}
                title={section.title}
              >
                {isSidebarExpanded ? (
                  <>
                    <span>{section.title}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        openSections[section.title] ? "rotate-180" : ""
                      }`}
                    />
                  </>
                ) : (
                  (() => {
                    const SectionIcon = section.items[0][1];
                    return (
                      <span className="flex h-8 w-8 items-center justify-center bg-[#f8ddec] text-[#9f2d6a]">
                        <SectionIcon className="h-4 w-4" />
                      </span>
                    );
                  })()
                )}
              </button>
              {isSidebarExpanded && openSections[section.title] ? (
                <div className="mt-1 space-y-1">
                  {section.items.map(([label, Icon]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (label === "Users") {
                          openAdminUsers();
                          return;
                        }

                        if (label === "User Activity") {
                          openUserActivity();
                          return;
                        }

                        if (label === "Risk Monitoring") {
                          openRiskMonitoring();
                          return;
                        }

                        if (["Plans", "Subscriptions", "Payments", "Invoices"].includes(label)) {
                          openBilling(label.toLowerCase());
                          return;
                        }

                        toast.info(`${label} will be connected in the next phase`);
                      }}
                      className={`flex w-full items-center gap-3 px-1 py-2.5 text-left text-[14px] transition hover:bg-[#eadcfb] hover:text-[#3b176d] ${
                        (label === "Users" && activeView === "users") ||
                        (label === "User Activity" && activeView === "activity") ||
                        (label === "Risk Monitoring" && activeView === "risk") ||
                        (["Plans", "Subscriptions", "Payments", "Invoices"].includes(label) &&
                          activeView === "billing" &&
                          billingView === label.toLowerCase())
                          ? "bg-[#e5d5f8] font-semibold text-[#3b176d]"
                          : "bg-transparent text-[#5a4380]"
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center bg-[#f8ddec] text-[#9f2d6a]">
                        <Icon className="h-4 w-4" />
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="border-t border-[#d8ccef] p-4">
          <div className={`flex items-center ${isSidebarExpanded ? "gap-3" : "justify-center"}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-[#4c1d95]">
              {(admin?.name || "SA").slice(0, 2).toUpperCase()}
            </div>
            {isSidebarExpanded ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#2b2140]">{admin?.name || "Super Admin"}</p>
                  <p className="truncate text-[12px] text-[#6e5a93]">{admin?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-[#5a4380] transition hover:bg-[#eadcfb]"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </aside>

      <main className="min-h-0 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-[#ddd7e8] bg-white/95 px-4 py-3 backdrop-blur md:px-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button className="flex h-10 w-10 items-center justify-center border border-[#ded7ef] bg-white lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-[20px] font-semibold tracking-tight text-[#21192d]">
                  {activeView === "users"
                    ? "Users"
                    : activeView === "activity"
                      ? "User Activity"
                      : activeView === "risk"
                        ? "Risk Monitoring"
                        : activeView === "billing"
                          ? "Billing & Subscription"
                        : "Dashboard"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex h-10 items-center gap-2 border border-[#ded7ef] bg-white px-3 text-[13px] font-semibold text-[#5a4380]"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="relative flex h-10 w-10 items-center justify-center border border-[#fed7aa] bg-[#fff7ed] text-[#fb7185]"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
                    {formatNumber(unreadCount)}
                  </span>
                </button>

                {isNotificationOpen ? (
                  <div className="absolute right-0 top-12 z-40 w-[360px] border border-[#ded7ef] bg-white shadow-[0_20px_48px_rgba(42,31,72,0.14)]">
                    <div className="flex items-center justify-between border-b border-[#eee9f8] px-4 py-3">
                      <div>
                        <p className="text-[14px] font-semibold text-[#21192d]">Notifications</p>
                        {/* <p className="text-[12px] text-[#9b8caf]">Vendor activity in real time</p> */}
                      </div>
                      <button
                        type="button"
                        onClick={loadNotifications}
                        className="text-[#5a4380]"
                        title="Refresh notifications"
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length ? (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`border-b border-[#f0ebf8] px-4 py-3 ${
                              notification.readAt ? "bg-white" : "bg-[#fbf8ff]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#efe4ff] text-[#7e22ce]">
                                <Bell className="h-4 w-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-[13px] font-semibold text-[#21192d]">
                                    {notification.title}
                                  </p>
                                  <span className="shrink-0 text-[11px] text-[#9b8caf]">
                                    {formatNotificationTime(notification.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-1 text-[12px] leading-5 text-[#6e5a93]">
                                  {notification.message}
                                </p>
                                {notification.vendorName ? (
                                  <p className="mt-2 text-[11px] font-semibold text-[#7e22ce]">
                                    {notification.vendorName}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-[13px] text-[#7f6f96]">
                          No vendor notifications yet.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <button className="flex h-10 w-10 items-center justify-center text-[#5a4380]">
                <Sun className="h-4 w-4" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center text-[#5a4380]">
                <Settings className="h-4 w-4" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e8fb] text-[13px] font-semibold text-[#5a4380]">
                SA
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-4 p-4 md:p-7">
          {activeView === "users" ? (
            <AdminUsersView
              isLoading={isUsersLoading}
              isProfileLoading={isVendorProfileLoading}
              onOpenProfile={openVendorProfile}
              openDetail={openDetail}
              profile={vendorProfile}
              query={usersQuery}
              setQuery={setUsersQuery}
              setOpenDetail={setOpenDetail}
              stats={adminUserStats}
              vendors={filteredAdminUsers}
            />
          ) : activeView === "activity" ? (
            <AdminActivityView
              activities={filteredActivities}
              activityType={activityType}
              isLoading={isActivityLoading}
              query={activityQuery}
              setActivityType={setActivityType}
              setQuery={setActivityQuery}
              stats={activityOverview.stats || {}}
            />
          ) : activeView === "risk" ? (
            <AdminRiskMonitoringView
              isLoading={isUsersLoading}
              query={riskQuery}
              setQuery={setRiskQuery}
              stats={adminUserStats}
              updatingVendorId={updatingVendorId}
              updateVendorStatus={updateVendorStatus}
              vendors={filteredRiskVendors}
            />
          ) : activeView === "billing" ? (
            <AdminBillingView
              billingView={billingView}
              invoices={billingData.invoices}
              isLoading={isBillingLoading}
              onPlanSubmit={submitPlan}
              onSubscriptionUpdate={updateSubscriptionPlan}
              payments={billingData.payments}
              planForm={planForm}
              plans={billingData.plans}
              setBillingView={setBillingView}
              setPlanForm={setPlanForm}
              subscriptions={billingData.subscriptions}
              updatingSubscriptionId={updatingSubscriptionId}
            />
          ) : (
            <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              icon={Users}
              label="Total Vendors"
              value={formatNumber(stats.totalVendors)}
              tone="text-[#665cf5]"
              hint="Platform accounts"
            />
            <AdminStatCard
              icon={UserCheck}
              label="Active Vendors"
              value={formatNumber(stats.activeVendors)}
              tone="text-[#009b5a]"
              hint="Can send campaigns"
            />
            <AdminStatCard
              icon={Ban}
              label="Suspended"
              value={formatNumber(stats.suspendedVendors)}
              tone="text-[#f97316]"
              hint="Blocked by admin"
            />
            <AdminStatCard
              icon={Mail}
              label="Emails Today"
              value={formatNumber(stats.emailsSentToday)}
              tone="text-[#0084c7]"
              hint={`${formatNumber(stats.emailsSentTotal)} total`}
            />
            <AdminStatCard
              icon={BadgeIndianRupee}
              label="Monthly Revenue"
              value={formatCurrency(stats.monthlyRevenue)}
              tone="text-[#cf7a00]"
              hint="Billing phase pending"
            />
            <AdminStatCard
              icon={CreditCard}
              label="Subscriptions"
              value={formatNumber(stats.activeSubscriptions)}
              tone="text-[#d9467a]"
              hint="Plans phase pending"
            />
            <AdminStatCard
              icon={Users}
              label="Subscribers"
              value={formatNumber(stats.totalSubscribers)}
              tone="text-[#0891b2]"
              hint="Audience contacts"
            />
            <AdminStatCard
              icon={AlertTriangle}
              label="Complaint Rate"
              value={`${stats.complaintRate || 0}%`}
              tone="text-[#dc2626]"
              hint="Risk signal"
            />
          </section>

          {isLoading ? (
            <div className="border border-[#ded7ef] bg-white p-6 text-center text-[13px] font-medium text-[#7f6f96]">
              Loading admin overview...
            </div>
          ) : null}

          <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <div className="border border-[#ded7ef] bg-white p-6 shadow-[0_10px_28px_rgba(42,31,72,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-semibold text-[#21192d]">Email Sending Overview</h2>
                  <p className="mt-1 text-[13px] text-[#9b8caf]">Campaign volume across the platform</p>
                </div>
                <span className="border border-[#ded7ef] px-3 py-1.5 text-[12px] font-semibold text-[#7f6f96]">
                  All time
                </span>
              </div>
              <MiniLineChart />
            </div>

            <div className="border border-[#ded7ef] bg-white p-6 shadow-[0_10px_28px_rgba(42,31,72,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-semibold text-[#21192d]">Vendor Status</h2>
                  <p className="mt-1 text-[13px] text-[#9b8caf]">Verification and suspension overview</p>
                </div>
                <span className="text-[13px] font-semibold text-[#7f6f96]">
                  {formatNumber(stats.totalSubscribers)} subscribers
                </span>
              </div>
              <DonutChart active={stats.activeVendors} suspended={stats.suspendedVendors} />
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
            <div className="border border-[#ded7ef] bg-white shadow-[0_10px_28px_rgba(42,31,72,0.04)]">
              <div className="flex flex-col gap-4 border-b border-[#ded7ef] p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-[17px] font-semibold text-[#21192d]">Recent Vendors</h2>
                  <p className="text-[13px] text-[#9b8caf]">SellersLogin vendors connected to email marketing</p>
                </div>
                <label className="flex h-9 items-center gap-2 border border-[#ded7ef] bg-white px-3">
                  <Search className="h-4 w-4 text-[#9b8caf]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search vendors"
                    className="w-full min-w-0 border-0 bg-transparent text-[13px] outline-none md:w-56"
                  />
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-[13px]">
                  <thead className="bg-[#fbf9ff] text-[12px] font-semibold text-[#6e5a93]">
                    <tr>
                      <th className="px-5 py-3 font-medium">Vendor</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Subscribers</th>
                      <th className="px-5 py-3 font-medium">Campaigns</th>
                      <th className="px-5 py-3 font-medium">Emails Sent</th>
                      <th className="px-5 py-3 font-medium">Bounce</th>
                      <th className="px-5 py-3 font-medium">Last Login</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee9f8]">
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#21192d]">{vendor.businessName || vendor.name}</p>
                          <p className="mt-1 text-[12px] text-[#9b8caf]">{vendor.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 text-[12px] font-semibold ${
                              vendor.accountStatus === "inactive"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {vendor.accountStatus === "inactive" ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium">{formatNumber(vendor.subscribers)}</td>
                        <td className="px-5 py-4 font-medium">{formatNumber(vendor.campaigns)}</td>
                        <td className="px-5 py-4 font-medium">{formatNumber(vendor.emailsSent)}</td>
                        <td className="px-5 py-4 font-medium text-orange-600">{vendor.bounceRate}%</td>
                        <td className="px-5 py-4 text-[#7f6f96]">{formatDate(vendor.lastLoginAt)}</td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => updateVendorStatus(vendor)}
                            disabled={updatingVendorId === vendor.id}
                            className="border border-[#ded7ef] px-3 py-2 text-[12px] font-semibold text-[#5a4380] transition hover:bg-[#f5efff] disabled:opacity-60"
                          >
                            {vendor.accountStatus === "inactive" ? "Activate" : "Suspend"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-5">
              <div className="border border-[#ded7ef] bg-white p-5 shadow-[0_10px_28px_rgba(42,31,72,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[17px] font-semibold text-[#21192d]">Risk Alerts</h2>
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div className="space-y-3">
                  {(overview?.riskAlerts || []).map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-[#fbf9ff] px-3 py-3">
                      <span className="text-[13px] font-medium text-[#5a4380]">{item.label}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${
                          item.tone === "danger"
                            ? "bg-rose-500"
                            : item.tone === "warning"
                              ? "bg-orange-500"
                              : "bg-slate-400"
                        }`}
                      >
                        {formatNumber(item.count)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-[#ded7ef] bg-white p-5 shadow-[0_10px_28px_rgba(42,31,72,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[17px] font-semibold text-[#21192d]">Recent Payments</h2>
                  <WalletCards className="h-5 w-5 text-violet-500" />
                </div>
                <div className="border border-dashed border-[#ded7ef] p-5 text-center text-[13px] text-[#7f6f96]">
                  Billing, plans, invoices, coupons, and refunds will connect in the next phase.
                </div>
              </div>
            </div>
          </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboardPage;
