"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "user";
};

type Offering = {
  id: string;
  company_name: string;
  stock_code: string | null;
  application_start_date: string | null;
  application_end_date: string | null;
  offering_price: number | null;
  status: "upcoming" | "open" | "closed" | "listed" | "cancelled";
  created_at: string;
};

type OfferingForm = {
  company_name: string;
  stock_code: string;
  application_start_date: string;
  application_end_date: string;
  offering_price: string;
  status: "upcoming" | "open" | "closed" | "listed" | "cancelled";
};

const emptyForm: OfferingForm = {
  company_name: "",
  stock_code: "",
  application_start_date: "",
  application_end_date: "",
  offering_price: "",
  status: "open",
};

const statusLabels = {
  upcoming: "Yaklaşan",
  open: "Başvuru Açık",
  closed: "Başvuru Kapalı",
  listed: "İşlemde",
  cancelled: "İptal",
};

const statusStyles = {
  upcoming: "bg-blue-400/10 text-blue-300",
  open: "bg-emerald-400/10 text-emerald-300",
  closed: "bg-amber-400/10 text-amber-300",
  listed: "bg-purple-400/10 text-purple-300",
  cancelled: "bg-rose-400/10 text-rose-300",
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR").format(new Date(`${value}T12:00:00`));
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);
}

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

