"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "user";
  profit_share_rate: number;
};

type Account = {
  id: string;
  bank_name: string;
  account_name: string;
};

type Offering = {
  id: string;
  company_name: string;
  stock_code: string | null;
  application_start_date: string | null;
  application_end_date: string | null;
  offering_price: number | null;
  status: "upcoming" | "open" | "closed" | "listed" | "cancelled";
};

type DocumentRow = {
  id: string;
  document_type:
    | "application_ss"
    | "portfolio_ss"
    | "sale_ss"
    | "repayment_receipt";
  storage_path: string;
  created_at: string;
};

type Investment = {
  id: string;
  application_date: string | null;
  application_amount: number;
  allocated_lots: number | null;
  purchase_price: number | null;
  total_cost: number;
  leftover_after_allocation: number;
  sale_date: string | null;
  sold_lots: number | null;
  sale_price: number | null;
  total_sale: number;
  gross_profit: number;
  profit_share_rate: number;
  user_profit_share: number;
  admin_profit_share: number;
  status: "application" | "portfolio" | "sold" | "closed" | "cancelled";
  account?: Account | null;
  offering?: Offering | null;
  documents?: DocumentRow[];
};

type CashTransaction = {
  id: string;
  account_id: string;
  transaction_type: "admin_to_user" | "user_to_admin";
  amount: number;
  transaction_date: string;
  description: string | null;
  created_at: string;
  account?: Account | null;
  documents?: DocumentRow[];
};

const formatMoney = (value: number | null | undefined) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR").format(new Date(`${value}T12:00:00`));
};

const statusLabels = {
  application: "Başvuru oluşturuldu",
  portfolio: "Portföy bilgisi girildi",
  sold: "Satış bilgisi girildi",
  closed: "Kapandı",
  cancelled: "İptal",
};

const statusStyles = {
  application: "bg-blue-400/10 text-blue-300",
  portfolio: "bg-violet-400/10 text-violet-300",
  sold: "bg-emerald-400/10 text-emerald-300",
  closed: "bg-slate-700 text-slate-300",
  cancelled: "bg-rose-400/10 text-rose-300",
};

