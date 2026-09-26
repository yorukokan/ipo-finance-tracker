<div align="center">
# 📊 IPO Finance Tracker
### 🚀 Halka Arz Yatırımlarını Tek Panelden Yönet
**Başvuru • Portföy • Satış • Kâr Paylaşımı • Nakit Akışı**
<br>
<a href="https://arz-finans-takip.vercel.app/">
  <img src="https://img.shields.io/badge/🌐_Canlı_Demo-arz--finans--takip.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo">
</a>
<a href="https://github.com/yorukokan/ipo-finance-tracker">
  <img src="https://img.shields.io/badge/GitHub-Kaynak_Kod-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
</a>
<br><br>
<img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js" alt="Next.js">
<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
<img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase">
<img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
</div>
---
## 📌 Proje Hakkında
**IPO Finance Tracker**, birden fazla kullanıcının halka arz yatırımlarını, yatırım hesaplarını, başvurularını, portföylerini, satış işlemlerini ve nakit hareketlerini tek bir merkezi panel üzerinden takip edebilmesini sağlayan modern bir web uygulamasıdır.
Proje **kullanıcı + admin** yapısı üzerine kurulmuştur. Kullanıcılar kendi yatırım ve finansal verilerini görüntülerken, yöneticiler sistemdeki kullanıcıları, halka arzları, yatırımları ve nakit akışını merkezi bir panel üzerinden yönetebilir.
> 🎯 Amaç: Halka arz süreçlerinde Excel, mesajlaşma uygulamaları ve dağınık hesaplamalar yerine tüm yatırım sürecini tek, düzenli ve takip edilebilir bir platformda yönetmek.
---
# ✨ Öne Çıkan Özellikler
<table>
<tr>
<td width="50%">
### 👤 Kullanıcı Yönetimi
- 🔐 Supabase Authentication
- 👥 Kullanıcı / Admin rol ayrımı
- 🧑 Kullanıcı profilleri
- 💰 Kullanıcı bazlı kâr paylaşım oranı
- 📊 Kişiye özel yatırım görünümü
</td>
<td width="50%">
### 📈 Halka Arz Yönetimi
- 🏷️ Halka arz tanımlama
- 📅 Halka arz bilgilerini yönetme
- 📦 Tahsis edilen lot takibi
- 💵 Alış maliyeti hesaplama
- 📊 Yatırım bazlı finansal takip
</td>
</tr>
<tr>
<td>
### 💼 Portföy Yönetimi
- 🏦 Yatırım hesabı takibi
- 📋 Yatırım kayıtları
- 🎯 Alınan lot miktarı
- 💰 Toplam maliyet
- 📈 Güncel yatırım durumu
</td>
<td>
### 💸 Satış & Kâr Takibi
- 📤 Satış işlemleri
- 📦 Satılan lot miktarı
- 💵 Satış fiyatı
- 📊 Kâr / zarar hesaplama
- 📈 Kâr yüzdesi
- 🤝 Kâr paylaşımı
</td>
</tr>
<tr>
<td>
### 💰 Nakit Akışı
- 💸 Kullanıcılara gönderilen para
- 📥 Geri alınan para
- 🧾 Nakit hareketleri
- ⚖️ Bakiye takibi
- 🔄 Geri ödeme süreçleri
</td>
<td>
### 🛠️ Admin Paneli
- 📊 Genel bakış
- 👥 Kullanıcı yönetimi
- 🏦 Hesap yönetimi
- 📈 Halka arz yönetimi
- 💼 Yatırım yönetimi
- 💰 Nakit yönetimi
</td>
</tr>
</table>
---
# 🧠 Sistem Mimarisi
```mermaid
flowchart TD
    A[👤 Kullanıcı] --> B[🌐 Next.js Web Application]
    B --> C[🔐 Supabase Authentication]
    B --> D{👮 Kullanıcı Rolü}
    D -->|User| E[📊 Kullanıcı Paneli]
    D -->|Admin| F[🛠️ Admin Paneli]
    E --> G[💼 Yatırımlar]
    E --> H[📈 Portföy]
    E --> I[💰 Finansal Durum]
    F --> J[👥 Kullanıcı Yönetimi]
    F --> K[📈 Halka Arz Yönetimi]
    F --> L[🏦 Hesap Yönetimi]
    F --> M[💸 Nakit Akışı]
    F --> N[📊 Raporlama]
    B --> O[(🗄️ Supabase / PostgreSQL)]
    G --> O
    H --> O
    I --> O
    J --> O
    K --> O
    L --> O
    M --> O
    N --> O

⸻

🔄 Yatırım Süreci

                    HALKA ARZ SÜRECİ
                           │
                           ▼
                ┌─────────────────────┐
                │ 📈 Halka Arz Tanımı │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ 📝 Başvuru          │
                │                     │
                │ Yatırım hesabı     │
                │ Başvuru tutarı     │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ 🎯 Tahsis           │
                │                     │
                │ Lot miktarı        │
                │ Alış maliyeti      │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ 💼 Portföy          │
                │                     │
                │ Yatırım takibi     │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ 📤 Satış            │
                │                     │
                │ Satılan lot        │
                │ Satış fiyatı       │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ 📊 Kâr / Zarar      │
                │                     │
                │ Brüt kâr           │
                │ Kâr paylaşımı      │
                │ Net sonuç          │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ 💰 Nakit Mutabakatı│
                └─────────────────────┘

⸻

👤 Kullanıcı Paneli

Kullanıcı tarafında yatırımcıya ait finansal bilgiler merkezi bir dashboard üzerinden görüntülenebilir.

Alan	Açıklama
👤 Profil	Kullanıcı bilgileri
🏦 Hesaplar	Kullanıcıya ait yatırım hesapları
📈 Halka Arzlar	Kullanıcının dahil olduğu halka arzlar
📦 Lotlar	Tahsis edilen / alınan lotlar
💵 Maliyet	Toplam yatırım maliyeti
📤 Satışlar	Gerçekleşen satış işlemleri
📊 Kâr / Zarar	Yatırım performansı
💰 Bakiye	Finansal durum ve nakit hareketleri

⸻

🛠️ Admin Paneli

Admin paneli sistemdeki finansal ve yatırım süreçlerinin merkezi olarak yönetilmesini sağlar.

/admin
│
├── 📊 Overview
├── 💸 Cash
├── 📈 Offerings
├── 📋 Offerings Summary
├── 📊 Overview
└── 📑 Table

Admin Yetkinlikleri

* 👥 Kullanıcıları yönetme
* 🏦 Yatırım hesaplarını yönetme
* 📈 Halka arz ekleme / düzenleme
* 💼 Yatırım kayıtlarını takip etme
* 💸 Nakit hareketlerini yönetme
* 📊 Genel finansal özetleri görüntüleme
* 📋 Verileri tablo üzerinden inceleme

⸻

🗄️ Veri Modeli

Uygulamanın temel veri yapısı Supabase PostgreSQL üzerinde oluşturulmuştur.

Tablo	Amaç
profiles	Kullanıcı profilleri ve rol bilgileri
investment_accounts	Yatırım hesapları
offerings	Halka arz bilgileri
investments	Kullanıcı yatırım kayıtları

İlişki Yapısı

erDiagram
    PROFILES ||--o{ INVESTMENT_ACCOUNTS : owns
    PROFILES ||--o{ INVESTMENTS : makes
    OFFERINGS ||--o{ INVESTMENTS : contains
    INVESTMENT_ACCOUNTS ||--o{ INVESTMENTS : uses
    PROFILES {
        uuid id PK
        string role
        float profit_share_rate
    }
    INVESTMENT_ACCOUNTS {
        uuid id PK
        uuid user_id FK
        string account_name
    }
    OFFERINGS {
        uuid id PK
        string name
        date start_date
    }
    INVESTMENTS {
        uuid id PK
        uuid user_id FK
        uuid offering_id FK
        uuid account_id FK
        int lots
        decimal buy_price
        decimal sell_price
        decimal profit
    }

⸻

🧮 Finansal Hesaplama Mantığı

Toplam Alış Maliyeti

Alış Maliyeti = Alınan Lot × Alış Fiyatı

Toplam Satış Tutarı

Satış Tutarı = Satılan Lot × Satış Fiyatı

Brüt Kâr / Zarar

Brüt Kâr = Satış Tutarı - Satılan Lotların Maliyeti

Kâr Oranı

Kâr % = (Brüt Kâr / Maliyet) × 100

Kâr Paylaşımı

Kullanıcı Payı = Brüt Kâr × Kâr Paylaşım Oranı

⸻

🧱 Teknoloji Stack

Teknoloji	Kullanım Alanı
⚛️ React	Kullanıcı arayüzü
▲ Next.js	Full-stack React framework
🔷 TypeScript	Type-safe geliştirme
🎨 Tailwind CSS	UI / Styling
🟢 Supabase	Backend & Authentication
🐘 PostgreSQL	Veritabanı
▲ Vercel	Deployment

⸻

📦 Proje Yapısı

ipo-finance-tracker/
│
├── app/
│   ├── page.tsx
│   │
│   ├── my/
│   │   └── page.tsx
│   │
│   └── admin/
│       ├── page.tsx
│       ├── cash/
│       ├── offerings/
│       ├── offerings-summary/
│       ├── overview/
│       └── table/
│
├── lib/
│   └── supabase.ts
│
├── public/
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md

⸻

🚀 Kurulum

1️⃣ Repoyu Klonla

git clone https://github.com/yorukokan/ipo-finance-tracker.git
cd ipo-finance-tracker

2️⃣ Bağımlılıkları Yükle

npm install

3️⃣ Environment Variables

Proje kök dizininde .env.local dosyası oluştur:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

🔐 Gerçek Supabase anahtarlarını GitHub’a yüklemeyin.

4️⃣ Development Server

npm run dev

Ardından:

http://localhost:3000

adresini açabilirsiniz.

⸻

🧪 Kullanılabilir Komutlar

Komut	Açıklama
npm run dev	Development server başlatır
npm run build	Production build oluşturur
npm run start	Production server başlatır
npm run lint	Kod kalitesini kontrol eder

⸻

🌐 Canlı Demo

<div align="center">
<a href="https://arz-finans-takip.vercel.app/">
<img src="https://img.shields.io/badge/🚀_LIVE_DEMO-arz--finans--takip.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo">
</a>

https://arz-finans-takip.vercel.app/

</div>

⸻

🔮 Gelecek Geliştirmeler

* 📊 Daha gelişmiş finansal dashboard
* 📈 Grafik tabanlı portföy analizi
* 📅 Halka arz takvim sistemi
* 🔔 Bildirim sistemi
* 📱 Mobil uyumluluğun geliştirilmesi
* 📄 PDF / Excel rapor oluşturma
* 📊 Kullanıcı bazlı performans raporları
* 🔎 Gelişmiş filtreleme ve arama
* 📤 CSV / Excel veri aktarımı
* 📈 Daha detaylı yatırım istatistikleri

⸻

🎯 Projenin Amacı

Bu proje, gerçek bir finansal takip senaryosunun yazılım ile nasıl modellenebileceğini göstermek amacıyla geliştirilmiştir.

Proje kapsamında:

Problem
   ↓
Finansal verilerin dağınık olması
   ↓
Veri modeli oluşturma
   ↓
Supabase / PostgreSQL
   ↓
Next.js uygulaması
   ↓
Authentication
   ↓
Role-Based Access
   ↓
Admin Panel
   ↓
Finansal Hesaplamalar
   ↓
Deployment

gibi gerçek bir uygulama geliştirme süreci ele alınmıştır.

⸻

🔐 Güvenlik

Projede aşağıdaki konulara dikkat edilmelidir:

* 🔒 Authentication
* 👮 Role-based authorization
* 🔑 Environment variables
* 🗄️ Supabase database security
* 🚫 Hassas bilgilerin repository’ye gönderilmemesi

.env.local dosyasının Git repository’sine eklenmemesi gerekir.

.env
.env.local
.env.production

⸻

⚠️ Disclaimer

Bu uygulama bir yatırım tavsiyesi veya finansal danışmanlık hizmeti değildir.

Uygulamadaki finansal hesaplamalar yalnızca kayıt ve takip amacıyla kullanılmalıdır.

Gerçek yatırım kararları verilmeden önce bağımsız olarak araştırma yapılması ve gerektiğinde yetkili finansal danışmanlardan profesyonel destek alınması gerekir.

⸻

👨‍💻 Geliştirici

<div align="center">

Okan Yörük

Computer Engineering Student • Software Developer

<br>
<a href="https://github.com/yorukokan">
  <img src="https://img.shields.io/badge/GitHub-yorukokan-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
</a>
<a href="https://linkedin.com/in/okanyoruk">
  <img src="https://img.shields.io/badge/LinkedIn-Okan_Yörük-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
</a>
</div>

⸻

<div align="center">

⭐ Projeyi Beğendiysen Star Vermeyi Unutma!

Built with ❤️ using Next.js & Supabase

</div>
```
