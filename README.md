<div align="center">

# 💰 IPO Finance Tracker

### Halka Arz Yatırım ve Finans Takip Sistemi

Kullanıcıların halka arz yatırımlarını, yatırım hesaplarını,  
nakit hareketlerini, alım-satım işlemlerini ve kâr paylaşımını  
tek bir platform üzerinden takip edebilmesini sağlayan modern web uygulaması.

<br>

<a href="https://arz-finans-takip.vercel.app/">
  <img src="https://img.shields.io/badge/🌐_Canlı_Uygulama-arz--finans--takip.vercel.app-000000?style=for-the-badge" alt="Live App">
</a>

<a href="https://github.com/yorukokan/ipo-finance-tracker">
  <img src="https://img.shields.io/badge/GitHub-Kaynak_Kod-181717?style=for-the-badge&logo=github" alt="GitHub">
</a>

<br><br>

<img src="https://img.shields.io/badge/Next.js-16.2.10-000000?style=flat-square&logo=next.js" alt="Next.js">
<img src="https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
<img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase">
<img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel" alt="Vercel">

</div>

---

## 📌 Proje Hakkında

**IPO Finance Tracker**, halka arz yatırımlarının düzenli ve merkezi bir şekilde takip edilmesi amacıyla geliştirilmiş full-stack bir web uygulamasıdır.

Sistem; kullanıcı bazlı yatırım kayıtlarını, halka arz başvurularını, tahsis edilen lotları, alış ve satış işlemlerini, nakit hareketlerini ve kâr paylaşımını yönetmek için tasarlanmıştır.

Uygulamada iki temel kullanıcı rolü bulunmaktadır:

| Rol | Açıklama |
|---|---|
| 👤 **Kullanıcı** | Kendi yatırım hesaplarını, halka arz yatırımlarını ve finansal hareketlerini görüntüler. |
| 🛠️ **Yönetici** | Kullanıcıları, halka arzları, yatırımları ve nakit hareketlerini merkezi olarak yönetir. |

---

## 🚀 Canlı Demo

<div align="center">

### 🌐 Uygulamayı İncele

<a href="https://arz-finans-takip.vercel.app/">
  <img src="https://img.shields.io/badge/Uygulamaya_Git-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Application">
</a>

</div>

---

## ✨ Temel Özellikler

### 🔐 Kimlik Doğrulama

- Kullanıcı giriş sistemi
- Supabase Authentication
- Kullanıcı ve yönetici rolleri
- Yetkilendirilmiş sayfa erişimi
- Kullanıcıya özel yatırım verileri

### 📈 Halka Arz Yönetimi

- Halka arz oluşturma
- Halka arz bilgilerini düzenleme
- Başvuru takibi
- Tahsis edilen lotların yönetimi
- Alış fiyatlarının takibi
- Satış işlemlerinin kaydı
- Halka arz bazlı özetler

### 💳 Yatırım Hesapları

Kullanıcıların farklı banka veya yatırım hesapları sistem içerisinde ayrı ayrı takip edilebilir.

Takip edilebilen bilgiler:

- Hesap adı
- Hesap sahibi
- Hesap bakiyesi
- Para girişleri
- Para çıkışları
- Yatırım hareketleri

### 💰 Nakit Akışı

Sistemde gerçekleşen para hareketleri merkezi olarak takip edilebilir.

Örneğin:

- Kullanıcıya para gönderme
- Kullanıcıdan para alma
- Halka arz için gönderilen para
- Satış sonrası oluşan nakit
- Kullanıcıya geri ödeme
- Kalan nakit

### 📊 Kâr / Zarar Takibi

Her yatırım için finansal sonuçlar hesaplanabilir.

Takip edilen temel değerler:

- Toplam maliyet
- Alış tutarı
- Satış tutarı
- Kâr / zarar
- Kârlılık yüzdesi
- Kullanıcı payı
- Geri ödenecek tutar
- Kalan nakit

### 🤝 Kullanıcı Bazlı Kâr Paylaşımı

