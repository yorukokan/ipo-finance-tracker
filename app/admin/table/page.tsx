"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "user";
  profit_share_rate: number | null;
};

type Account = {
  id: string;
  user_id: string;
  bank_name: string;
  account_name: string;
  profile?: {
    full_name: string;
    profit_share_rate: number | null;
  } | null;
};

type Offering = {
  id: string;
  company_name: string;
  stock_code: string | null;
  offering_price: number | null;
  status: "upcoming" | "open" | "closed" | "listed" | "cancelled";
};

type InvestmentStatus =
  | "application"
  | "portfolio"
  | "sold"
  | "closed"
  | "cancelled";

type Investment = {
  id: string;
  account_id: string;
  offering_id: string;
  application_date: string | null;
  application_amount: number;
  allocated_lots: number | null;
  purchase_price: number | null;
  total_cost: number | null;
  leftover_after_allocation: number | null;
  sale_date: string | null;
  sold_lots: number | null;
  sale_price: number | null;
  total_sale: number | null;
  gross_profit: number | null;
  profit_share_rate: number | null;
  user_profit_share: number | null;
  admin_profit_share: number | null;
  status: InvestmentStatus;
  note: string | null;
  created_at: string;
};

type DocumentRow = {
  id: string;
  investment_id: string | null;
  document_type:
    | "application_ss"
    | "portfolio_ss"
    | "sale_ss"
    | "repayment_receipt";
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
};

type InvestmentView = Investment & {
  account: Account | null;
  offering: Offering | null;
  documents: DocumentRow[];
};

type FilterState = {
  userId: string;
  offeringId: string;
  status: string;
  soldState: string;
  missingDocument: string;
};

const emptyFilters: FilterState = {
  userId: "",
  offeringId: "",
  status: "",
  soldState: "",
  missingDocument: "",
};

const statusLabels: Record<InvestmentStatus, string> = {
  application: "Başvuru",
  portfolio: "Portföy",
  sold: "Satıldı",
  closed: "Kapalı",
  cancelled: "İptal",
};

const statusStyles: Record<InvestmentStatus, string> = {
  application: "bg-blue-400/10 text-blue-300",
  portfolio: "bg-purple-400/10 text-purple-300",
  sold: "bg-emerald-400/10 text-emerald-300",
  closed: "bg-slate-400/10 text-slate-300",
  cancelled: "bg-rose-400/10 text-rose-300",
};

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 4,
  }).format(Number(value));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR").format(new Date(`${value}T12:00:00`));
}

function hasDocument(
  investment: InvestmentView,
  type: DocumentRow["document_type"],
) {
  return investment.documents.some(
    (document) => document.document_type === type,
  );
}

function getDocument(
  investment: InvestmentView,
  type: DocumentRow["document_type"],
) {
  return investment.documents.find(
    (document) => document.document_type === type,
  );
}

