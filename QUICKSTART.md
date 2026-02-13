# Multi-Tenant Dashboard - Quick Start

## 🚀 Get Started in 5 Minutes

### Step 0: Environment

```bash
cp .env.example .env
# Edit .env if needed (JWT_SECRET, DATABASE_URL for Postgres, etc.)
```

### Step 1: Install Dependencies

```bash
cd apname

# Backend dependencies
npm install csv-parser multer
npm install --save-dev @types/multer

# Install all dependencies
npm install

# Frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Setup Database

```bash
# Run migrations (creates tables)
npm run db:migrate

# Seed database (creates demo data)
npm run db:seed
```

**If full seed fails** (e.g. RBAC validation errors), run only the engagement seeder:
```bash
npx sequelize-cli db:seed --seed 20260213130000-seed-engagement-data.js
```
Note: You may need to run the RBAC/multi-tenancy seeders first if tables are empty. Full seed fix is TBD.

### Step 3: Start Application

```bash
# Development mode (both frontend & backend)
npm run dev

# Or start separately:
# Backend only: npm run dev:server
# Frontend only: cd client && npm start
```

### Step 4: Login

Open `http://localhost:3720` in your browser.

**Super Admin Account:**
- Email: `super@admin.com`
- Password: `SuperAdmin123!`

**Dashboard Users (ASDA Demo):**
- ASDA Executive: `asda.exec@example.com` / `ASDA123!`
- CPM Manager: `cpm.manager@example.com` / `CPM123!`

## 🎯 Key Features to Try

### As Super Admin

1. **Manage Tenants** - Click "Tenants" in header
   - Create new tenant with custom branding
   - Upload CSV files
   - Assign users to tenants

2. **Manage Users** - Click "Users" in header
   - Create users and assign roles
   - Assign users to multiple tenants

3. **View All Data** - Access dashboard
   - See campaigns from all tenants
   - Switch between tenants using dropdown

### As Regular User

1. **View Dashboard** - See campaigns for assigned tenants
2. **Switch Tenants** - Use tenant selector if assigned to multiple
3. **Print Reports** - Use browser print function

## 📋 Demo Tenants Created

1. **ASDA Demo** (Green theme)
   - 3 campaigns: That's Nuts, Bahlsen, Aveeno
   - Has sample campaign data

2. **RetailCo** (Blue theme)
   - No campaigns yet
   - Ready for CSV uploads

3. **BrandX Marketing** (Purple theme)
   - No campaigns yet
   - Ready for CSV uploads

## 🔧 Useful Commands

```bash
# Reset database
npm run db:reset

# Run migrations only
npm run db:migrate

# Run seeders only
npm run db:seed

# Build for production
npm run build:all

# Start production server
npm start

# Stop development servers
# Press Ctrl+C in terminal
```

## 📁 Key Files

- **Setup Guide**: `MULTI_TENANT_SETUP.md` - Comprehensive documentation
- **Summary**: `IMPLEMENTATION_SUMMARY.md` - What was implemented
- **Plan**: `multi-tenant-dashboard-implementation.plan.md` - Original plan

## 🆘 Troubleshooting

**Error: "Cannot find module 'csv-parser'"**
```bash
npm install csv-parser multer
npm install --save-dev @types/multer
```

**Error: Database tables don't exist**
```bash
npm run db:migrate
```

**Error: No users can login**
```bash
npm run db:seed
```

**Port 3720 already in use**
- Edit `.env` file and change `PORT=3720` to another port
- Or stop the process using port 3720

**Tenant selector not showing**
- Make sure you're logged in
- Check if user is assigned to multiple tenants
- Refresh the page

**CSV upload fails**
- Check file is valid CSV format
- Ensure file size is under 10MB
- Verify you're logged in as admin/super_admin

## ✅ Verification Checklist

After setup, verify:
- [ ] Can login as super admin
- [ ] Can see "Tenants" and "Users" buttons in header
- [ ] Can access `/admin/tenants` page
- [ ] Can see 3 demo tenants listed
- [ ] Can view ASDA Demo campaigns in dashboard
- [ ] Can switch between tenants (if assigned to multiple)
- [ ] Tenant colors apply when switching
- [ ] Can create new tenant
- [ ] Can upload CSV file

## 🎓 Learning Resources

1. **Multi-Tenant Architecture**: Read `MULTI_TENANT_SETUP.md`
2. **API Documentation**: See API Endpoints section in setup guide
3. **Database Schema**: See Database Schema section
4. **CSV Formats**: See CSV Upload section

## 🎉 You're Ready!

The multi-tenant dashboard is now fully operational. Explore the features and customize to your needs!

For detailed information, see `MULTI_TENANT_SETUP.md`.

---

**Need Help?** Refer to the comprehensive documentation in `MULTI_TENANT_SETUP.md` or check the implementation summary in `IMPLEMENTATION_SUMMARY.md`.