Sistem kullanıcı bazında farklı kâr paylaşım oranlarının uygulanmasına olanak sağlar.

Örneğin:

> Yatırım kârı → %20 kullanıcı payı → kalan tutar sistem tarafından takip edilir.

Varsayılan kâr paylaşım oranı sistem içerisinde yönetilebilir.

### 🛠️ Yönetici Paneli

Yönetici paneli üzerinden:

- Kullanıcılar
- Yatırım hesapları
- Halka arzlar
- Yatırımlar
- Başvurular
- Nakit hareketleri
- Satış işlemleri
- Özet finansal veriler

merkezi olarak yönetilebilir.

---

## 🧩 Sistem Mimarisi

<div align="center">

<pre>
┌───────────────────────────────┐
│          Kullanıcı            │
│                               │
│  • Giriş                      │
│  • Yatırımlar                 │
│  • Halka Arzlar               │
│  • Portföy                    │
│  • Finansal Hareketler        │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│          Next.js              │
│                               │
│  App Router + React + TS      │
│                               │
│  • User Panel                 │
│  • Admin Panel                │
│  • API / Server Logic         │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│           Supabase            │
│                               │
│  • Authentication             │
│  • PostgreSQL                 │
│  • Database                   │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│            Vercel             │
│                               │
│       Production Deploy       │
└───────────────────────────────┘
</pre>

</div>

---

## 🗄️ Veritabanı Yapısı

Uygulamanın temel veri modeli PostgreSQL üzerinde oluşturulmuştur.

### Ana Tablolar

| Tablo | Açıklama |
|---|---|
| `profiles` | Kullanıcı bilgileri ve roller |
| `investment_accounts` | Kullanıcıların yatırım / banka hesapları |
| `offerings` | Halka arz bilgileri |
| `investments` | Kullanıcıların halka arz yatırımları |

### İlişkisel Yapı

<pre>
profiles
   │
   ├──────────────► investment_accounts
   │
   └──────────────► investments
                         │
                         ▼
                     offerings
</pre>

Bu yapı sayesinde kullanıcı, yatırım hesabı, halka arz ve yatırım kayıtları arasında ilişkisel veri yönetimi sağlanmaktadır.

---

## 👤 Kullanıcı Akışı

<pre>
Giriş
  │
  ▼
Kullanıcı Paneli
  │
  ├──► Yatırım Hesapları
  │
  ├──► Halka Arzlar
  │       │
  │       ├──► Başvuru
  │       └──► Tahsis Edilen Lot
  │
  ├──► Portföy
  │
  └──► Finansal Hareketler
          │
          ├──► Para Girişi
          ├──► Para Çıkışı
          ├──► Satış
          └──► Geri Ödeme
</pre>

---

## 🛠️ Yönetici Akışı

<pre>
Admin Girişi
     │
     ▼
Yönetim Paneli
     │
     ├──► Kullanıcı Yönetimi
     │
     ├──► Yatırım Hesapları
     │
     ├──► Halka Arz Yönetimi
     │
     ├──► Başvuru Yönetimi
     │
     ├──► Nakit Yönetimi
     │
     ├──► Yatırım Tablosu
     │
     ├──► Halka Arz Özetleri
     │
     └──► Genel Bakış
</pre>

---

## 🧑‍💻 Teknolojiler

### Frontend

- **Next.js 16.2.10**
- **React 19.2.4**
- **TypeScript**
- **Tailwind CSS 4**
- **Next.js App Router**

### Backend / Database

- **Supabase**
- **PostgreSQL**
- **Supabase Authentication**

### Deployment

- **Vercel**

### Development

- **Git**
- **GitHub**
- **VS Code**

---

## 📂 Proje Yapısı

<pre>
ipo-finance-tracker/
│
├── app/
│   ├── admin/
│   │   ├── cash/
│   │   ├── offerings/
│   │   ├── offerings-summary/
│   │   ├── overview/
│   │   └── table/
│   │
│   ├── my/
│   │
│   ├── page.tsx
│   └── ...
│
├── lib/
│   └── supabase.ts
│
├── public/
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── README.md
</pre>

