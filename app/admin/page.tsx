"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "user";
  profit_share_rate: number;
  created_at: string;
};

type Account = {
  id: string;
  user_id: string;
  bank_name: string;
  account_name: string;
  is_active: boolean;
  created_at: string;
  profile?: {
    full_name: string;
    profit_share_rate: number;
  } | null;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("tr-TR").format(new Date(value));

export default function AdminPage() {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");

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

    const { data: myProfile, error: myProfileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, profit_share_rate, created_at")
      .eq("id", user.id)
      .single();

    if (myProfileError || !myProfile) {
      setMessage("Profil bilgisi alınamadı.");
      setIsLoading(false);
      return;
    }

    if (myProfile.role !== "admin") {
      window.location.href = "/";
      return;
    }

    setCurrentProfile(myProfile as Profile);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, profit_share_rate, created_at")
      .order("created_at", { ascending: false });

    if (profileError) {
      setMessage(`Kullanıcılar alınamadı: ${profileError.message}`);
    } else {
      setProfiles((profileData ?? []) as Profile[]);
    }

    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select(
        `
          id,
          user_id,
          bank_name,
          account_name,
          is_active,
          created_at,
          profile:profiles!accounts_user_id_fkey (
            full_name,
            profit_share_rate
          )
        `,
      )
      .order("created_at", { ascending: false });

    if (accountError) {
      setMessage(`Hesaplar alınamadı: ${accountError.message}`);
    } else {
      setAccounts((accountData ?? []) as Account[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  async function handleAddAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUserId || !bankName.trim() || !accountName.trim()) {
      setMessage("Kullanıcı, banka ve hesap adı alanlarını doldur.");
      return;
    }

    const { error } = await supabase.from("accounts").insert({
      user_id: selectedUserId,
      bank_name: bankName.trim(),
      account_name: accountName.trim(),
    });

    if (error) {
      setMessage(`Hesap eklenemedi: ${error.message}`);
      return;
    }

    setSelectedUserId("");
    setBankName("");
    setAccountName("");
    setMessage("Hesap başarıyla eklendi.");

    await loadPage();
  }

  async function handleUpdateRate(profileId: string, rate: string) {
    const parsedRate = Number(rate);

    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      setMessage("Kâr oranı 0 ile 100 arasında olmalı.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        profit_share_rate: parsedRate,
      })
      .eq("id", profileId);

    if (error) {
      setMessage(`Oran güncellenemedi: ${error.message}`);
      return;
    }

    setMessage("Kullanıcı kâr oranı güncellendi.");
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
          Admin panel hazırlanıyor...
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
              Admin Paneli
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Kullanıcıları, kâr oranlarını ve banka/aracı kurum hesaplarını
              yönet.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Giriş yapan: {currentProfile?.full_name}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800"
            >
              Ana sayfa
            </a>
            <a
              href="/admin/offerings"
              className="rounded-xl border border-emerald-500/40 px-5 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10"
            >
              Halka Arzlar
            </a>
            <a
              href="/admin/cash"
              className="rounded-xl border border-amber-500/40 px-5 py-3 text-sm font-semibold text-amber-300 hover:bg-amber-400/10"
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

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Toplam Kullanıcı</p>
            <p className="mt-3 text-3xl font-bold">{profiles.length}</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Tanımlı Hesap</p>
            <p className="mt-3 text-3xl font-bold">{accounts.length}</p>
          </article>

          <article className="rounded-2xl border border-emerald-500/20 bg-emerald-400/5 p-5">
            <p className="text-sm text-emerald-100/70">Aktif Sistem</p>
            <p className="mt-3 text-3xl font-bold text-emerald-300">Hazır</p>
          </article>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <form
            onSubmit={handleAddAccount}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <h2 className="text-xl font-bold">Kullanıcıya hesap ekle</h2>

            <p className="mt-2 text-sm text-slate-400">
              Kullanıcının halka arza girdiği banka veya aracı kurum hesabını
              tanımla.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Kullanıcı</span>

                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                >
                  <option value="">Kullanıcı seç</option>

                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name} — %{profile.profit_share_rate}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">Banka / aracı kurum</span>

                <input
                  value={bankName}
                  onChange={(event) => setBankName(event.target.value)}
                  placeholder="Örn. VakıfBank"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">Hesap adı</span>

                <input
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder="Örn. Okan - VakıfBank"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              <button
                type="submit"
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
              >
                Hesabı Kaydet
              </button>
            </div>
          </form>

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-5 py-5">
              <h2 className="text-xl font-bold">Kullanıcılar</h2>
              <p className="mt-2 text-sm text-slate-400">
                Her kullanıcının kâr payı oranını buradan ayarla.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Kullanıcı</th>
                    <th className="px-5 py-4 font-medium">Rol</th>
                    <th className="px-5 py-4 font-medium">Kâr Payı %</th>
                    <th className="px-5 py-4 font-medium">Kayıt</th>
                    <th className="px-5 py-4 font-medium">İşlem</th>
                  </tr>
                </thead>

                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="border-t border-slate-800">
                      <td className="px-5 py-4 font-semibold text-slate-100">
                        {profile.full_name}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            profile.role === "admin"
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {profile.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <input
                          id={`rate-${profile.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          defaultValue={profile.profit_share_rate}
                          className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-emerald-400"
                        />
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {formatDate(profile.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => {
                            const input = document.getElementById(
                              `rate-${profile.id}`,
                            ) as HTMLInputElement | null;

                            handleUpdateRate(profile.id, input?.value ?? "");
                          }}
                          className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/10"
                        >
                          Oranı Kaydet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-5">
            <h2 className="text-xl font-bold">Tanımlı hesaplar</h2>
            <p className="mt-2 text-sm text-slate-400">
              Kullanıcıların halka arza gireceği banka/aracı kurum hesapları.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Kullanıcı</th>
                  <th className="px-5 py-4 font-medium">Banka</th>
                  <th className="px-5 py-4 font-medium">Hesap Adı</th>
                  <th className="px-5 py-4 font-medium">Kullanıcı Payı</th>
                  <th className="px-5 py-4 font-medium">Durum</th>
                </tr>
              </thead>

              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-14 text-center text-slate-400"
                    >
                      Henüz hesap eklenmedi.
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id} className="border-t border-slate-800">
                      <td className="px-5 py-4 font-semibold text-slate-100">
                        {account.profile?.full_name ?? "-"}
                      </td>

                      <td className="px-5 py-4">{account.bank_name}</td>

                      <td className="px-5 py-4">{account.account_name}</td>

                      <td className="px-5 py-4">
                        %{account.profile?.profit_share_rate ?? 20}
                      </td>

                      <td className="px-5 py-4">
                        {account.is_active ? "Aktif" : "Pasif"}
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
