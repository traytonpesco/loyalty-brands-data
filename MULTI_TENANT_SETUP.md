# Multi-Tenant Dashboard Setup Guide

This document provides comprehensive instructions for setting up and running the multi-tenant ASDA CPM Campaign Dashboard.

## Overview

The application has been transformed into a fully multi-tenant system with:
- Multiple operators/tenants with their own dashboards
- Tenant-specific CSV data uploads
- Customizable branding (colors, logos) per tenant
- Role-Based Access Control (RBAC) with super-admins and tenant-specific users
- Users can belong to multiple tenants

## Prerequisites

- Node.js v20.11.0+ and npm 10.2.4+
- SQLite3 (for development)

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd apname
npm install csv-parser multer @types/multer --save
npm install
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 3. Run Database Migrations

Execute the migrations to create the multi-tenant schema:

```bash
npm run db:migrate
```

This will create the following tables:
- `Tenants` - Store tenant information and branding
- `UserTenants` - Junction table for many-to-many user-tenant relationships
- `Campaigns` - Campaign data per tenant
- `CampaignMetrics` - Parsed CSV metrics (products, busy time, etc.)
- `CSVUploads` - Track uploaded CSV files

### 4. Seed the Database

Populate the database with initial data:

```bash
npm run db:seed
```

This creates:
- **Super Admin Account**: `super@admin.com` / `SuperAdmin123!`
- **3 Demo Tenants**: ASDA Demo, RetailCo, BrandX Marketing
- **Sample Campaigns**: That's Nuts, Bahlsen, Aveeno (for ASDA Demo)
- **Existing Users**: Assigned to ASDA Demo tenant

### 5. Start the Application

**Development Mode** (runs both backend and frontend):
```bash
npm run dev
```

**Production Mode**:
```bash
npm run build:all
npm start
```

The application will be available at `http://localhost:3720`

## User Accounts

### Super Admin
- **Email**: `super@admin.com`
- **Password**: `SuperAdmin123!`
- **Access**: All tenants, full admin capabilities

### Existing Dashboard Users (ASDA Demo Tenant)
- **ASDA Executive**: `asda.exec@example.com` / `ASDA123!`
- **CPM Manager**: `cpm.manager@example.com` / `CPM123!`

### Original Admin
- **Email**: `admin@example.com`
- **Password**: `Admin123!`

## Features

### Tenant Management (Super Admin Only)

Navigate to `/admin/tenants` to:
- Create new tenants with custom branding
- Edit tenant details (name, slug, colors, logo)
- Upload CSV files for campaigns
- Assign/remove users to/from tenants
- View campaign data per tenant

### Branding Customization

Each tenant can have:
- **Primary Color**: Main brand color
- **Secondary Color**: Complementary color
- **Accent Color**: Highlight color
- **Logo URL**: Path to logo image

These are applied dynamically when a tenant is selected.

### CSV Upload

Admins can upload CSV files for each tenant:
1. Go to **Manage Tenants**
2. Click the **Upload** icon for a tenant
3. Select a CSV file (transaction reports, product data, or summary reports)
4. The system automatically detects CSV type and parses data

**Supported CSV Formats**:
- Transaction reports (with timestamp/hour data)
- Product reports (with product names and clicks)
- Summary reports (full campaign metrics)

### Multi-Tenant Access

Users can be assigned to multiple tenants:
1. Navigate to **Manage Tenants** (super admin)
2. Select a tenant
3. Click **Manage Users**
4. Add/remove users

When logged in, users with multiple tenants see a **Tenant Selector** in the header to switch between their available tenants.

### User Management

Navigate to `/admin/users` to:
- Create new users
- Assign roles (super_admin, admin, asda_executive, cpm_manager, user)
- Manage user status (active/inactive)
- Send password reset emails

## API Endpoints

### Tenant Endpoints
- `GET /api/admin/tenants` - List all tenants
- `POST /api/admin/tenants` - Create tenant
- `PUT /api/admin/tenants/:id` - Update tenant
- `DELETE /api/admin/tenants/:id` - Deactivate tenant
- `POST /api/admin/tenants/:id/users` - Assign users to tenant
- `POST /api/admin/tenants/:id/upload-csv` - Upload CSV for tenant
- `GET /api/admin/tenants/:id/campaigns` - Get tenant campaigns

### Campaign Endpoints
- `GET /api/campaigns` - Get campaigns for user's tenants
- `GET /api/campaigns/:id` - Get campaign details with metrics
- `GET /api/campaigns/tenant/:tenantId/aggregate` - Get aggregated metrics
- `DELETE /api/campaigns/:id` - Delete campaign

## Permissions

### Roles & Permissions

**super_admin**
- All permissions
- Access to all tenants
- Can manage tenants, users, and data