---

## ⚙️ Kurulum

### 1. Repoyu Klonla

    git clone https://github.com/yorukokan/ipo-finance-tracker.git

### 2. Proje Klasörüne Gir

    cd ipo-finance-tracker

### 3. Bağımlılıkları Yükle

    npm install

### 4. Environment Değişkenlerini Tanımla

Proje kök dizininde `.env.local` dosyası oluştur:

    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

Supabase proje bilgilerini kendi Supabase projen üzerinden doldur.

### 5. Development Sunucusunu Başlat

    npm run dev

Ardından uygulamayı aşağıdaki adresten aç:

    http://localhost:3000

---

## 🔑 Environment Variables

| Değişken | Açıklama |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL'si |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public/anon key |

> ⚠️ Gerçek `.env.local` dosyanı GitHub'a yüklememeye dikkat et.

---

## 📊 Uygulama Modülleri

### 🏠 Genel Bakış

Yönetici tarafında sistemin genel finansal durumunun izlenmesini sağlar.

### 👥 Kullanıcı Yönetimi

Kullanıcıların sistem içerisindeki rollerinin ve ilişkili yatırım bilgilerinin yönetilmesini sağlar.

### 🏦 Yatırım Hesapları

Farklı banka / yatırım hesaplarının sistem içerisinde tutulmasını sağlar.

### 📋 Başvuru Yönetimi

Halka arz başvurularının kullanıcı bazında takip edilmesini sağlar.

### 📈 Yatırım Tablosu

Yatırımların merkezi bir tabloda görüntülenmesini sağlar.

### 💸 Nakit Yönetimi

Kullanıcılar ve yatırımlar arasındaki para hareketlerinin takip edilmesini sağlar.

### 📊 Halka Arz Özetleri

Halka arz bazında yatırım ve finansal sonuçların özetlenmesini sağlar.

---

## 🔄 Finansal İşlem Mantığı

Sistem içerisinde temel yatırım süreci aşağıdaki şekilde ilerler:

<pre>
Halka Arz
   │
   ▼
Başvuru
   │
   ▼
Tahsis Edilen Lot
   │
   ▼
Alış / Maliyet
   │
   ▼
Portföy
   │
   ▼
Satış
   │
   ▼
Satış Tutarı
   │
   ├──────────────► Kâr / Zarar
   │
   ├──────────────► Kullanıcı Payı
   │
   └──────────────► Geri Ödeme / Kalan Nakit
</pre>

---

## 🧮 Finansal Takip

Yatırım bazında aşağıdaki değerler takip edilebilir:

| Finansal Veri | Açıklama |
|---|---|
| Lot | Alınan / tahsis edilen hisse adedi |
| Maliyet | Yatırım için kullanılan toplam tutar |
| Alış Tutarı | Gerçekleşen alış miktarı |
| Satış Tutarı | Gerçekleşen satış miktarı |
| Kâr / Zarar | Alış ve satış arasındaki finansal sonuç |
| Kâr Oranı | Yatırımın yüzde bazında sonucu |
| Kullanıcı Payı | Kullanıcıya ait kâr oranı |
| Geri Ödeme | Kullanıcıya aktarılması gereken tutar |
| Kalan Nakit | İşlem sonrasında kalan tutar |

---

## 🎯 Projenin Amacı

Bu projenin temel amacı, birden fazla kullanıcı ve yatırım hesabının bulunduğu halka arz süreçlerinde manuel olarak tutulan finansal kayıtları merkezi bir web uygulamasına taşımaktır.

Sistem sayesinde:

- 📌 Veriler tek yerde tutulabilir.
- 📊 Yatırımlar daha kolay takip edilebilir.
- 💰 Nakit hareketleri kayıt altına alınabilir.
- 📈 Kâr / zarar hesaplamaları izlenebilir.
- 👤 Kullanıcı bazlı yatırım verileri ayrıştırılabilir.
- 🛠️ Yönetici işlemleri merkezi bir panel üzerinden gerçekleştirilebilir.