export default function AdminOfferingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [form, setForm] = useState<OfferingForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

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

    const { data: offeringData, error: offeringError } = await supabase
      .from("offerings")
      .select(
        "id, company_name, stock_code, application_start_date, application_end_date, offering_price, status, created_at",
      )
      .order("application_start_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (offeringError) {
      setMessage(`Halka arzlar alınamadı: ${offeringError.message}`);
      setOfferings([]);
    } else {
      setOfferings((offeringData ?? []) as Offering[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  function updateForm<K extends keyof OfferingForm>(
    key: K,
    value: OfferingForm[K],
  ) {
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

  function startEdit(offering: Offering) {
    setEditingId(offering.id);
    setForm({
      company_name: offering.company_name,
      stock_code: offering.stock_code ?? "",
      application_start_date: offering.application_start_date ?? "",
      application_end_date: offering.application_end_date ?? "",
      offering_price:
        offering.offering_price === null || offering.offering_price === undefined
          ? ""
          : String(offering.offering_price).replace(".", ","),
      status: offering.status,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSaveOffering(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    const companyName = form.company_name.trim();
    const stockCode = form.stock_code.trim().toUpperCase();

    if (!companyName) {
      setMessage("Şirket adı boş olamaz.");
      return;
    }

    const offeringPrice = form.offering_price
      ? parseMoneyInput(form.offering_price)
      : null;

    if (form.offering_price && offeringPrice === null) {
      setMessage("Halka arz fiyatı geçerli değil. Örnek: 70,00");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const payload = {
      company_name: companyName,
      stock_code: stockCode || null,
      application_start_date: form.application_start_date || null,
      application_end_date: form.application_end_date || null,
      offering_price: offeringPrice,
      status: form.status,
    };

    if (editingId) {
      const { error } = await supabase
        .from("offerings")
        .update(payload)
        .eq("id", editingId);

      setIsSaving(false);

      if (error) {
        setMessage(`Halka arz güncellenemedi: ${error.message}`);
        return;
      }

      setMessage("Halka arz güncellendi.");
    } else {
      const { error } = await supabase.from("offerings").insert({
        ...payload,
        created_by: profile.id,
      });

      setIsSaving(false);

      if (error) {
        setMessage(`Halka arz eklenemedi: ${error.message}`);
        return;
      }

      setMessage("Halka arz eklendi.");
    }

    setForm(emptyForm);
    setEditingId(null);
    await loadPage();
  }

  async function handleDeleteOffering(offering: Offering) {
    const confirmed = window.confirm(
      `${offering.company_name} kaydını silmek istediğine emin misin?\n\nBu halka arza bağlı başvuru varsa silme işlemi engellenebilir.`,
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase
      .from("offerings")
      .delete()
      .eq("id", offering.id);

    if (error) {
      setMessage(
        `Silinemedi: Bu halka arza bağlı başvuru/işlem olabilir. Önce bağlı kayıtları iptal etmen veya düzenlemen gerekir. Teknik hata: ${error.message}`,
      );
      return;
    }

    setMessage("Halka arz silindi.");
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
          Halka arz ekranı hazırlanıyor...
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
              Halka Arzlar
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Halka arzları manuel ekle, düzenle, durumunu güncelle veya sil.
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

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "Halka arzı düzenle" : "Yeni halka arz ekle"}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Kod ve fiyatı doğru girmen kullanıcı başvurularında işini
                kolaylaştırır.
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
            onSubmit={handleSaveOffering}
            className="grid gap-4 lg:grid-cols-6"
          >
            <label className="lg:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Şirket adı
              </span>
              <input
                value={form.company_name}
                onChange={(event) =>
                  updateForm("company_name", event.target.value)
                }
                placeholder="Örn: Şa-Ra Enerji İnşaat Tic. ve San. A.Ş."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Kod
              </span>
              <input
                value={form.stock_code}
                onChange={(event) =>
                  updateForm("stock_code", event.target.value.toUpperCase())
                }
                placeholder="SARAE"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm uppercase outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Başlangıç
              </span>
              <input
                type="date"
                value={form.application_start_date}
                onChange={(event) =>
                  updateForm("application_start_date", event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bitiş
              </span>
              <input
                type="date"
                value={form.application_end_date}
                onChange={(event) =>
                  updateForm("application_end_date", event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fiyat
              </span>
              <input
                value={form.offering_price}
                onChange={(event) =>
                  updateForm("offering_price", event.target.value)
                }
                placeholder="70,00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Durum
              </span>
              <select
                value={form.status}
                onChange={(event) =>
                  updateForm(
                    "status",
                    event.target.value as OfferingForm["status"],
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="upcoming">Yaklaşan</option>
                <option value="open">Başvuru Açık</option>
                <option value="closed">Başvuru Kapalı</option>
                <option value="listed">İşlemde</option>
                <option value="cancelled">İptal</option>
              </select>
            </label>

            <div className="flex items-end lg:col-span-5">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Kaydediliyor..."
                  : editingId
                    ? "Güncelle"
                    : "Halka arz ekle"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Toplam
            </p>
            <p className="mt-2 text-3xl font-bold">{offerings.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Açık
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">
              {offerings.filter((offering) => offering.status === "open").length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Yaklaşan
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-300">
              {
                offerings.filter((offering) => offering.status === "upcoming")
                  .length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              İşlemde
            </p>
            <p className="mt-2 text-3xl font-bold text-purple-300">
              {offerings.filter((offering) => offering.status === "listed").length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Kapalı
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-300">
              {
                offerings.filter((offering) => offering.status === "closed")
                  .length
              }
            </p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-5">
            <h2 className="text-xl font-bold">Kayıtlı halka arzlar</h2>
            <p className="mt-2 text-sm text-slate-400">
              Hatalı girilen kayıtları buradan düzenleyebilirsin. Bağlı başvuru
              varsa silme engellenebilir; bu normal.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Şirket</th>
                  <th className="px-5 py-4 font-medium">Kod</th>
                  <th className="px-5 py-4 font-medium">Başlangıç</th>
                  <th className="px-5 py-4 font-medium">Bitiş</th>
                  <th className="px-5 py-4 text-right font-medium">Fiyat</th>
                  <th className="px-5 py-4 font-medium">Durum</th>
                  <th className="px-5 py-4 text-right font-medium">İşlem</th>
                </tr>
              </thead>

              <tbody>
                {offerings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center text-slate-400"
                    >
                      Henüz halka arz eklenmemiş.
                    </td>
                  </tr>
                ) : (
                  offerings.map((offering) => (
                    <tr
                      key={offering.id}
                      className="border-t border-slate-800"
                    >
                      <td className="px-5 py-5 font-semibold text-slate-100">
                        {offering.company_name}
                      </td>

                      <td className="px-5 py-5 font-semibold text-emerald-300">
                        {offering.stock_code ?? "-"}
                      </td>

                      <td className="px-5 py-5">
                        {formatDate(offering.application_start_date)}
                      </td>

                      <td className="px-5 py-5">
                        {formatDate(offering.application_end_date)}
                      </td>

                      <td className="px-5 py-5 text-right font-semibold">
                        {formatMoney(offering.offering_price)}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[offering.status]
                          }`}
                        >
                          {statusLabels[offering.status]}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(offering)}
                            className="rounded-lg border border-blue-500/40 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-400/10"
                          >
                            Düzenle
                          </button>

                          <button
                            onClick={() => handleDeleteOffering(offering)}
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
    </main>
  );
}