function parseMoneyInput(value: string) {
  const cleaned = value
    .replace("₺", "")
    .replace("TL", "")
    .replace("tl", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

function hasInvestmentDocument(
  investment: Investment,
  documentType: DocumentRow["document_type"],
) {
  return (
    investment.documents?.some(
      (document) => document.document_type === documentType,
    ) ?? false
  );
}

function getInvestmentMissingItems(investment: Investment) {
  const missingItems: string[] = [];

  if (investment.status === "closed" || investment.status === "cancelled") {
    return missingItems;
  }

  if (!hasInvestmentDocument(investment, "application_ss")) {
    missingItems.push("Başvuru SS yükle");
  }

  if (!investment.allocated_lots || !investment.purchase_price) {
    missingItems.push("Gelen lot ve alış fiyatı gir");
  }

  if (
    investment.allocated_lots &&
    investment.purchase_price &&
    !hasInvestmentDocument(investment, "portfolio_ss")
  ) {
    missingItems.push("Portföy SS yükle");
  }

  if (investment.sale_date || investment.sold_lots || investment.sale_price) {
    if (
      !investment.sale_date ||
      !investment.sold_lots ||
      !investment.sale_price
    ) {
      missingItems.push("Satış tarihi, satılan lot ve satış fiyatı tamamla");
    }

    if (!hasInvestmentDocument(investment, "sale_ss")) {
      missingItems.push("Satış SS yükle");
    }
  }

  return missingItems;
}

function getInvestmentNextStep(investment: Investment) {
  if (investment.status === "closed") {
    return "Bu işlem admin tarafından kapatıldı.";
  }

  if (investment.status === "cancelled") {
    return "Bu işlem iptal edilmiş.";
  }

  const missingItems = getInvestmentMissingItems(investment);

  if (missingItems.length === 0) {
    return "Senden beklenen eksik görünmüyor. Admin kontrolünü bekleyebilirsin.";
  }

  return missingItems[0];
}

export default function MyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [accountId, setAccountId] = useState("");
  const [offeringId, setOfferingId] = useState("");
  const [applicationDate, setApplicationDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [applicationAmount, setApplicationAmount] = useState("");

  const [repaymentAccountId, setRepaymentAccountId] = useState("");
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentDate, setRepaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [repaymentDescription, setRepaymentDescription] = useState("");
  const [repaymentFile, setRepaymentFile] = useState<File | null>(null);
  const [isRepaymentSaving, setIsRepaymentSaving] = useState(false);

  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(
    null,
  );
  const [allocatedLots, setAllocatedLots] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [soldLots, setSoldLots] = useState("");
  const [salePrice, setSalePrice] = useState("");

  const [uploadingId, setUploadingId] = useState<string | null>(null);

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

    setProfile(profileData as Profile);

    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("id, bank_name, account_name")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (accountError) {
      setMessage(`Hesaplar alınamadı: ${accountError.message}`);
    } else {
      setAccounts((accountData ?? []) as Account[]);
    }

    const { data: offeringData, error: offeringError } = await supabase
      .from("offerings")
      .select(
        `
          id,
          company_name,
          stock_code,
          application_start_date,
          application_end_date,
          offering_price,
          status
        `,
      )
      .in("status", ["open", "upcoming"])
      .order("application_end_date", { ascending: true, nullsFirst: false });

    if (offeringError) {
      setMessage(`Halka arzlar alınamadı: ${offeringError.message}`);
    } else {
      setOfferings((offeringData ?? []) as Offering[]);
    }

    const { data: investmentData, error: investmentError } = await supabase
      .from("investments")
      .select(
        `
          id,
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
          account:accounts (
            id,
            bank_name,
            account_name
          ),
          offering:offerings (
            id,
            company_name,
            stock_code,
            application_start_date,
            application_end_date,
            offering_price,
            status
          ),
          documents:documents (
            id,
            document_type,
            storage_path,
            created_at
          )
        `,
      )
      .order("created_at", { ascending: false });

    if (investmentError) {
      setMessage(`İşlemler alınamadı: ${investmentError.message}`);
    } else {
      setInvestments((investmentData ?? []) as unknown as Investment[]);
    }

    const { data: cashData, error: cashError } = await supabase
      .from("cash_transactions")
      .select(
        `
          id,
          account_id,
          transaction_type,
          amount,
          transaction_date,
          description,
          created_at,
          account:accounts (
            id,
            bank_name,
            account_name
          ),
          documents:documents (
            id,
            document_type,
            storage_path,
            created_at
          )
        `,
      )
      .in("transaction_type", ["admin_to_user", "user_to_admin"])
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (cashError) {
      setMessage(`Geri ödeme kayıtları alınamadı: ${cashError.message}`);
    } else {
      setCashTransactions((cashData ?? []) as unknown as CashTransaction[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  const stats = useMemo(() => {
    const totalProfit = investments.reduce(
      (total, item) => total + Number(item.gross_profit ?? 0),
      0,
    );

    const userShare = investments.reduce(
      (total, item) => total + Number(item.user_profit_share ?? 0),
      0,
    );

    const totalSent = cashTransactions
      .filter((item) => item.transaction_type === "admin_to_user")
      .reduce((total, item) => total + Number(item.amount), 0);

    const totalReturned = cashTransactions
      .filter((item) => item.transaction_type === "user_to_admin")
      .reduce((total, item) => total + Number(item.amount), 0);

    const openMissingCount = investments.filter(
      (investment) =>
        investment.status !== "closed" &&
        investment.status !== "cancelled" &&
        getInvestmentMissingItems(investment).length > 0,
    ).length;

    return {
      total: investments.length,
      active: investments.filter(
        (item) => item.status !== "closed" && item.status !== "cancelled",
      ).length,
      totalProfit,
      userShare,
      totalSent,
      totalReturned,
      outsideMoney: totalSent - totalReturned,
      openMissingCount,
    };
  }, [cashTransactions, investments]);

  const repaymentTransactions = useMemo(
    () =>
      cashTransactions.filter(
        (transaction) => transaction.transaction_type === "user_to_admin",
      ),
    [cashTransactions],
  );

  function resetApplicationForm() {
    setAccountId("");
    setOfferingId("");
    setApplicationDate(new Date().toISOString().slice(0, 10));
    setApplicationAmount("");
  }

  function resetRepaymentForm() {
    setRepaymentAccountId("");
    setRepaymentAmount("");
    setRepaymentDate(new Date().toISOString().slice(0, 10));
    setRepaymentDescription("");
    setRepaymentFile(null);
  }

  async function handleCreateApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    const parsedAmount = parseMoneyInput(applicationAmount);

    if (!accountId || !offeringId) {
      setMessage("Hesap ve halka arz seçmelisin.");
      return;
    }

    if (!applicationDate || parsedAmount === null || parsedAmount <= 0) {
      setMessage("Başvuru tarihi ve geçerli başvuru tutarı gir.");
      return;
    }

    const { error } = await supabase.from("investments").insert({
      account_id: accountId,
      offering_id: offeringId,
      application_date: applicationDate,
      application_amount: parsedAmount,
      profit_share_rate: profile.profit_share_rate,
      status: "application",
    });

    if (error) {
      if (error.code === "23505") {
        setMessage("Bu hesapla bu halka arza zaten başvuru oluşturulmuş.");
        return;
      }

      setMessage(`Başvuru oluşturulamadı: ${error.message}`);
      return;
    }

    resetApplicationForm();
    setMessage("Başvuru oluşturuldu. Şimdi başvuru SS yükleyebilirsin.");
    await loadPage();
  }

  async function handleCreateRepayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    const parsedAmount = parseMoneyInput(repaymentAmount);

    if (!repaymentAccountId) {
      setMessage("Geri ödeme için hesap seçmelisin.");
      return;
    }

    if (parsedAmount === null || parsedAmount <= 0) {
      setMessage("Geçerli geri ödeme tutarı gir.");
      return;
    }

    if (!repaymentDate) {
      setMessage("Geri ödeme tarihi gir.");
      return;
    }

    if (!repaymentFile) {
      setMessage("Geri ödeme dekont görseli yüklemelisin.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(repaymentFile.type)) {
      setMessage(
        "Dekont için sadece JPG, PNG veya WebP görsel yükleyebilirsin.",
      );
      return;
    }

    if (repaymentFile.size > 8 * 1024 * 1024) {
      setMessage("Dekont görseli en fazla 8 MB olabilir.");
      return;
    }

    setIsRepaymentSaving(true);
    setMessage("");

    const { data: cashData, error: cashError } = await supabase
      .from("cash_transactions")
      .insert({
        account_id: repaymentAccountId,
        transaction_type: "user_to_admin",
        amount: parsedAmount,
        transaction_date: repaymentDate,
        description: repaymentDescription.trim() || null,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (cashError || !cashData) {
      setIsRepaymentSaving(false);
      setMessage(`Geri ödeme kaydedilemedi: ${cashError?.message}`);
      return;
    }

    const extension =
      repaymentFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `cash/${cashData.id}/repayment_receipt-${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, repaymentFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setIsRepaymentSaving(false);
      setMessage(
        `Geri ödeme kaydedildi ama dekont yüklenemedi: ${uploadError.message}`,
      );
      return;
    }

    const { error: documentError } = await supabase.from("documents").insert({
      cash_transaction_id: cashData.id,
      document_type: "repayment_receipt",
      storage_path: storagePath,
      uploaded_by: profile.id,
    });

    setIsRepaymentSaving(false);

    if (documentError) {
      setMessage(
        `Dekont yüklendi ama kayıt oluşturulamadı: ${documentError.message}`,
      );
      return;
    }

    resetRepaymentForm();
    setMessage("Geri ödeme ve dekont başarıyla bildirildi.");
    await loadPage();
  }

  function openEdit(investment: Investment) {
    if (investment.status === "closed") {
      setMessage("Bu işlem admin tarafından kapatılmış. Düzenleme yapılamaz.");
      return;
    }

    if (investment.status === "cancelled") {
      setMessage("Bu işlem iptal edilmiş. Düzenleme yapılamaz.");
      return;
    }

    setEditingInvestmentId(investment.id);
    setAllocatedLots(
      investment.allocated_lots === null
        ? ""
        : String(investment.allocated_lots),
    );
    setPurchasePrice(
      investment.purchase_price === null
        ? ""
        : String(investment.purchase_price),
    );
    setSaleDate(investment.sale_date ?? "");
    setSoldLots(
      investment.sold_lots === null ? "" : String(investment.sold_lots),
    );
    setSalePrice(
      investment.sale_price === null ? "" : String(investment.sale_price),
    );
    setMessage("");
  }

  function closeEdit() {
    setEditingInvestmentId(null);
    setAllocatedLots("");
    setPurchasePrice("");
    setSaleDate("");
    setSoldLots("");
    setSalePrice("");
  }

  async function handleSaveInvestmentDetails(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingInvestmentId) return;

    const currentInvestment = investments.find(
      (investment) => investment.id === editingInvestmentId,
    );

    if (
      currentInvestment?.status === "closed" ||
      currentInvestment?.status === "cancelled"
    ) {
      setMessage("Kapalı veya iptal işlem düzenlenemez.");
      return;
    }

    const lots = allocatedLots ? parseMoneyInput(allocatedLots) : null;
    const price = purchasePrice ? parseMoneyInput(purchasePrice) : null;
    const saleLots = soldLots ? parseMoneyInput(soldLots) : null;
    const saleUnitPrice = salePrice ? parseMoneyInput(salePrice) : null;

    if (lots !== null && (!Number.isFinite(lots) || lots < 0)) {
      setMessage("Lot bilgisi geçersiz.");
      return;
    }

    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      setMessage("Alış fiyatı geçersiz.");
      return;
    }

    if (saleDate && (!saleLots || !saleUnitPrice)) {
      setMessage(
        "Satış tarihi girildiğinde satılan lot ve satış fiyatı da girilmeli.",
      );
      return;
    }

    if (!saleDate && (saleLots || saleUnitPrice)) {
      setMessage(
        "Satış lotu veya satış fiyatı girildiğinde satış tarihi de girilmeli.",
      );
      return;
    }

    const nextStatus = saleDate
      ? "sold"
      : lots && price
        ? "portfolio"
        : "application";

    const { error } = await supabase
      .from("investments")
      .update({
        allocated_lots: lots,
        purchase_price: price,
        sale_date: saleDate || null,
        sold_lots: saleLots,
        sale_price: saleUnitPrice,
        status: nextStatus,
      })
      .eq("id", editingInvestmentId);

    if (error) {
      setMessage(`Bilgiler kaydedilemedi: ${error.message}`);
      return;
    }

    closeEdit();
    setMessage("İşlem bilgileri kaydedildi.");
    await loadPage();
  }

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>,
    investment: Investment,
    documentType: "application_ss" | "portfolio_ss" | "sale_ss",
  ) {
    const file = event.target.files?.[0];

    if (!file || !profile) return;

    if (investment.status === "closed" || investment.status === "cancelled") {
      setMessage("Kapalı veya iptal işlem için görsel yüklenemez.");
      event.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Sadece JPG, PNG veya WebP görsel yükleyebilirsin.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setMessage("Görsel en fazla 8 MB olabilir.");
      event.target.value = "";
      return;
    }

    setUploadingId(`${investment.id}-${documentType}`);
    setMessage("");

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `investments/${investment.id}/${documentType}-${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setUploadingId(null);
      setMessage(`Görsel yüklenemedi: ${uploadError.message}`);
      event.target.value = "";
      return;
    }

    const { error: documentError } = await supabase.from("documents").insert({
      investment_id: investment.id,
      document_type: documentType,
      storage_path: storagePath,
      uploaded_by: profile.id,
    });

    setUploadingId(null);
    event.target.value = "";

    if (documentError) {
      setMessage(
        `Görsel yüklendi ama kayıt oluşturulamadı: ${documentError.message}`,
      );
      return;
    }

    setMessage("Görsel başarıyla yüklendi.");
    await loadPage();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-slate-300">
          Kullanıcı paneli hazırlanıyor...
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
              İşlemlerim
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Başvuru oluştur, SS yükle, lot/satış bilgisi gir ve geri ödeme
              dekontunu bildir.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Kullanıcı: {profile?.full_name} · Kâr payın: %
              {profile?.profit_share_rate}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800"
            >
              Ana sayfa
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Toplam İşlem</p>
            <p className="mt-3 text-3xl font-bold">{stats.total}</p>
          </article>

          <article className="rounded-2xl border border-blue-500/20 bg-blue-400/5 p-5">
            <p className="text-sm text-blue-100/70">Aktif İşlem</p>
            <p className="mt-3 text-3xl font-bold text-blue-300">
              {stats.active}
            </p>
          </article>

          <article className="rounded-2xl border border-amber-500/20 bg-amber-400/5 p-5">
            <p className="text-sm text-amber-100/70">Eksik İşlem</p>
            <p className="mt-3 text-3xl font-bold text-amber-300">
              {stats.openMissingCount}
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-500/20 bg-emerald-400/5 p-5">
            <p className="text-sm text-emerald-100/70">Bildirdiğin Geri Ödeme</p>
            <p className="mt-3 text-3xl font-bold text-emerald-300">
              {formatMoney(stats.totalReturned)}
            </p>
          </article>

          <article className="rounded-2xl border border-sky-500/20 bg-sky-400/5 p-5">
            <p className="text-sm text-sky-100/70">Kâr Payın</p>
            <p className="mt-3 text-3xl font-bold text-sky-300">
              {formatMoney(stats.userShare)}
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-bold">Yeni başvuru oluştur</h2>

          <p className="mt-2 text-sm text-slate-400">
            Açık veya yaklaşan halka arzı seçip başvuru tutarını gir.
          </p>

          <form
            onSubmit={handleCreateApplication}
            className="mt-6 grid gap-4 lg:grid-cols-5"
          >
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Hesap</span>

              <select
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
              >
                <option value="">Hesap seç</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} — {account.account_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm lg:col-span-2">
              <span className="font-medium">Halka arz</span>

              <select
                value={offeringId}
                onChange={(event) => setOfferingId(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
              >
                <option value="">Halka arz seç</option>

                {offerings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.company_name}
                    {offering.stock_code ? ` (${offering.stock_code})` : ""}
                    {offering.offering_price
                      ? ` — ${formatMoney(offering.offering_price)}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Başvuru tarihi</span>

              <input
                type="date"
                value={applicationDate}
                onChange={(event) => setApplicationDate(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Tutar</span>

              <input
                value={applicationAmount}
                onChange={(event) => setApplicationAmount(event.target.value)}
                placeholder="Örn. 5000 veya 5.000,50"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 lg:col-span-5"
            >
              Başvuruyu Oluştur
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-400/5 p-5">
          <h2 className="text-xl font-bold">Geri ödeme / dekont bildir</h2>

          <p className="mt-2 text-sm text-emerald-100/70">
            Sana para geri gönderdiğinde tutarı girip dekont görselini yükle.
          </p>

          <form
            onSubmit={handleCreateRepayment}
            className="mt-6 grid gap-4 lg:grid-cols-5"
          >
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Hesap</span>

              <select
                value={repaymentAccountId}
                onChange={(event) => setRepaymentAccountId(event.target.value)}
                className="rounded-xl border border-emerald-500/30 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
              >
                <option value="">Hesap seç</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} — {account.account_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Tutar</span>

              <input
                value={repaymentAmount}
                onChange={(event) => setRepaymentAmount(event.target.value)}
                placeholder="Örn. 2960"
                className="rounded-xl border border-emerald-500/30 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Tarih</span>

              <input
                type="date"
                value={repaymentDate}
                onChange={(event) => setRepaymentDate(event.target.value)}
                className="rounded-xl border border-emerald-500/30 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2 text-sm lg:col-span-2">
              <span className="font-medium">Dekont görseli</span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setRepaymentFile(event.target.files?.[0] ?? null)
                }
                className="rounded-xl border border-emerald-500/30 bg-slate-950 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
              />
            </label>

            <label className="grid gap-2 text-sm lg:col-span-5">
              <span className="font-medium">Açıklama</span>

              <textarea
                value={repaymentDescription}
                onChange={(event) =>
                  setRepaymentDescription(event.target.value)
                }
                placeholder="Örn. SARAE satış sonrası geri ödeme"
                rows={3}
                className="resize-none rounded-xl border border-emerald-500/30 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <button
              type="submit"
              disabled={isRepaymentSaving}
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-5"
            >
              {isRepaymentSaving
                ? "Kaydediliyor..."
                : "Geri Ödeme ve Dekontu Bildir"}
            </button>
          </form>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-5">
            <h2 className="text-xl font-bold">Geri ödeme geçmişim</h2>

            <p className="mt-2 text-sm text-slate-400">
              Sana ait hesaplardan bildirilen geri ödeme ve dekont kayıtları.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Tarih</th>
                  <th className="px-5 py-4 font-medium">Hesap</th>
                  <th className="px-5 py-4 text-right font-medium">Tutar</th>
                  <th className="px-5 py-4 font-medium">Dekont</th>
                  <th className="px-5 py-4 font-medium">Açıklama</th>
                </tr>
              </thead>

              <tbody>
                {repaymentTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-14 text-center text-slate-400"
                    >
                      Henüz geri ödeme bildirimi yapmadın.
                    </td>
                  </tr>
                ) : (
                  repaymentTransactions.map((transaction) => {
                    const hasReceipt = transaction.documents?.some(
                      (document) =>
                        document.document_type === "repayment_receipt",
                    );

                    return (
                      <tr
                        key={transaction.id}
                        className="border-t border-slate-800"
                      >
                        <td className="px-5 py-5">
                          {formatDate(transaction.transaction_date)}
                        </td>

                        <td className="px-5 py-5">
                          <p>{transaction.account?.bank_name ?? "-"}</p>

                          <p className="mt-1 text-xs text-slate-500">
                            {transaction.account?.account_name ?? "-"}
                          </p>
                        </td>

                        <td className="px-5 py-5 text-right font-bold text-emerald-300">
                          {formatMoney(transaction.amount)}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`rounded-xl px-4 py-2 text-xs font-bold ${
                              hasReceipt
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            {hasReceipt ? "Yüklendi" : "Yok"}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-slate-400">
                          {transaction.description ?? "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-5">
            <h2 className="text-xl font-bold">Başvurularım</h2>
            <p className="mt-2 text-sm text-slate-400">
              SS yükleme ve lot/satış bilgisi girme işlemleri buradan yapılır.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {investments.length === 0 ? (
              <div className="px-5 py-14 text-center text-slate-400">
                Henüz başvuru oluşturmadın.
              </div>
            ) : (
              investments.map((investment) => {
                const documents = new Set(
                  investment.documents?.map((item) => item.document_type) ?? [],
                );

                const isEditing = editingInvestmentId === investment.id;
                const missingItems = getInvestmentMissingItems(investment);
                const nextStep = getInvestmentNextStep(investment);
                const isClosed = investment.status === "closed";
                const isCancelled = investment.status === "cancelled";
                const isLocked = isClosed || isCancelled;

                return (
                  <article
                    key={investment.id}
                    className={`p-5 ${isClosed ? "opacity-75" : ""}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="w-full">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold">
                            {investment.offering?.company_name ?? "-"}
                          </h3>

                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                            {investment.offering?.stock_code ?? "-"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[investment.status]
                            }`}
                          >
                            {statusLabels[investment.status]}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          {investment.account?.bank_name} ·{" "}
                          {investment.account?.account_name}
                        </p>

                        <div
                          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                            isLocked
                              ? "border-slate-700 bg-slate-950 text-slate-400"
                              : missingItems.length === 0
                                ? "border-emerald-500/30 bg-emerald-400/10 text-emerald-200"
                                : "border-amber-500/30 bg-amber-400/10 text-amber-100"
                          }`}
                        >
                          <p className="font-semibold">
                            Sıradaki işlem: {nextStep}
                          </p>

                          {missingItems.length > 0 && !isLocked && (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                              {missingItems.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          isEditing ? closeEdit() : openEdit(investment)
                        }
                        disabled={isLocked}
                        className="w-fit shrink-0 rounded-xl border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500 disabled:hover:bg-transparent"
                      >
                        {isLocked
                          ? isClosed
                            ? "İşlem kapalı"
                            : "İşlem iptal"
                          : isEditing
                            ? "Düzenlemeyi kapat"
                            : "Lot / satış bilgisi gir"}
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <div className="rounded-xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">Başvuru</p>
                        <p className="mt-2 font-semibold">
                          {formatMoney(investment.application_amount)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(investment.application_date)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">Lot / Alış</p>
                        <p className="mt-2 font-semibold">
                          {investment.allocated_lots ?? "-"} lot
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {investment.purchase_price
                            ? formatMoney(investment.purchase_price)
                            : "-"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">Maliyet</p>
                        <p className="mt-2 font-semibold text-violet-300">
                          {formatMoney(investment.total_cost)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Kalan:{" "}
                          {formatMoney(investment.leftover_after_allocation)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">Satış</p>
                        <p className="mt-2 font-semibold text-amber-300">
                          {investment.sale_price
                            ? formatMoney(investment.sale_price)
                            : "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(investment.sale_date)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">Kâr / Payın</p>
                        <p
                          className={`mt-2 font-bold ${
                            Number(investment.gross_profit) >= 0
                              ? "text-emerald-300"
                              : "text-rose-300"
                          }`}
                        >
                          {formatMoney(investment.gross_profit)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Payın: {formatMoney(investment.user_profit_share)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-3">
                      <label
                        className={`rounded-xl border border-slate-700 bg-slate-950 p-4 ${
                          isLocked
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:border-emerald-500/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">Başvuru SS</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {documents.has("application_ss")
                                ? "Yüklendi"
                                : "Başvuru ekran görüntüsü"}
                            </p>
                          </div>

                          <span className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold">
                            {uploadingId === `${investment.id}-application_ss`
                              ? "Yükleniyor"
                              : documents.has("application_ss")
                                ? "✓"
                                : "Yükle"}
                          </span>
                        </div>

                        <input
                          type="file"
                          disabled={isLocked}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(event) =>
                            handleUpload(event, investment, "application_ss")
                          }
                        />
                      </label>

                      <label
                        className={`rounded-xl border border-slate-700 bg-slate-950 p-4 ${
                          isLocked
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:border-violet-500/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">Portföy SS</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {documents.has("portfolio_ss")
                                ? "Yüklendi"
                                : "Lotların göründüğü ekran"}
                            </p>
                          </div>

                          <span className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold">
                            {uploadingId === `${investment.id}-portfolio_ss`
                              ? "Yükleniyor"
                              : documents.has("portfolio_ss")
                                ? "✓"
                                : "Yükle"}
                          </span>
                        </div>

                        <input
                          type="file"
                          disabled={isLocked}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(event) =>
                            handleUpload(event, investment, "portfolio_ss")
                          }
                        />
                      </label>

                      <label
                        className={`rounded-xl border border-slate-700 bg-slate-950 p-4 ${
                          isLocked
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:border-amber-500/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">Satış SS</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {documents.has("sale_ss")
                                ? "Yüklendi"
                                : "Satış ekran görüntüsü"}
                            </p>
                          </div>

                          <span className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold">
                            {uploadingId === `${investment.id}-sale_ss`
                              ? "Yükleniyor"
                              : documents.has("sale_ss")
                                ? "✓"
                                : "Yükle"}
                          </span>
                        </div>

                        <input
                          type="file"
                          disabled={isLocked}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(event) =>
                            handleUpload(event, investment, "sale_ss")
                          }
                        />
                      </label>
                    </div>

                    {isEditing && !isLocked && (
                      <form
                        onSubmit={handleSaveInvestmentDetails}
                        className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4"
                      >
                        <h4 className="font-semibold">
                          Lot ve satış bilgileri
                        </h4>

                        <p className="mt-1 text-xs text-slate-500">
                          Satış yaptıysan satış tarihi, satılan lot ve satış
                          fiyatını birlikte gir.
                        </p>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                          <label className="grid gap-2 text-sm">
                            <span>Gelen lot</span>
                            <input
                              value={allocatedLots}
                              onChange={(event) =>
                                setAllocatedLots(event.target.value)
                              }
                              placeholder="Örn. 36"
                              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
                            />
                          </label>

                          <label className="grid gap-2 text-sm">
                            <span>Alış fiyatı</span>
                            <input
                              value={purchasePrice}
                              onChange={(event) =>
                                setPurchasePrice(event.target.value)
                              }
                              placeholder="Örn. 20,90"
                              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
                            />
                          </label>

                          <label className="grid gap-2 text-sm">
                            <span>Satış tarihi</span>
                            <input
                              type="date"
                              value={saleDate}
                              onChange={(event) =>
                                setSaleDate(event.target.value)
                              }
                              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
                            />
                          </label>

                          <label className="grid gap-2 text-sm">
                            <span>Satılan lot</span>
                            <input
                              value={soldLots}
                              onChange={(event) =>
                                setSoldLots(event.target.value)
                              }
                              placeholder="Örn. 36"
                              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
                            />
                          </label>

                          <label className="grid gap-2 text-sm">
                            <span>Satış fiyatı</span>
                            <input
                              value={salePrice}
                              onChange={(event) =>
                                setSalePrice(event.target.value)
                              }
                              placeholder="Örn. 25,50"
                              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
                            />
                          </label>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="submit"
                            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
                          >
                            Bilgileri Kaydet
                          </button>
                        </div>
                      </form>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}