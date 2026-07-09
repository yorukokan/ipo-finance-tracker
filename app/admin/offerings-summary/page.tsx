"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "user";
};

type Account = {
  id: string;
  user_id: string;
  bank_name: string;
  account_name: string;
  profile?: {
    full_name: string;
  } | null;
};

type Offering = {
  id: string;
  company_name: string;
  stock_code: string | null;
  offering_price: number | null;
  status: "upcoming" | "open" | "closed" | "listed" | "cancelled";
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

type Investment = {
  id: string;
  account_id: string;
  offering_id: string;
  application_date: string | null;
  application_amount: number;
  allocated_lots: number | null;
  purchase_price: number | null;
  total_cost: number | null;
  sale_date: string | null;
  sold_lots: number | null;
  sale_price: number | null;
  total_sale: number | null;
  gross_profit: number | null;
  admin_profit_share: number | null;
  user_profit_share: number | null;
  status: "application" | "portfolio" | "sold" | "closed" | "cancelled";
  account: Account | null;
  offering: Offering | null;
  documents: DocumentRow[];
};

type OfferingSummary = {
  offering: Offering;
  investmentCount: number;
  uniqueAccountCount: number;
  closedCount: number;
  soldCount: number;
  totalApplication: number;
  totalLots: number;
  totalCost: number;
  totalSale: number;
  totalProfit: number;
  adminShare: number;
  userShare: number;
  missingApplicationSs: number;
  missingPortfolioSs: number;
  missingSaleSs: number;
};

const offeringStatusLabels = {
  upcoming: "Yaklaşan",
  open: "Başvuru Açık",
  closed: "Başvuru Kapalı",
  listed: "İşlemde",
  cancelled: "İptal",
};

const offeringStatusStyles = {
  upcoming: "bg-blue-400/10 text-blue-300",
  open: "bg-emerald-400/10 text-emerald-300",
  closed: "bg-amber-400/10 text-amber-300",
  listed: "bg-purple-400/10 text-purple-300",
  cancelled: "bg-rose-400/10 text-rose-300",
};

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0));
}

function hasDocument(investment: Investment, type: DocumentRow["document_type"]) {
  return investment.documents.some((document) => document.document_type === type);
}

export default function AdminOfferingsSummaryPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const summaries = useMemo(() => {
    const map = new Map<string, Investment[]>();

    investments.forEach((investment) => {
      if (!investment.offering) return;

      const current = map.get(investment.offering.id) ?? [];
      current.push(investment);
      map.set(investment.offering.id, current);
    });

    const result: OfferingSummary[] = [];

    map.forEach((items) => {
      const firstOffering = items[0]?.offering;

      if (!firstOffering) return;

      const uniqueAccountIds = new Set(items.map((item) => item.account_id));

      result.push({
        offering: firstOffering,
        investmentCount: items.length,
        uniqueAccountCount: uniqueAccountIds.size,
        closedCount: items.filter((item) => item.status === "closed").length,
        soldCount: items.filter(
          (item) => item.status === "sold" || item.status === "closed",
        ).length,
        totalApplication: items.reduce(
          (sum, item) => sum + Number(item.application_amount ?? 0),
          0,
        ),
        totalLots: items.reduce(
          (sum, item) => sum + Number(item.allocated_lots ?? 0),
          0,
        ),
        totalCost: items.reduce(
          (sum, item) => sum + Number(item.total_cost ?? 0),
          0,
        ),
        totalSale: items.reduce(
          (sum, item) => sum + Number(item.total_sale ?? 0),
          0,
        ),
        totalProfit: items.reduce(
          (sum, item) => sum + Number(item.gross_profit ?? 0),
          0,
        ),
        adminShare: items.reduce(
          (sum, item) => sum + Number(item.admin_profit_share ?? 0),
          0,
        ),
        userShare: items.reduce(
          (sum, item) => sum + Number(item.user_profit_share ?? 0),
          0,
        ),
        missingApplicationSs: items.filter(
          (item) => !hasDocument(item, "application_ss"),
        ).length,
        missingPortfolioSs: items.filter(
          (item) => !hasDocument(item, "portfolio_ss"),
        ).length,
        missingSaleSs: items.filter(
          (item) => item.sale_date && !hasDocument(item, "sale_ss"),
        ).length,
      });
    });

    return result.sort((a, b) => {
      const aKey = a.offering.stock_code ?? a.offering.company_name;
      const bKey = b.offering.stock_code ?? b.offering.company_name;

      return aKey.localeCompare(bKey, "tr");
    });
  }, [investments]);

  const totals = useMemo(() => {
    return {
      offeringCount: summaries.length,
      investmentCount: summaries.reduce(
        (sum, summary) => sum + summary.investmentCount,
        0,
      ),
      totalApplication: summaries.reduce(
        (sum, summary) => sum + summary.totalApplication,
        0,
      ),
      totalCost: summaries.reduce(
        (sum, summary) => sum + summary.totalCost,
        0,
      ),
      totalSale: summaries.reduce(
        (sum, summary) => sum + summary.totalSale,
        0,
      ),
      totalProfit: summaries.reduce(
        (sum, summary) => sum + summary.totalProfit,
        0,
      ),
      adminShare: summaries.reduce(
        (sum, summary) => sum + summary.adminShare,
        0,
      ),
      userShare: summaries.reduce((sum, summary) => sum + summary.userShare, 0),
      missingTotal: summaries.reduce(
        (sum, summary) =>
          sum +
          summary.missingApplicationSs +
          summary.missingPortfolioSs +
          summary.missingSaleSs,
        0,
      ),
    };
  }, [summaries]);

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
        `
        id,
        account_id,
        offering_id,
        application_date,
        application_amount,
        allocated_lots,
        purchase_price,
        total_cost,
        sale_date,
        sold_lots,
        sale_price,
        total_sale,
        gross_profit,
        admin_profit_share,
        user_profit_share,
        status,
        account:accounts!investments_account_id_fkey(
          id,
          user_id,
          bank_name,
          account_name,
          profile:profiles!accounts_user_id_fkey(
            full_name
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
      setMessage(`Özet verileri alınamadı: ${investmentError.message}`);
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
      (investmentData ?? []) as unknown as Investment[]
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

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-slate-300">
          Halka arz özetleri hazırlanıyor...
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
              Halka Arz Bazlı Özet
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Her halka arz için toplam başvuru, lot, maliyet, satış, kâr ve
              eksik görsel durumunu tek tabloda gör.
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
              href="/admin/offerings"
              className="rounded-xl border border-blue-500/40 px-5 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-400/10"
            >
              Halka Arzlar
            </a>

            <a
              href="/admin/cash"
              className="rounded-xl border border-purple-500/40 px-5 py-3 text-sm font-semibold text-purple-300 hover:bg-purple-400/10"
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

        <section className="grid gap-5 md:grid-cols-4 xl:grid-cols-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Halka Arz
            </p>
            <p className="mt-2 text-2xl font-bold">{totals.offeringCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              İşlem
            </p>
            <p className="mt-2 text-2xl font-bold">{totals.investmentCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Başvuru
            </p>
            <p className="mt-2 text-lg font-bold text-blue-300">
              {formatMoney(totals.totalApplication)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Maliyet
            </p>
            <p className="mt-2 text-lg font-bold text-violet-300">
              {formatMoney(totals.totalCost)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Satış
            </p>
            <p className="mt-2 text-lg font-bold text-emerald-300">
              {formatMoney(totals.totalSale)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Kâr</p>
            <p
              className={`mt-2 text-lg font-bold ${
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
            <p className="mt-2 text-lg font-bold text-amber-300">
              {formatMoney(totals.adminShare)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Eksik Görsel
            </p>
            <p className="mt-2 text-2xl font-bold text-rose-300">
              {totals.missingTotal}
            </p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-5">
            <h2 className="text-xl font-bold">Halka arz özet tablosu</h2>

            <p className="mt-2 text-sm text-slate-400">
              Her satır bir halka arzın toplam sonucunu gösterir.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1700px] text-left text-sm">
              <thead className="bg-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Halka Arz</th>
                  <th className="px-5 py-4 font-medium">Durum</th>
                  <th className="px-5 py-4 text-right font-medium">Hesap</th>
                  <th className="px-5 py-4 text-right font-medium">İşlem</th>
                  <th className="px-5 py-4 text-right font-medium">Kapalı</th>
                  <th className="px-5 py-4 text-right font-medium">Başvuru</th>
                  <th className="px-5 py-4 text-right font-medium">Lot</th>
                  <th className="px-5 py-4 text-right font-medium">Maliyet</th>
                  <th className="px-5 py-4 text-right font-medium">Satış</th>
                  <th className="px-5 py-4 text-right font-medium">Kâr</th>
                  <th className="px-5 py-4 text-right font-medium">
                    Admin Payı
                  </th>
                  <th className="px-5 py-4 text-right font-medium">
                    Kullanıcı Payı
                  </th>
                  <th className="px-5 py-4 text-right font-medium">
                    Eksik B
                  </th>
                  <th className="px-5 py-4 text-right font-medium">
                    Eksik P
                  </th>
                  <th className="px-5 py-4 text-right font-medium">
                    Eksik S
                  </th>
                  <th className="px-5 py-4 text-right font-medium">Detay</th>
                </tr>
              </thead>

              <tbody>
                {summaries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={16}
                      className="px-5 py-14 text-center text-slate-400"
                    >
                      Henüz özetlenecek yatırım kaydı yok.
                    </td>
                  </tr>
                ) : (
                  summaries.map((summary) => (
                    <tr
                      key={summary.offering.id}
                      className="border-t border-slate-800"
                    >
                      <td className="px-5 py-5">
                        <p className="font-bold text-emerald-300">
                          {summary.offering.stock_code ?? "-"}
                        </p>
                        <p className="mt-1 max-w-[260px] text-xs text-slate-500">
                          {summary.offering.company_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Fiyat: {formatMoney(summary.offering.offering_price)}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            offeringStatusStyles[summary.offering.status]
                          }`}
                        >
                          {offeringStatusLabels[summary.offering.status]}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-right font-semibold">
                        {summary.uniqueAccountCount}
                      </td>

                      <td className="px-5 py-5 text-right font-semibold">
                        {summary.investmentCount}
                      </td>

                      <td className="px-5 py-5 text-right font-semibold text-slate-300">
                        {summary.closedCount}
                      </td>

                      <td className="px-5 py-5 text-right font-semibold text-blue-300">
                        {formatMoney(summary.totalApplication)}
                      </td>

                      <td className="px-5 py-5 text-right">
                        {formatNumber(summary.totalLots)}
                      </td>

                      <td className="px-5 py-5 text-right text-violet-300">
                        {formatMoney(summary.totalCost)}
                      </td>

                      <td className="px-5 py-5 text-right text-emerald-300">
                        {formatMoney(summary.totalSale)}
                      </td>

                      <td
                        className={`px-5 py-5 text-right font-bold ${
                          summary.totalProfit >= 0
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {formatMoney(summary.totalProfit)}
                      </td>

                      <td className="px-5 py-5 text-right font-bold text-amber-300">
                        {formatMoney(summary.adminShare)}
                      </td>

                      <td className="px-5 py-5 text-right font-bold text-cyan-300">
                        {formatMoney(summary.userShare)}
                      </td>

                      <td className="px-5 py-5 text-right">
                        <span
                          className={
                            summary.missingApplicationSs > 0
                              ? "font-bold text-rose-300"
                              : "text-slate-500"
                          }
                        >
                          {summary.missingApplicationSs}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-right">
                        <span
                          className={
                            summary.missingPortfolioSs > 0
                              ? "font-bold text-rose-300"
                              : "text-slate-500"
                          }
                        >
                          {summary.missingPortfolioSs}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-right">
                        <span
                          className={
                            summary.missingSaleSs > 0
                              ? "font-bold text-rose-300"
                              : "text-slate-500"
                          }
                        >
                          {summary.missingSaleSs}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-right">
                        <a
                          href={`/admin/table?offering=${summary.offering.id}`}
                          className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10"
                        >
                          Genel Tabloda Aç
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}