# 🚀 CPM Sampling Campaign Dashboard

A powerful, enterprise-grade multi-tenant dashboard for managing and analyzing sampling campaigns. Built with Express.js, React, and TypeScript.

![Dashboard Preview](https://img.shields.io/badge/Status-Production_Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)

## ✨ Features

### 📊 Campaign Analytics
- **Real-time Dashboard** - Live metrics with automatic refresh
- **Multi-Campaign Support** - Track multiple sampling campaigns simultaneously
- **Interactive Visualizations** - Beautiful charts with Recharts
- **Date Range Filtering** - Analyze data across custom time periods (including "All Time")
- **Machine Uptime Tracking** - Monitor device reliability and downtime
- **Product Breakdown** - Analyze product preferences and distribution
- **Hourly Traffic Analysis** - Understand peak engagement times

### 🏢 Multi-Tenant Architecture
- **Tenant Isolation** - Complete data separation between clients
- **Custom Branding** - Unique styling per tenant (ASDA, RetailCo, BrandX)
- **Tenant Switching** - Seamless navigation between tenants
- **Per-Tenant User Management** - Granular access control

### 🔐 Security & Authentication
- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Role-Based Access Control (RBAC)** - Admin, Manager, User roles
- **Password Reset** - Email-based password recovery
- **Session Management** - Secure session handling
- **Rate Limiting** - Protection against abuse
- **Helmet.js** - HTTP security headers

### 🎯 Predictive Analytics
- **ML-Powered Forecasting** - Trend predictions using:
  - Linear Regression
  - Moving Average
  - Exponential Smoothing
  - Ensemble Methods
- **Anomaly Detection** - Automatic identification of unusual patterns
- **R² Confidence Scores** - Prediction accuracy metrics

### 📤 Data Export
- **Multi-Format Export** - CSV, Excel (XLSX), JSON, XML
- **Scheduled Exports** - Automated recurring exports
- **Email Delivery** - Direct export delivery to email
- **Export History** - Track all export activities

### 🌐 Progressive Web App (PWA)
- **Offline Support** - Full functionality without internet
- **Mobile Optimized** - Responsive design for all devices
- **Background Sync** - Data syncs when connection restores
- **Push Notifications** - Real-time alerts (when configured)
- **Install Prompt** - Add to home screen capability

### 🌓 Accessibility & UX
- **Dark Mode** - System-aware theme switching
- **High Contrast Mode** - Enhanced visibility option
- **Reduced Motion** - Respects system preferences
- **Keyboard Navigation** - Full keyboard accessibility
- **WCAG 2.1 AA Compliant** - Accessible to all users

### 🔗 API & Integrations
- **Swagger Documentation** - Interactive API docs at `/api-docs`
- **Webhook System** - Real-time event notifications
- **HMAC-SHA256 Signing** - Secure webhook payloads
- **Retry Logic** - Automatic retry on webhook failures

---

## 📋 Prerequisites

- **Node.js** v20.x or higher
- **npm** v10.x or higher

---

## 🔧 Quick Start

### 1. Install Dependencies

   ```bash
   npm install
   cd client && npm install && cd ..
   ```

### 2. Environment Setup
   
The `.env` file is pre-configured with:
- Port: `3720`
   - Auto-generated JWT and session secrets
   - SQLite database path

### 3. Database Setup

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

### 4. Start Development Server

```bash
npm run dev
```

🌐 **Dashboard:** http://localhost:3720

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@example.com | Admin123! |
| **ASDA Executive** | asda.exec@example.com | ASDA123! |
| **CPM Manager** | cpm.manager@example.com | CPM123! |

---

## 🏗️ Project Structure

```
apname/
├── 📁 client/                 # React Frontend
│   ├── src/
│   │   ├── components/        # UI Components
│   │   ├── pages/             # Page Components
│   │   ├── contexts/          # React Contexts
│   │   ├── services/          # API Services
│   │   └── data/              # Static Campaign Data
│   └── public/                # Static Assets & PWA
├── 📁 routes/                 # Express API Routes
├── 📁 controllers/            # Route Controllers
├── 📁 models/                 # Sequelize Models
├── 📁 services/               # Business Logic
│   ├── email.ts               # Email Service
│   ├── exportService.ts       # Data Export
│   ├── predictiveAnalytics.ts # ML Predictions
│   ├── scheduledExportService.ts # Cron Jobs
│   └── webhookService.ts      # Webhook Dispatch
├── 📁 middleware/             # Express Middleware
├── 📁 auth/                   # Authentication
├── 📁 db/                     # Migrations & Seeders
├── 📄 app.ts                  # Express App
└── 📄 swagger.ts              # API Documentation
```

---

## 📡 API Documentation

Interactive API documentation available at:

```
http://localhost:3720/api-docs
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user |
| `/api/tenants` | GET | List all tenants |
| `/api/campaigns` | GET | Get campaigns by tenant |
| `/api/analytics/predictions` | GET | Get ML predictions |
| `/api/exports` | POST | Export campaign data |
| `/api/webhooks` | GET/POST | Manage webhooks |
| `/api/scheduled-exports` | GET/POST | Manage scheduled exports |

---

## 🗄️ Database Commands

```bash
npm run db:migrate        # Run migrations
npm run db:migrate:undo   # Rollback last migration
npm run db:seed           # Run seeders
npm run db:reset          # Full reset
```

---

## 🚀 Production Deployment

### Build

```bash
npm run build:all
```

### Start

```bash
npm start
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3720 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT signing key | Auto-generated |
| `DATABASE_URL` | PostgreSQL URL | - |
| `SMTP_HOST` | Email server | - |
| `SMTP_PORT` | Email port | 587 |
| `SMTP_USER` | Email username | - |
| `SMTP_PASS` | Email password | - |

---

## 📧 Email Configuration

For scheduled exports and password resets:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com
```

---

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (frontend + backend) |
| `npm run dev:server` | Backend only |
| `npm run dev:client` | Frontend only |
| `npm run build:all` | Production build |
| `npm start` | Start production server |

### Adding UI Components

```bash
cd client
npx shadcn@latest add [component-name]
```

---

## 🎨 Theming

The dashboard supports multiple themes:

- **Light Mode** - Clean, bright interface
- **Dark Mode** - Easy on the eyes
- **High Contrast** - Enhanced accessibility
- **Reduced Motion** - Minimal animations

Toggle in Settings or system preferences.

---

## 📱 PWA Installation

### Desktop
1. Visit the dashboard
2. Click install icon in address bar
3. Click "Install"

### Mobile
1. Visit the dashboard
2. Tap "Share" → "Add to Home Screen"

---

## 🐛 Troubleshooting

**Port in use:**
```bash
lsof -i :3720 | grep LISTEN
kill -9 [PID]
```

**Database issues:**
```bash
npm run db:reset
```

**Build errors:**
```bash
rm -rf dist node_modules client/node_modules
npm install
cd client && npm install && cd ..
npm run build:all
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 💼 About

Built by **bright.blue** for sampling campaign management.

**Features:**
- Multi-tenant architecture
- Real-time analytics
- ML-powered predictions
- Enterprise security
- PWA capabilities

---

<p align="center">
Built with ❤️ using Express.js, React, TypeScript, and shadcn/ui
</p>