**admin**
- User management
- Dashboard access

**asda_executive / cpm_manager**
- Dashboard read access
- View campaigns for assigned tenants

**Permissions**:
- `tenants.read` - View tenants
- `tenants.write` - Create/edit tenants
- `campaigns.read` - View campaigns
- `campaigns.upload` - Upload CSV files
- `users.read` / `users.write` - User management
- `dashboard.read` - Dashboard access

## Architecture

### Backend Structure
```
apname/
├── models/
│   └── index.ts              # Sequelize models (User, Tenant, Campaign, etc.)
├── routes/
│   ├── admin.tenants.ts      # Tenant management routes
│   ├── campaigns.ts          # Campaign routes with tenant filtering
│   ├── admin.users.ts        # User management routes
│   └── auth.api.ts           # Authentication routes
├── middleware/
│   └── rbac.ts               # RBAC middleware with tenant awareness
├── services/
│   ├── csvParser.ts          # CSV parsing service
│   └── email.ts              # Email service
├── db/
│   ├── migrations/
│   │   └── 20231011120000-add-multi-tenancy.js
│   └── seeders/
│       └── 20231011121000-seed-multi-tenancy.js
└── app.ts                    # Express app with route registration
```

### Frontend Structure
```
client/src/
├── contexts/
│   └── TenantContext.tsx     # Tenant state management
├── components/
│   ├── TenantSelector.tsx    # Tenant dropdown selector
│   └── AppHeader.tsx         # Updated with tenant selector & admin links
├── pages/
│   ├── Dashboard.tsx         # Dynamic dashboard with API integration
│   ├── AdminTenants.tsx      # Tenant management UI
│   └── ...
└── App.tsx                   # Routes with TenantProvider
```

## Database Schema

### Key Tables

**Tenants**
- Stores tenant information and branding configuration

**UserTenants**
- Many-to-many relationship between users and tenants
- Allows users to belong to multiple tenants

**Campaigns**
- Campaign data linked to specific tenants
- Parsed from CSV uploads or manually created

**CampaignMetrics**
- Stores metric data (products, busyTime) as JSON
- Linked to campaigns

**CSVUploads**
- Tracks CSV file uploads and processing status
- Links to tenant and uploader

## Customization

### Adding New Tenants

1. Log in as super admin
2. Navigate to **Manage Tenants**
3. Click **New Tenant**
4. Configure:
   - Name and slug
   - Brand colors
   - Logo URL
5. Upload CSV data
6. Assign users

### Adding Custom Branding

Tenant colors are automatically applied via CSS variables:
- `--tenant-primary`
- `--tenant-secondary`
- `--tenant-accent`

Use these in your components for dynamic theming.

## Troubleshooting

### CSV Upload Fails
- Ensure CSV file is properly formatted
- Check file size (10MB limit)
- Verify user has `campaigns.upload` permission

### User Can't See Tenant
- Verify user is assigned to tenant in UserTenants table
- Check tenant `isActive` status
- Ensure user has logged out and back in (to refresh JWT)

### Branding Not Applying
- Clear browser cache
- Check tenant has valid hex color codes
- Verify selectedTenant is set in TenantContext

## Development Notes

### Adding New CSV Formats

Edit `apname/services/csvParser.ts`:
1. Add detection logic in `detectCSVType()`
2. Create parser method for the new format
3. Map data to Campaign and CampaignMetric models

### Creating New Roles

1. Add role to database: `INSERT INTO Roles (name) VALUES ('new_role')`
2. Assign permissions via RolePermissions table
3. Update middleware/rbac.ts if special logic needed
4. Add role to ProtectedRoute in frontend

## Security Considerations

- JWT tokens include tenant IDs to prevent cross-tenant access
- All API routes verify tenant access via middleware
- Super admins bypass tenant restrictions
- File uploads are validated and stored securely
- Passwords are hashed with bcrypt (12 rounds)

## Production Deployment

1. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3720
   JWT_SECRET=<strong-secret>
   SESSION_SECRET=<strong-secret>
   DATABASE_URL=<production-database>
   ```

2. Build the application:
   ```bash
   npm run build:all
   ```

3. Run migrations in production:
   ```bash
   NODE_ENV=production npm run db:migrate
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Support & Further Development

For questions or issues, refer to the implementation plan in `multi-tenant-dashboard-implementation.plan.md`.

### Future Enhancements

Potential improvements:
- File storage service (S3, Azure Blob) for logos and CSVs
- Tenant-specific custom domains
- Advanced analytics per tenant
- Scheduled CSV imports
- Audit logging per tenant
- Multi-language support per tenant
- Tenant usage metrics and billing

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Implementation**: Complete