---

## 🔒 Güvenlik

Projede kullanıcı yetkilendirmesi ve veri erişimi Supabase altyapısı üzerinden yönetilmektedir.

Önemli güvenlik prensipleri:

- Kullanıcı ve admin rollerinin ayrılması
- Kullanıcıya özel veri erişimi
- Supabase Authentication kullanımı
- Hassas environment değişkenlerinin `.env.local` içerisinde tutulması
- Secret bilgilerin repository içerisinde saklanmaması

> Production ortamında Supabase Row Level Security (RLS) politikalarının doğru şekilde yapılandırılması ve düzenli olarak kontrol edilmesi önemlidir.

---

## 🌐 Deployment

Uygulama **Vercel** üzerinde deploy edilmiştir.

### Production

    https://arz-finans-takip.vercel.app/

Deployment sürecinde temel olarak:

<pre>
GitHub Repository
       │
       ▼
     Vercel
       │
       ├──► Build
       │
       ├──► Environment Variables
       │
       └──► Production Deployment
</pre>

---

## 📱 Responsive Tasarım

Uygulama farklı ekran boyutlarında kullanılabilecek şekilde tasarlanmıştır.

Desteklenen kullanım senaryoları:

- 🖥️ Desktop
- 💻 Laptop
- 📱 Mobil
- 📱 Tablet

---

## 📌 Gelecekte Eklenebilecek Özellikler

Projenin ilerleyen aşamalarında aşağıdaki özellikler eklenebilir:

- [ ] 📊 Daha gelişmiş grafik ve dashboard
- [ ] 📈 Portföy performans grafikleri
- [ ] 📅 Tarih bazlı finansal raporlama
- [ ] 📥 Excel / CSV dışa aktarma
- [ ] 📄 PDF raporlama
- [ ] 🔔 Bildirim sistemi
- [ ] 📧 E-posta bildirimleri
- [ ] 🔎 Gelişmiş filtreleme
- [ ] 📊 Kullanıcı bazlı performans raporları
- [ ] 📱 PWA desteği
- [ ] 🌙 Gelişmiş dark mode
- [ ] 🧾 İşlem geçmişi / audit log
- [ ] 🔐 Daha kapsamlı rol ve yetki yönetimi

---

## 🧠 Öğrenilen Teknolojiler

Bu proje geliştirilirken aşağıdaki konularda pratik kazanılmıştır:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Authentication
- Role-based access control
- CRUD işlemleri
- İlişkisel veritabanı tasarımı
- Finansal veri modelleme
- Server / Client Component ayrımı
- Vercel deployment
- Git / GitHub workflow

---

## 🤝 Katkıda Bulunma

Projeyi geliştirmek veya katkıda bulunmak isteyenler:

1. Repository'yi fork'layabilir.
2. Yeni bir branch oluşturabilir.
3. Değişikliklerini gerçekleştirebilir.
4. Commit oluşturabilir.
5. Pull Request gönderebilir.

Örnek branch:

    git checkout -b feature/yeni-ozellik

Commit:

    git add .
    git commit -m "Yeni özellik eklendi"

Push:

    git push origin feature/yeni-ozellik

---

## 📄 Lisans

Bu repository'nin lisans bilgileri için repository içerisinde bulunan lisans dosyasını inceleyebilirsiniz.

---

<div align="center">

## 💻 Geliştirici

### Okan Yörük

Computer Engineering Student & Software Developer

<br>

<a href="https://github.com/yorukokan">
  <img src="https://img.shields.io/badge/GitHub-yorukokan-181717?style=for-the-badge&logo=github" alt="GitHub">
</a>

<a href="https://www.linkedin.com/in/okanyoruk/">
  <img src="https://img.shields.io/badge/LinkedIn-Okan_Yörük-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
</a>

<br><br>

⭐ Projeyi faydalı bulduysan repository'ye yıldız bırakmayı unutma!

</div>