export default function AdminTablePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [investments, setInvestments] = useState<InvestmentView[]>([]);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const users = useMemo(() => {
    const map = new Map<string, string>();

    investments.forEach((investment) => {
      const userId = investment.account?.user_id;
      const fullName = investment.account?.profile?.full_name;

      if (userId && fullName) {
        map.set(userId, fullName);
      }
    });

    return Array.from(map.entries())
      .map(([id, full_name]) => ({ id, full_name }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"));
  }, [investments]);

  const offerings = useMemo(() => {
    const map = new Map<string, Offering>();

    investments.forEach((investment) => {
      if (investment.offering) {
        map.set(investment.offering.id, investment.offering);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      (a.stock_code ?? a.company_name).localeCompare(
        b.stock_code ?? b.company_name,
        "tr",
      ),
    );
  }, [investments]);

  const filteredInvestments = useMemo(() => {
    return investments.filter((investment) => {
      if (filters.userId && investment.account?.user_id !== filters.userId) {
        return false;
      }

      if (filters.offeringId && investment.offering_id !== filters.offeringId) {
        return false;
      }

      if (filters.status && investment.status !== filters.status) {
        return false;
      }

      if (filters.soldState === "sold" && !investment.sale_date) {
        return false;
      }

      if (filters.soldState === "not_sold" && investment.sale_date) {
        return false;
      }

      if (
        filters.missingDocument === "application_ss" &&
        hasDocument(investment, "application_ss")
      ) {
        return false;
      }

      if (
        filters.missingDocument === "portfolio_ss" &&
        hasDocument(investment, "portfolio_ss")
      ) {
        return false;
      }

      if (
        filters.missingDocument === "sale_ss" &&
        hasDocument(investment, "sale_ss")
      ) {
        return false;
      }

      return true;
    });
  }, [investments, filters]);

  const totals = useMemo(() => {
    const totalApplication = filteredInvestments.reduce(
      (sum, investment) => sum + Number(investment.application_amount ?? 0),
      0,
    );

    const totalCost = filteredInvestments.reduce(
      (sum, investment) => sum + Number(investment.total_cost ?? 0),
      0,
    );

    const totalSale = filteredInvestments.reduce(
      (sum, investment) => sum + Number(investment.total_sale ?? 0),
      0,
    );

    const totalProfit = filteredInvestments.reduce(
      (sum, investment) => sum + Number(investment.gross_profit ?? 0),
      0,
    );

    const adminShare = filteredInvestments.reduce(
      (sum, investment) => sum + Number(investment.admin_profit_share ?? 0),
      0,
    );

    const userShare = filteredInvestments.reduce(
      (sum, investment) => sum + Number(investment.user_profit_share ?? 0),
      0,
    );

    return {
      count: filteredInvestments.length,
      totalApplication,
      totalCost,
      totalSale,
      totalProfit,
      adminShare,
      userShare,
      missingApplicationSs: filteredInvestments.filter(
        (investment) => !hasDocument(investment, "application_ss"),
      ).length,
      missingPortfolioSs: filteredInvestments.filter(
        (investment) => !hasDocument(investment, "portfolio_ss"),
      ).length,
      missingSaleSs: filteredInvestments.filter(
        (investment) =>
          investment.sale_date && !hasDocument(investment, "sale_ss"),
      ).length,
    };
  }, [filteredInvestments]);

  async function loadPage() {
    setIsLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/";
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, profit_share_rate")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      setMessage("Profil bilgisi alınamadı.");
      setIsLoading(false);
      return;
    }

    if (profileData.role !== "admin") {
      window.location.href = "/";
      return;
    }

    setProfile(profileData as Profile);

    const { data: investmentData, error: investmentError } = await supabase
      .from("investments")
      .select(
        `
        id,
        account_id,
        offering_id,
        application_date,
        application_amount,
        allocated_lots,
        purchase_price,
        total_cost,
        leftover_after_allocation,
        sale_date,
        sold_lots,
        sale_price,
        total_sale,
        gross_profit,
        profit_share_rate,
        user_profit_share,
        admin_profit_share,
        status,
        note,
        created_at,
        account:accounts!investments_account_id_fkey(
          id,
          user_id,
          bank_name,
          account_name,
          profile:profiles!accounts_user_id_fkey(
            full_name,
            profit_share_rate
          )
        ),
        offering:offerings!investments_offering_id_fkey(
          id,
          company_name,
          stock_code,
          offering_price,
          status
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (investmentError) {
      setMessage(`Yatırım kayıtları alınamadı: ${investmentError.message}`);
      setInvestments([]);
      setIsLoading(false);
      return;
    }

    const { data: documentData, error: documentError } = await supabase
      .from("documents")
      .select(
        "id, investment_id, document_type, storage_path, uploaded_by, created_at",
      )
      .not("investment_id", "is", null);

    if (documentError) {
      setMessage(`Görsel kayıtları alınamadı: ${documentError.message}`);
    }

    const documents = (documentData ?? []) as DocumentRow[];

    const normalizedInvestments = (
      (investmentData ?? []) as unknown as InvestmentView[]
    ).map((investment) => ({
      ...investment,
      documents: documents.filter(
        (document) => document.investment_id === investment.id,
      ),
    }));

    setInvestments(normalizedInvestments);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const offeringId = params.get("offering");
    const status = params.get("status");
    const missing = params.get("missing");

    setFilters((current) => ({
      ...current,
      offeringId: offeringId ?? current.offeringId,
      status: status ?? current.status,
      missingDocument: missing ?? current.missingDocument,
    }));
  }, []);

  function updateFilter<K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearFilters() {
    setFilters(emptyFilters);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/admin/table");
    }
  }

  function getReopenStatus(investment: InvestmentView): InvestmentStatus {
    if (investment.sale_date || investment.sold_lots || investment.sale_price) {
      return "sold";
    }

    if (investment.allocated_lots || investment.purchase_price) {
      return "portfolio";
    }

    return "application";
  }

  async function handleCloseInvestment(investment: InvestmentView) {
    const missingItems: string[] = [];

    if (!hasDocument(investment, "application_ss")) {
      missingItems.push("başvuru SS");
    }

    if (!hasDocument(investment, "portfolio_ss")) {
      missingItems.push("portföy SS");
    }

    if (investment.sale_date && !hasDocument(investment, "sale_ss")) {
      missingItems.push("satış SS");
    }

    const warningText =
      missingItems.length > 0
        ? `\n\nEksik görünenler: ${missingItems.join(
            ", ",
          )}\nYine de kapatmak istiyor musun?`
        : "";

    const confirmed = window.confirm(
      `${investment.account?.profile?.full_name ?? "Kullanıcı"} - ${
        investment.offering?.stock_code ?? "Halka arz"
      } işlemini kapatmak istediğine emin misin?${warningText}`,
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase
      .from("investments")
      .update({
        status: "closed",
      })
      .eq("id", investment.id);

    if (error) {
      setMessage(`İşlem kapatılamadı: ${error.message}`);
      return;
    }

    setMessage("İşlem kapatıldı.");
    await loadPage();
  }

  async function handleReopenInvestment(investment: InvestmentView) {
    const nextStatus = getReopenStatus(investment);

    const confirmed = window.confirm(
      `${investment.account?.profile?.full_name ?? "Kullanıcı"} - ${
        investment.offering?.stock_code ?? "Halka arz"
      } işlemini tekrar açmak istediğine emin misin?\n\nYeni durum: ${
        statusLabels[nextStatus]
      }`,
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase
      .from("investments")
      .update({
        status: nextStatus,
      })
      .eq("id", investment.id);

    if (error) {
      setMessage(`İşlem tekrar açılamadı: ${error.message}`);
      return;
    }

    setMessage("İşlem tekrar açıldı.");
    await loadPage();
  }

  async function openDocument(document: DocumentRow) {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.storage_path, 120);

    if (error || !data) {
      setMessage(`Görsel açılamadı: ${error?.message ?? "Bilinmeyen hata"}`);
      return;
    }

    setPreviewUrl(data.signedUrl);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-slate-300">
          Genel tablo hazırlanıyor...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-slate-800 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium tracking-[0.2em] text-emerald-400">
              ARZ FİNANS TAKİP
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Genel Tablo
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Tüm başvuruları, satışları, kâr paylaşımını ve eksik görselleri
              filtreleyerek takip et.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Admin: {profile?.full_name}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800"
            >
              Admin Panel
            </a>

            <a
              href="/admin/offerings-summary"
              className="rounded-xl border border-purple-500/40 px-5 py-3 text-sm font-semibold text-purple-300 hover:bg-purple-400/10"
            >
              Halka Arz Özeti
            </a>

            <a
              href="/admin/offerings"
              className="rounded-xl border border-blue-500/40 px-5 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-400/10"
            >
              Halka Arzlar
            </a>

            <a
              href="/admin/cash"
              className="rounded-xl border border-emerald-500/40 px-5 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10"
            >
              Para Hareketleri
            </a>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800"
            >
              Çıkış yap
            </button>
          </div>
        </header>

        {message && (
          <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
            {message}
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-4 xl:grid-cols-7">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Kayıt
            </p>
            <p className="mt-2 text-2xl font-bold">{totals.count}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Başvuru
            </p>
            <p className="mt-2 text-xl font-bold text-blue-300">
              {formatMoney(totals.totalApplication)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Maliyet
            </p>
            <p className="mt-2 text-xl font-bold text-purple-300">
              {formatMoney(totals.totalCost)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Satış
            </p>
            <p className="mt-2 text-xl font-bold text-emerald-300">
              {formatMoney(totals.totalSale)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Kâr
            </p>
            <p
              className={`mt-2 text-xl font-bold ${
                totals.totalProfit >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {formatMoney(totals.totalProfit)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Admin Payı
            </p>
            <p className="mt-2 text-xl font-bold text-amber-300">
              {formatMoney(totals.adminShare)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Kullanıcı Payı
            </p>
            <p className="mt-2 text-xl font-bold text-cyan-300">
              {formatMoney(totals.userShare)}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Filtreler</h2>
              <p className="mt-1 text-sm text-slate-400">
                Kalabalık tabloda hızlı kontrol için filtre kullan.
              </p>
            </div>

            <button
              onClick={clearFilters}
              className="w-fit rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
            >
              Filtreleri temizle
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Kullanıcı
              </span>
              <select
                value={filters.userId}
                onChange={(event) => updateFilter("userId", event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Tümü</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Halka arz
              </span>
              <select
                value={filters.offeringId}
                onChange={(event) =>
                  updateFilter("offeringId", event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Tümü</option>
                {offerings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.stock_code ?? "-"} - {offering.company_name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Durum
              </span>
              <select
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Tümü</option>
                <option value="application">Başvuru</option>
                <option value="portfolio">Portföy</option>
                <option value="sold">Satıldı</option>
                <option value="closed">Kapalı</option>
                <option value="cancelled">İptal</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Satış
              </span>
              <select
                value={filters.soldState}
                onChange={(event) =>
                  updateFilter("soldState", event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Tümü</option>
                <option value="sold">Satılmış</option>
                <option value="not_sold">Satılmamış</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Eksik görsel
              </span>
              <select
                value={filters.missingDocument}
                onChange={(event) =>
                  updateFilter("missingDocument", event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Tümü</option>
                <option value="application_ss">Başvuru SS eksik</option>
                <option value="portfolio_ss">Portföy SS eksik</option>
                <option value="sale_ss">Satış SS eksik</option>
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Başvuru SS eksik</p>
              <p className="mt-1 text-2xl font-bold text-blue-300">
                {totals.missingApplicationSs}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Portföy SS eksik</p>
              <p className="mt-1 text-2xl font-bold text-purple-300">
                {totals.missingPortfolioSs}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Satış SS eksik</p>
              <p className="mt-1 text-2xl font-bold text-rose-300">
                {totals.missingSaleSs}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-5">
            <h2 className="text-xl font-bold">Başvuru ve satış kayıtları</h2>
            <p className="mt-2 text-sm text-slate-400">
              Filtreye uyan {filteredInvestments.length} kayıt gösteriliyor.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1850px] text-left text-sm">
              <thead className="bg-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Kullanıcı</th>
                  <th className="px-5 py-4 font-medium">Halka Arz</th>
                  <th className="px-5 py-4 font-medium">Durum</th>
                  <th className="px-5 py-4 text-right font-medium">Başvuru</th>
                  <th className="px-5 py-4 text-right font-medium">Lot</th>
                  <th className="px-5 py-4 text-right font-medium">Alış</th>
                  <th className="px-5 py-4 text-right font-medium">Maliyet</th>
                  <th className="px-5 py-4 text-right font-medium">
                    Satış Lot
                  </th>
                  <th className="px-5 py-4 text-right font-medium">
                    Satış Fiyat
                  </th>
                  <th className="px-5 py-4 text-right font-medium">
                    Satış Tutar
                  </th>
                  <th className="px-5 py-4 text-right font-medium">Kâr</th>
                  <th className="px-5 py-4 text-right font-medium">
                    Admin Payı
                  </th>
                  <th className="px-5 py-4 text-right font-medium">
                    Kullanıcı Payı
                  </th>
                  <th className="px-5 py-4 font-medium">Görseller</th>
                  <th className="px-5 py-4 text-right font-medium">İşlem</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvestments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="px-5 py-14 text-center text-slate-400"
                    >
                      Filtreye uygun kayıt yok.
                    </td>
                  </tr>
                ) : (
                  filteredInvestments.map((investment) => {
                    const applicationDocument = getDocument(
                      investment,
                      "application_ss",
                    );
                    const portfolioDocument = getDocument(
                      investment,
                      "portfolio_ss",
                    );
                    const saleDocument = getDocument(investment, "sale_ss");

                    return (
                      <tr
                        key={investment.id}
                        className="border-t border-slate-800"
                      >
                        <td className="px-5 py-5">
                          <p className="font-semibold text-slate-100">
                            {investment.account?.profile?.full_name ??
                              "Kullanıcı"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {investment.account?.bank_name ?? "-"} /{" "}
                            {investment.account?.account_name ?? "-"}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-bold text-emerald-300">
                            {investment.offering?.stock_code ?? "-"}
                          </p>
                          <p className="mt-1 max-w-[220px] text-xs text-slate-500">
                            {investment.offering?.company_name ?? "-"}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[investment.status]
                            }`}
                          >
                            {statusLabels[investment.status]}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-right">
                          <p className="font-semibold">
                            {formatMoney(investment.application_amount)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(investment.application_date)}
                          </p>
                        </td>

                        <td className="px-5 py-5 text-right">
                          {formatNumber(investment.allocated_lots)}
                        </td>

                        <td className="px-5 py-5 text-right">
                          {formatMoney(investment.purchase_price)}
                        </td>

                        <td className="px-5 py-5 text-right">
                          {formatMoney(investment.total_cost)}
                        </td>

                        <td className="px-5 py-5 text-right">
                          {formatNumber(investment.sold_lots)}
                        </td>

                        <td className="px-5 py-5 text-right">
                          {formatMoney(investment.sale_price)}
                        </td>

                        <td className="px-5 py-5 text-right">
                          {formatMoney(investment.total_sale)}
                        </td>

                        <td
                          className={`px-5 py-5 text-right font-bold ${
                            Number(investment.gross_profit ?? 0) >= 0
                              ? "text-emerald-300"
                              : "text-rose-300"
                          }`}
                        >
                          {formatMoney(investment.gross_profit)}
                        </td>

                        <td className="px-5 py-5 text-right font-bold text-amber-300">
                          {formatMoney(investment.admin_profit_share)}
                        </td>

                        <td className="px-5 py-5 text-right font-bold text-cyan-300">
                          {formatMoney(investment.user_profit_share)}
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex flex-wrap gap-2">
                            {applicationDocument ? (
                              <button
                                onClick={() =>
                                  openDocument(applicationDocument)
                                }
                                className="rounded-lg border border-blue-500/40 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-400/10"
                              >
                                B
                              </button>
                            ) : (
                              <span className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-500">
                                B yok
                              </span>
                            )}

                            {portfolioDocument ? (
                              <button
                                onClick={() => openDocument(portfolioDocument)}
                                className="rounded-lg border border-purple-500/40 px-3 py-2 text-xs font-bold text-purple-300 hover:bg-purple-400/10"
                              >
                                P
                              </button>
                            ) : (
                              <span className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-500">
                                P yok
                              </span>
                            )}

                            {saleDocument ? (
                              <button
                                onClick={() => openDocument(saleDocument)}
                                className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10"
                              >
                                S
                              </button>
                            ) : (
                              <span className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-500">
                                S yok
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex justify-end">
                            {investment.status === "closed" ? (
                              <button
                                onClick={() =>
                                  handleReopenInvestment(investment)
                                }
                                className="rounded-lg border border-blue-500/40 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-400/10"
                              >
                                Tekrar Aç
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleCloseInvestment(investment)
                                }
                                className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10"
                              >
                                Kapat
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="font-bold">Görsel Önizleme</h2>

              <button
                onClick={() => setPreviewUrl(null)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-800"
              >
                Kapat
              </button>
            </div>

            <div className="max-h-[80vh] overflow-auto p-5">
              <img
                src={previewUrl}
                alt="Yüklenen görsel"
                className="mx-auto max-h-[75vh] max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
