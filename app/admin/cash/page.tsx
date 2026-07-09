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
  is_active: boolean;
  profile?: {
    full_name: string;
  } | null;
};

type CashTransaction = {
  id: string;
  account_id: string;
  transaction_type: "admin_to_user" | "user_to_admin";
  amount: number;
  transaction_date: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

type DocumentRow = {
  id: string;
  cash_transaction_id: string | null;
  document_type: "repayment_receipt";
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
};

type CashTransactionView = CashTransaction & {
  account: Account | null;
  documents: DocumentRow[];
};

type CashForm = {
  account_id: string;
  transaction_type: "admin_to_user" | "user_to_admin";
  amount: string;
  transaction_date: string;
  description: string;
};

const emptyForm: CashForm = {
  account_id: "",
  transaction_type: "admin_to_user",
  amount: "",
  transaction_date: new Date().toISOString().slice(0, 10),
  description: "",
};

const transactionLabels = {
  admin_to_user: "Admin → Kullanıcı",
  user_to_admin: "Kullanıcı → Admin",
};

const transactionStyles = {
  admin_to_user: "bg-blue-400/10 text-blue-300",
  user_to_admin: "bg-emerald-400/10 text-emerald-300",
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR").format(new Date(`${value}T12:00:00`));
}

export default function AdminCashPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<CashTransactionView[]>([]);
  const [form, setForm] = useState<CashForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const totals = useMemo(() => {
    const sent = transactions
      .filter((transaction) => transaction.transaction_type === "admin_to_user")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const returned = transactions
      .filter((transaction) => transaction.transaction_type === "user_to_admin")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return {
      sent,
      returned,
      netOutside: sent - returned,
    };
  }, [transactions]);

  const accountSummaries = useMemo(() => {
    return accounts.map((account) => {
      const relatedTransactions = transactions.filter(
        (transaction) => transaction.account_id === account.id,
      );

      const sent = relatedTransactions
        .filter((transaction) => transaction.transaction_type === "admin_to_user")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

      const returned = relatedTransactions
        .filter((transaction) => transaction.transaction_type === "user_to_admin")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

      return {
        account,
        sent,
        returned,
        netOutside: sent - returned,
      };
    });
  }, [accounts, transactions]);

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

    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select(
        "id, user_id, bank_name, account_name, is_active, profile:profiles!accounts_user_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false });

    if (accountError) {
      setMessage(`Hesaplar alınamadı: ${accountError.message}`);
      setAccounts([]);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const normalizedAccounts = (accountData ?? []) as unknown as Account[];
    setAccounts(normalizedAccounts);

    const { data: cashData, error: cashError } = await supabase
      .from("cash_transactions")
      .select(
        "id, account_id, transaction_type, amount, transaction_date, description, created_by, created_at",
      )
      .in("transaction_type", ["admin_to_user", "user_to_admin"])
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (cashError) {
      setMessage(`Para hareketleri alınamadı: ${cashError.message}`);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const { data: documentData, error: documentError } = await supabase
      .from("documents")
      .select(
        "id, cash_transaction_id, document_type, storage_path, uploaded_by, created_at",
      )
      .not("cash_transaction_id", "is", null)
      .eq("document_type", "repayment_receipt");

    if (documentError) {
      setMessage(`Dekont kayıtları alınamadı: ${documentError.message}`);
    }

    const documents = (documentData ?? []) as DocumentRow[];
    const accountMap = new Map(
      normalizedAccounts.map((account) => [account.id, account]),
    );

    const transactionViews = ((cashData ?? []) as CashTransaction[]).map(
      (transaction) => ({
        ...transaction,
        account: accountMap.get(transaction.account_id) ?? null,
        documents: documents.filter(
          (document) => document.cash_transaction_id === transaction.id,
        ),
      }),
    );

    setTransactions(transactionViews);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  function updateForm<K extends keyof CashForm>(key: K, value: CashForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
  }

  function startEdit(transaction: CashTransactionView) {
    setEditingId(transaction.id);
    setForm({
      account_id: transaction.account_id,
      transaction_type: transaction.transaction_type,
      amount: String(transaction.amount).replace(".", ","),
      transaction_date: transaction.transaction_date,
      description: transaction.description ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSaveTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    if (!form.account_id) {
      setMessage("Hesap seçmelisin.");
      return;
    }

    const amount = parseMoneyInput(form.amount);

    if (amount === null || amount <= 0) {
      setMessage("Tutar geçerli değil. Örnek: 5000 veya 5.000,50");
      return;
    }

    if (!form.transaction_date) {
      setMessage("İşlem tarihi seçmelisin.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const payload = {
      account_id: form.account_id,
      transaction_type: form.transaction_type,
      amount,
      transaction_date: form.transaction_date,
      description: form.description.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("cash_transactions")
        .update(payload)
        .eq("id", editingId);

      setIsSaving(false);

      if (error) {
        setMessage(`Para hareketi güncellenemedi: ${error.message}`);
        return;
      }

      setMessage("Para hareketi güncellendi.");
    } else {
      const { error } = await supabase.from("cash_transactions").insert({
        ...payload,
        created_by: profile.id,
      });

      setIsSaving(false);

      if (error) {
        setMessage(`Para hareketi eklenemedi: ${error.message}`);
        return;
      }

      setMessage("Para hareketi eklendi.");
    }

    setForm(emptyForm);
    setEditingId(null);
    await loadPage();
  }

  async function handleDeleteTransaction(transaction: CashTransactionView) {
    const confirmed = window.confirm(
      `${transactionLabels[transaction.transaction_type]} - ${formatMoney(
        Number(transaction.amount),
      )} kaydını silmek istediğine emin misin?\n\nBu işlem varsa bağlı dekont kaydını da kaldırır.`,
    );

    if (!confirmed) return;

    setMessage("");

    const storagePaths = transaction.documents.map(
      (document) => document.storage_path,
    );

    if (storagePaths.length > 0) {
      await supabase.storage.from("documents").remove(storagePaths);

      const { error: documentDeleteError } = await supabase
        .from("documents")
        .delete()
        .eq("cash_transaction_id", transaction.id);

      if (documentDeleteError) {
        setMessage(`Bağlı dekont kaydı silinemedi: ${documentDeleteError.message}`);
        return;
      }
    }

    const { error } = await supabase
      .from("cash_transactions")
      .delete()
      .eq("id", transaction.id);

    if (error) {
      setMessage(`Para hareketi silinemedi: ${error.message}`);
      return;
    }

    setMessage("Para hareketi silindi.");
    await loadPage();
  }

  async function openReceipt(document: DocumentRow) {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.storage_path, 120);

    if (error || !data) {
      setMessage(`Dekont açılamadı: ${error?.message ?? "Bilinmeyen hata"}`);
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
          Para hareketleri hazırlanıyor...
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
              Para Hareketleri
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Adminin gönderdiği para ve kullanıcıdan dönen para kayıtlarını
              yönet.
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
              href="/admin/offerings"
              className="rounded-xl border border-blue-500/40 px-5 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-400/10"
            >
              Halka Arzlar
            </a>

            <a
              href="/admin/table"
              className="rounded-xl border border-emerald-500/40 px-5 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10"
            >
              Genel Tablo
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

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Gönderilen
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-300">
              {formatMoney(totals.sent)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Geri Dönen
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">
              {formatMoney(totals.returned)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Dışarıdaki Net Para
            </p>
            <p className="mt-2 text-2xl font-bold text-rose-300">
              {formatMoney(totals.netOutside)}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "Para hareketini düzenle" : "Yeni para hareketi ekle"}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Yanlış girilen kayıtları aşağıdaki listeden düzenleyebilir veya
                silebilirsin.
              </p>
            </div>

            {editingId && (
              <button
                onClick={resetForm}
                className="w-fit rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
              >
                Düzenlemeyi iptal et
              </button>
            )}
          </div>

          <form
            onSubmit={handleSaveTransaction}
            className="grid gap-4 lg:grid-cols-6"
          >
            <label className="lg:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hesap
              </span>

              <select
                value={form.account_id}
                onChange={(event) => updateForm("account_id", event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Hesap seç</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.profile?.full_name ?? "Kullanıcı"} -{" "}
                    {account.bank_name} / {account.account_name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                İşlem türü
              </span>

              <select
                value={form.transaction_type}
                onChange={(event) =>
                  updateForm(
                    "transaction_type",
                    event.target.value as CashForm["transaction_type"],
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="admin_to_user">Admin → Kullanıcı</option>
                <option value="user_to_admin">Kullanıcı → Admin</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tutar
              </span>

              <input
                value={form.amount}
                onChange={(event) => updateForm("amount", event.target.value)}
                placeholder="5000"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tarih
              </span>

              <input
                type="date"
                value={form.transaction_date}
                onChange={(event) =>
                  updateForm("transaction_date", event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Açıklama
              </span>

              <input
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Örn: SARAE başvuru parası"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            <div className="flex items-end lg:col-span-6">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Kaydediliyor..."
                  : editingId
                    ? "Güncelle"
                    : "Para hareketi ekle"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-5">
            <h2 className="text-xl font-bold">Hesap bazlı özet</h2>
            <p className="mt-2 text-sm text-slate-400">
              Her hesap için gönderilen, dönen ve dışarıda kalan net parayı
              gösterir.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Hesap</th>
                  <th className="px-5 py-4 text-right font-medium">Gönderilen</th>
                  <th className="px-5 py-4 text-right font-medium">Dönen</th>
                  <th className="px-5 py-4 text-right font-medium">
                    Net Dışarıda
                  </th>
                </tr>
              </thead>

              <tbody>
                {accountSummaries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Henüz hesap yok.
                    </td>
                  </tr>
                ) : (
                  accountSummaries.map((summary) => (
                    <tr
                      key={summary.account.id}
                      className="border-t border-slate-800"
                    >
                      <td className="px-5 py-5">
                        <p className="font-semibold text-slate-100">
                          {summary.account.profile?.full_name ?? "Kullanıcı"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {summary.account.bank_name} /{" "}
                          {summary.account.account_name}
                        </p>
                      </td>

                      <td className="px-5 py-5 text-right text-blue-300">
                        {formatMoney(summary.sent)}
                      </td>

                      <td className="px-5 py-5 text-right text-emerald-300">
                        {formatMoney(summary.returned)}
                      </td>

                      <td className="px-5 py-5 text-right font-bold text-rose-300">
                        {formatMoney(summary.netOutside)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-5">
            <h2 className="text-xl font-bold">Tüm para hareketleri</h2>
            <p className="mt-2 text-sm text-slate-400">
              Kayıtları buradan düzenleyebilir, silebilir ve varsa dekontunu
              açabilirsin.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Tarih</th>
                  <th className="px-5 py-4 font-medium">Hesap</th>
                  <th className="px-5 py-4 font-medium">Tür</th>
                  <th className="px-5 py-4 text-right font-medium">Tutar</th>
                  <th className="px-5 py-4 font-medium">Açıklama</th>
                  <th className="px-5 py-4 font-medium">Dekont</th>
                  <th className="px-5 py-4 text-right font-medium">İşlem</th>
                </tr>
              </thead>

              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center text-slate-400"
                    >
                      Henüz para hareketi yok.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-t border-slate-800"
                    >
                      <td className="px-5 py-5">
                        {formatDate(transaction.transaction_date)}
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-semibold text-slate-100">
                          {transaction.account?.profile?.full_name ??
                            "Kullanıcı"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {transaction.account?.bank_name ?? "-"} /{" "}
                          {transaction.account?.account_name ?? "-"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            transactionStyles[transaction.transaction_type]
                          }`}
                        >
                          {transactionLabels[transaction.transaction_type]}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-right font-bold">
                        {formatMoney(Number(transaction.amount))}
                      </td>

                      <td className="px-5 py-5 text-slate-300">
                        {transaction.description ?? "-"}
                      </td>

                      <td className="px-5 py-5">
                        {transaction.documents.length === 0 ? (
                          <span className="text-xs text-slate-500">Yok</span>
                        ) : (
                          <button
                            onClick={() => openReceipt(transaction.documents[0])}
                            className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10"
                          >
                            Dekont Aç
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(transaction)}
                            className="rounded-lg border border-blue-500/40 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-400/10"
                          >
                            Düzenle
                          </button>

                          <button
                            onClick={() => handleDeleteTransaction(transaction)}
                            className="rounded-lg border border-rose-500/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-400/10"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
              <h2 className="font-bold">Dekont Önizleme</h2>

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
                alt="Dekont"
                className="mx-auto max-h-[75vh] max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}