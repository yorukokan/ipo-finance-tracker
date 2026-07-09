"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "user";
};

type Investment = {
  id: string;
  application_amount: number;
  total_cost: number | null;
  total_sale: number | null;
  gross_profit: number | null;
  admin_profit_share: number | null;
  user_profit_share: number | null;
  sale_date: string | null;
  status: "application" | "portfolio" | "sold" | "closed" | "cancelled";
};

type DocumentRow = {
  id: string;
  investment_id: string | null;
  document_type:
    | "application_ss"
    | "portfolio_ss"
    | "sale_ss"
    | "repayment_receipt";
};

type CashTransaction = {
  id: string;
  transaction_type: "admin_to_user" | "user_to_admin";
  amount: number;
};

type Offering = {
  id: string;
  status: "upcoming" | "open" | "closed" | "listed" | "cancelled";
};

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function hasDocument(
  documents: DocumentRow[],
  investmentId: string,
  documentType: DocumentRow["document_type"],
) {
  return documents.some(
    (document) =>
      document.investment_id === investmentId &&
      document.document_type === documentType,
  );
}

export default function AdminOverviewPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(
    [],
  );
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const stats = useMemo(() => {
    const activeInvestments = investments.filter(
      (investment) =>
        investment.status !== "closed" && investment.status !== "cancelled",
    );

    const missingApplicationSs = activeInvestments.filter(
      (investment) =>
        !hasDocument(documents, investment.id, "application_ss"),
    ).length;

    const missingPortfolioSs = activeInvestments.filter(
      (investment) => !hasDocument(documents, investment.id, "portfolio_ss"),
    ).length;

    const missingSaleSs = activeInvestments.filter(
      (investment) =>
        investment.sale_date && !hasDocument(documents, investment.id, "sale_ss"),
    ).length;

    const totalApplication = investments.reduce(
      (sum, investment) => sum + Number(investment.application_amount ?? 0),
      0,
    );

    const totalCost = investments.reduce(
      (sum, investment) => sum + Number(investment.total_cost ?? 0),
      0,
    );

    const totalSale = investments.reduce(
      (sum, investment) => sum + Number(investment.total_sale ?? 0),
      0,
    );

    const totalProfit = investments.reduce(
      (sum, investment) => sum + Number(investment.gross_profit ?? 0),
      0,
    );

    const adminShare = investments.reduce(
      (sum, investment) => sum + Number(investment.admin_profit_share ?? 0),
      0,
    );

    const userShare = investments.reduce(
      (sum, investment) => sum + Number(investment.user_profit_share ?? 0),
      0,
    );

    const sent = cashTransactions
      .filter((transaction) => transaction.transaction_type === "admin_to_user")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const returned = cashTransactions
      .filter((transaction) => transaction.transaction_type === "user_to_admin")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return {
      totalInvestments: investments.length,
      activeInvestments: activeInvestments.length,
      closedInvestments: investments.filter(
        (investment) => investment.status === "closed",
      ).length,
      soldInvestments: investments.filter(
        (investment) =>
          investment.status === "sold" || investment.status === "closed",
      ).length,
      missingApplicationSs,
      missingPortfolioSs,
      missingSaleSs,
      missingTotal: missingApplicationSs + missingPortfolioSs + missingSaleSs,
      totalApplication,
      totalCost,
      totalSale,
      totalProfit,
      adminShare,
      userShare,
      sent,
      returned,
      netOutside: sent - returned,
      openOfferings: offerings.filter((offering) => offering.status === "open")
        .length,
      upcomingOfferings: offerings.filter(
        (offering) => offering.status === "upcoming",
      ).length,
    };
  }, [cashTransactions, documents, investments, offerings]);

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
      .select("id, full_name, role")
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
        "id, application_amount, total_cost, total_sale, gross_profit, admin_profit_share, user_profit_share, sale_date, status",
      );

    if (investmentError) {
      setMessage(`İşlem kayıtları alınamadı: ${investmentError.message}`);
      setIsLoading(false);
      return;
    }

    const { data: documentData, error: documentError } = await supabase
      .from("documents")
      .select("id, investment_id, document_type")
      .not("investment_id", "is", null);

    if (documentError) {
      setMessage(`Görsel kayıtları alınamadı: ${documentError.message}`);
    }

    const { data: cashData, error: cashError } = await supabase
      .from("cash_transactions")
      .select("id, transaction_type, amount")
      .in("transaction_type", ["admin_to_user", "user_to_admin"]);

    if (cashError) {
      setMessage(`Para hareketleri alınamadı: ${cashError.message}`);
    }

    const { data: offeringData, error: offeringError } = await supabase
      .from("offerings")
      .select("id, status");

    if (offeringError) {
      setMessage(`Halka arz kayıtları alınamadı: ${offeringError.message}`);
    }

    setInvestments((investmentData ?? []) as Investment[]);
    setDocuments((documentData ?? []) as DocumentRow[]);
    setCashTransactions((cashData ?? []) as CashTransaction[]);
    setOfferings((offeringData ?? []) as Offering[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-slate-300">
          Admin özet ekranı hazırlanıyor...
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
              Admin Hızlı Özet
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Eksik görselleri, açık işlemleri, toplam kârı ve dışarıdaki net
              parayı tek ekranda gör.
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
              href="/admin/table"
              className="rounded-xl border border-emerald-500/40 px-5 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10"
            >
              Genel Tablo
            </a>

            <a
              href="/admin/offerings-summary"
              className="rounded-xl border border-purple-500/40 px-5 py-3 text-sm font-semibold text-purple-300 hover:bg-purple-400/10"
            >
              Halka Arz Özeti
            </a>

            <a
              href="/admin/cash"
              className="rounded-xl border border-blue-500/40 px-5 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-400/10"
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

        <section className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
          <a
            href="/admin/table"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:bg-slate-800/60"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Toplam İşlem
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.totalInvestments}</p>
          </a>

          <a
            href="/admin/table?status=application"
            className="rounded-2xl border border-blue-500/20 bg-blue-400/5 p-5 hover:bg-blue-400/10"
          >
            <p className="text-xs uppercase tracking-wide text-blue-200/70">
              Aktif İşlem
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-300">
              {stats.activeInvestments}
            </p>
          </a>

          <a
            href="/admin/table?status=closed"
            className="rounded-2xl border border-slate-700 bg-slate-900 p-5 hover:bg-slate-800/60"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Kapalı İşlem
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-300">
              {stats.closedInvestments}
            </p>
          </a>

          <a
            href="/admin/table?missing=application_ss"
            className="rounded-2xl border border-rose-500/20 bg-rose-400/5 p-5 hover:bg-rose-400/10"
          >
            <p className="text-xs uppercase tracking-wide text-rose-200/70">
              Başvuru SS Eksik
            </p>
            <p className="mt-2 text-3xl font-bold text-rose-300">
              {stats.missingApplicationSs}
            </p>
          </a>

          <a
            href="/admin/table?missing=portfolio_ss"
            className="rounded-2xl border border-rose-500/20 bg-rose-400/5 p-5 hover:bg-rose-400/10"
          >
            <p className="text-xs uppercase tracking-wide text-rose-200/70">
              Portföy SS Eksik
            </p>
            <p className="mt-2 text-3xl font-bold text-rose-300">
              {stats.missingPortfolioSs}
            </p>
          </a>

          <a
            href="/admin/table?missing=sale_ss"
            className="rounded-2xl border border-rose-500/20 bg-rose-400/5 p-5 hover:bg-rose-400/10"
          >
            <p className="text-xs uppercase tracking-wide text-rose-200/70">
              Satış SS Eksik
            </p>
            <p className="mt-2 text-3xl font-bold text-rose-300">
              {stats.missingSaleSs}
            </p>
          </a>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Toplam Başvuru
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-300">
              {formatMoney(stats.totalApplication)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Toplam Maliyet
            </p>
            <p className="mt-2 text-2xl font-bold text-purple-300">
              {formatMoney(stats.totalCost)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Toplam Satış
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">
              {formatMoney(stats.totalSale)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Toplam Kâr
            </p>
            <p
              className={`mt-2 text-2xl font-bold ${
                stats.totalProfit >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {formatMoney(stats.totalProfit)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Admin Payı
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-300">
              {formatMoney(stats.adminShare)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Kullanıcı Payı
            </p>
            <p className="mt-2 text-2xl font-bold text-cyan-300">
              {formatMoney(stats.userShare)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Dışarıdaki Net Para
            </p>
            <p className="mt-2 text-2xl font-bold text-rose-300">
              {formatMoney(stats.netOutside)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Açık / Yaklaşan Halka Arz
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">
              {stats.openOfferings} / {stats.upcomingOfferings}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <a
            href="/admin/table"
            className="rounded-2xl border border-emerald-500/30 bg-emerald-400/10 p-5 hover:bg-emerald-400/15"
          >
            <p className="text-lg font-bold text-emerald-300">Genel Tablo</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Kişi, halka arz, durum ve eksik görsel filtreleriyle tüm
              işlemleri kontrol et.
            </p>
          </a>

          <a
            href="/admin/offerings-summary"
            className="rounded-2xl border border-purple-500/30 bg-purple-400/10 p-5 hover:bg-purple-400/15"
          >
            <p className="text-lg font-bold text-purple-300">
              Halka Arz Özeti
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Her halka arzın toplam başvuru, maliyet, satış, kâr ve eksik
              durumlarını gör.
            </p>
          </a>

          <a
            href="/admin/cash"
            className="rounded-2xl border border-blue-500/30 bg-blue-400/10 p-5 hover:bg-blue-400/15"
          >
            <p className="text-lg font-bold text-blue-300">Para Hareketleri</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Adminin gönderdiği ve kullanıcılardan dönen para kayıtlarını
              yönet.
            </p>
          </a>
        </section>
      </div>
    </main>
  );
}