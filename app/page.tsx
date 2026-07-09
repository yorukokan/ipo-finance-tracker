"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Mode = "login" | "register";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "user";
  profit_share_rate: number;
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadUser() {
    setIsLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setUserEmail(null);
      setIsLoading(false);
      return;
    }

    setUserEmail(user.email ?? null);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, profit_share_rate")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      setMessage("Profil bulunamadı. Kayıt tetikleyicisini kontrol et.");
      setIsLoading(false);
      return;
    }

    setProfile(profileData as Profile);
    setIsLoading(false);
  }

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("E-posta ve şifre gir.");
      return;
    }

    if (mode === "register" && !fullName.trim()) {
      setMessage("Ad soyad gir.");
      return;
    }

    setIsAuthLoading(true);
    setMessage("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Kayıt oluşturuldu. Şimdi giriş yapabilirsin.");
        setMode("login");
      }
    }

    setIsAuthLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
    setUserEmail(null);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-slate-300">
          Sistem hazırlanıyor...
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-[-160px] right-[-120px] h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-emerald-500/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-emerald-300">
              ARZ FİNANS TAKİP
            </div>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Halka arz finansmanını tek panelden takip et.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Kullanıcı hesapları, başvuru ekran görüntüleri, lot bilgileri,
              satış kayıtları, kâr paylaşımı ve para dönüşlerini düzenli şekilde
              kaydet.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-2xl font-bold text-emerald-300">01</p>
                <p className="mt-2 text-sm font-semibold">Başvuru takibi</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Halka arz, hesap ve başvuru tutarlarını kaydet.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-2xl font-bold text-sky-300">02</p>
                <p className="mt-2 text-sm font-semibold">SS kontrolü</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Başvuru, portföy, satış ve dekont görsellerini sakla.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-2xl font-bold text-violet-300">03</p>
                <p className="mt-2 text-sm font-semibold">Kâr paylaşımı</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Kullanıcı ve admin paylarını otomatik hesapla.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur sm:p-8">
            <p className="text-sm font-medium tracking-[0.18em] text-emerald-400">
              GÜVENLİ GİRİŞ
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {mode === "login" ? "Giriş yap" : "Hesap oluştur"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sisteme giriş yaparak kendi rolüne göre admin veya kullanıcı
              paneline eriş.
            </p>

            <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  mode === "login"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                Giriş
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setMessage("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  mode === "register"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                Kayıt
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "register" && (
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Ad soyad</span>

                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Örn. Okan Yörük"
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </label>
              )}

              <label className="grid gap-2 text-sm">
                <span className="font-medium">E-posta</span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@mail.com"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">Şifre</span>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="En az 6 karakter"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              {message && (
                <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {isAuthLoading
                  ? "İşleniyor..."
                  : mode === "login"
                    ? "Giriş yap"
                    : "Hesap oluştur"}
              </button>
            </form>
          </section>
        </section>
      </main>
    );
  }

  const isAdmin = profile.role === "admin";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute right-[-120px] top-[-120px] h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-140px] left-[-120px] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium tracking-[0.18em] text-emerald-400">
              ARZ FİNANS TAKİP
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {isAdmin ? "Yönetim Merkezi" : "Kullanıcı Merkezi"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              {isAdmin
                ? "Halka arzları, kullanıcı hesaplarını, para hareketlerini ve tüm başvuru kayıtlarını buradan yönet."
                : "Başvurularını oluştur, ekran görüntülerini yükle, satış bilgilerini ve geri ödeme dekontlarını bildir."}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-lg font-black text-slate-950">
              {profile.full_name.slice(0, 1).toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-semibold">{profile.full_name}</p>
              <p className="text-xs text-slate-500">
                {userEmail} ·{" "}
                {isAdmin ? "Admin" : `Kâr payı %${profile.profit_share_rate}`}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Hoş geldin, {profile.full_name}
                </p>

                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                  {isAdmin
                    ? "Bugünkü kontrol panelin hazır."
                    : "İşlem ekranın hazır."}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  {isAdmin
                    ? "Önce halka arzı aç, kullanıcı hesaplarını kontrol et, para hareketini gir ve genel tablodan tüm akışı takip et."
                    : "Açık halka arzlara başvuru oluşturabilir, SS yükleyebilir ve geri ödeme dekontunu bildirebilirsin."}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-fit rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800"
              >
                Çıkış yap
              </button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {isAdmin ? (
                <>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-2xl font-bold text-emerald-300">1</p>
                    <p className="mt-2 text-sm font-semibold">Halka arz aç</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Şirket, kod, tarih ve fiyat bilgisini gir.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-2xl font-bold text-amber-300">2</p>
                    <p className="mt-2 text-sm font-semibold">Para akışı gir</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Kullanıcıya gönderilen ve geri gelen parayı takip et.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-2xl font-bold text-sky-300">3</p>
                    <p className="mt-2 text-sm font-semibold">
                      Tabloyu kontrol et
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Kâr, pay, SS ve işlem durumlarını gör.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-2xl font-bold text-emerald-300">1</p>
                    <p className="mt-2 text-sm font-semibold">Başvuru yap</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Açık halka arzı ve hesabını seç.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-2xl font-bold text-violet-300">2</p>
                    <p className="mt-2 text-sm font-semibold">SS yükle</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Başvuru, portföy ve satış görsellerini ekle.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-2xl font-bold text-sky-300">3</p>
                    <p className="mt-2 text-sm font-semibold">Dekont bildir</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Geri ödeme yaptığında dekontunu yükle.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Hızlı erişim</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              En çok kullanacağın ekranlara buradan geç.
            </p>

            <div className="mt-6 grid gap-3">
              {isAdmin ? (
                <>
                  <a
                    href="/admin"
                    className="group rounded-2xl border border-emerald-500/30 bg-emerald-400/10 p-5 transition hover:bg-emerald-400/15"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-emerald-300">
                          Admin Paneli
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Kullanıcı ve hesap yönetimi.
                        </p>
                      </div>

                      <span className="text-xl text-emerald-300 transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </a>

                  <a
                    href="/admin/offerings"
                    className="group rounded-2xl border border-violet-500/30 bg-violet-400/10 p-5 transition hover:bg-violet-400/15"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-violet-300">
                          Halka Arzlar
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Halka arz bilgi ve durum yönetimi.
                        </p>
                      </div>

                      <span className="text-xl text-violet-300 transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </a>

                  <a
                    href="/admin/table"
                    className="group rounded-2xl border border-sky-500/30 bg-sky-400/10 p-5 transition hover:bg-sky-400/15"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-sky-300">Genel Tablo</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Tüm işlemler, kârlar ve SS kontrolleri.
                        </p>
                      </div>

                      <span className="text-xl text-sky-300 transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </a>

                  <a
                    href="/admin/cash"
                    className="group rounded-2xl border border-amber-500/30 bg-amber-400/10 p-5 transition hover:bg-amber-400/15"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-amber-300">
                          Para Hareketleri
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Gönderilen ve geri gelen paralar.
                        </p>
                      </div>

                      <span className="text-xl text-amber-300 transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </a>
                  <a
                    href="/admin/offerings-summary"
                    className="group rounded-2xl border border-purple-500/30 bg-purple-400/10 p-5 transition hover:bg-purple-400/15"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-purple-300">
                          Halka Arz Özeti
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Her halka arzın toplam kâr, maliyet ve eksiklerini
                          gör.
                        </p>
                      </div>

                      <span className="text-xl text-purple-300 transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </a>
                </>
              ) : (
                <a
                  href="/my"
                  className="group rounded-2xl border border-emerald-500/30 bg-emerald-400/10 p-5 transition hover:bg-emerald-400/15"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-emerald-300">
                        İşlemlerime Git
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Başvuru, SS, satış ve dekont bildirme ekranı.
                      </p>
                    </div>

                    <span className="text-xl text-emerald-300 transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </a>
              )}
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm font-semibold text-slate-300">Güvenli yapı</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Kullanıcılar sadece kendi kayıtlarını görür. Admin genel akışı
              takip eder.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm font-semibold text-slate-300">Belge takibi</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Başvuru, portföy, satış ve dekont görselleri özel depoda saklanır.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm font-semibold text-slate-300">
              Otomatik hesaplama
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Maliyet, satış, kâr ve kâr paylaşımı tablolarda otomatik görünür.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
