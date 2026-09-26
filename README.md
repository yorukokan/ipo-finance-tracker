📊 IPO Finance Tracker

A web-based financial tracking platform designed to manage and monitor IPO applications, investments, sales, cash movements, and profit-sharing processes.

Live Demo: https://arz-finans-takip.vercel.app/
Repository: https://github.com/yorukokan/ipo-finance-tracker

⸻

📌 Overview

IPO Finance Tracker is a full-stack web application developed to simplify the management of financial processes related to Initial Public Offerings (IPOs).

The application allows users to track their IPO applications, investment accounts, allocated lots, purchase and sale information, uploaded transaction screenshots, and repayment status through a centralized dashboard.

The system also provides an admin panel for managing IPO offerings, users, investment accounts, cash movements, application records, and overall financial summaries.

The application was designed especially for scenarios where multiple users participate in IPO investments and their financial transactions need to be tracked in an organized and transparent way.

⸻

✨ Features

🔐 Authentication & User Management

* User registration and login
* Supabase Authentication integration
* User profile management
* Role-based access between user and admin
* Individual profit-sharing rate per user

📈 IPO Management

* Create and manage IPO offerings
* Define company information and ticker symbols
* Track IPO dates and offering prices
* Manage active and completed offerings
* View offering-based investment summaries

👤 User Investment Tracking

Users can manage and monitor:

* Investment accounts
* IPO applications
* Application amounts
* Allocated lots
* Purchase prices
* Portfolio information
* Sale information
* Profit and loss calculations
* Profit-sharing amounts
* Remaining / returned cash

📷 Transaction Verification

The application supports storing transaction-related screenshots, including:

* IPO application screenshots
* Portfolio screenshots
* Sale screenshots
* Repayment / transfer receipts

This provides a visual verification layer for financial records.

💰 Cash Flow Management

Administrators can track financial movements between the system and users, including:

* Money sent to users
* Money returned by users
* Cash balances
* Repayment status
* Related transaction records

📊 Admin Dashboard

The admin interface provides centralized management for:

* Users
* Investment accounts
* IPO offerings
* Applications
* Investments
* Cash movements
* Offering summaries
* Overall transaction tables

🧮 Profit Sharing

The system supports user-specific profit-sharing rates and calculates financial results based on the configured rate.

This allows different users to have different profit-sharing percentages when required.

⸻

🛠️ Tech Stack

Frontend

Backend & Database

Deployment

⸻

🏗️ Application Structure

The project follows the Next.js App Router architecture.

ipo-finance-tracker/
│
├── app/
│   ├── page.tsx
│   │   └── Authentication & main entry
│   │
│   ├── my/
│   │   └── User investment management
│   │
│   └── admin/
│       ├── page.tsx
│       │   └── Admin dashboard
│       │
│       ├── cash/
│       │   └── Cash movement management
│       │
│       ├── offerings/
│       │   └── IPO offering management
│       │
│       ├── offerings-summary/
│       │   └── Offering-based financial summaries
│       │
│       ├── overview/
│       │   └── Administrative overview
│       │
│       └── table/
│           └── Overall investment & transaction table
│
├── lib/
│   └── supabase.ts
│       └── Supabase client configuration
│
├── public/
│   └── Static assets
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md

⸻

🔄 Application Flow

flowchart TD
    A[User] --> B[Authentication]
    B --> C{User Role}
    C -->|User| D[User Panel]
    C -->|Admin| E[Admin Panel]
    D --> F[IPO Applications]
    D --> G[Investment Accounts]
    D --> H[Portfolio & Sales]
    D --> I[Repayment / Receipts]
    E --> J[IPO Management]
    E --> K[User Management]
    E --> L[Cash Management]
    E --> M[Investment Table]
    E --> N[Offering Summaries]
    F --> O[(Supabase)]
    G --> O
    H --> O
    I --> O
    J --> O
    K --> O
    L --> O
    M --> O
    N --> O

⸻

🗄️ Data Model

The application is built around user profiles, investment accounts, IPO offerings, and investment records.

Core entities include:

Entity	Purpose
profiles	User information, roles and profit-sharing configuration
investment_accounts	Investment/bank account information
offerings	IPO offering information
investments	User-level IPO investment and transaction records

The application uses Supabase as its backend service and connects to the database through the Supabase JavaScript client.

⸻

🔑 Environment Variables

Create a .env.local file in the project root:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

Never commit your actual Supabase credentials to the repository.

⸻

🚀 Getting Started

1. Clone the repository

git clone https://github.com/yorukokan/ipo-finance-tracker.git

2. Navigate to the project

cd ipo-finance-tracker

3. Install dependencies

npm install

4. Configure environment variables

Create .env.local and add your Supabase configuration:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

5. Start the development server

npm run dev

6. Open the application

Visit:

http://localhost:3000

⸻

📜 Available Scripts

Command	Description
npm run dev	Starts the development server
npm run build	Creates a production build
npm run start	Starts the production server
npm run lint	Runs ESLint

⸻

🌐 Deployment

The application is deployed using Vercel.

Live Application

https://arz-finans-takip.vercel.app/

The production application uses the same Next.js application architecture and Supabase backend.

⸻

🎯 Project Goals

The main goal of the project is to replace scattered spreadsheets, messages, screenshots, and manual calculations with a centralized financial tracking system.

Instead of managing each IPO transaction separately, the application brings the entire workflow together:

IPO
 ↓
Application
 ↓
Allocation
 ↓
Investment
 ↓
Sale
 ↓
Profit / Loss
 ↓
Profit Sharing
 ↓
Cash Return

This makes the overall process easier to monitor and reduces the need for manual financial calculations.

⸻

🔮 Future Improvements

Potential improvements for future versions include:

* Advanced financial charts
* More detailed portfolio analytics
* Automated notifications
* Exporting financial reports
* More detailed transaction history
* Improved mobile/PWA support
* Automated market data integration
* More granular audit logs

⸻

⚠️ Disclaimer

This project is developed for educational and personal financial tracking purposes.

It does not provide investment advice, financial recommendations, or guarantees regarding investment returns.

⸻

👨‍💻 Developer

Okan Yörük

Computer Engineering Student & Software Developer

* GitHub: https://github.com/yorukokan
* LinkedIn: https://linkedin.com/in/okanyoruk

⸻

⭐ If you find this project useful, consider giving the repository a star.
