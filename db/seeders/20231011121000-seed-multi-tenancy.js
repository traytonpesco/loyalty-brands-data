'use strict';

const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get super_admin role
    const superAdminRole = await queryInterface.sequelize.query(
      "SELECT id FROM Roles WHERE name = 'super_admin' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const superAdminRoleId = superAdminRole[0]?.id;

    // Create super admin user
    const superAdminEmail = 'super@admin.com';
    const superAdminPassword = 'SuperAdmin123!';
    const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 12);
    const superAdminUserId = randomUUID();

    await queryInterface.bulkInsert('Users', [
      {
        id: superAdminUserId,
        email: superAdminEmail,
        passwordHash: superAdminPasswordHash,
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Assign super_admin role to super admin user
    if (superAdminRoleId) {
      await queryInterface.bulkInsert('UserRoles', [
        {
          userId: superAdminUserId,
          roleId: superAdminRoleId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }

    // Create demo tenants
    const asdaTenantId = randomUUID();
    const retailCoTenantId = randomUUID();
    const brandXTenantId = randomUUID();

    await queryInterface.bulkInsert('Tenants', [
      {
        id: asdaTenantId,
        name: 'ASDA Demo',
        slug: 'asda-demo',
        logoUrl: '/images/ASDA_logo.svg.png',
        primaryColor: '#78BE20',
        secondaryColor: '#006633',
        accentColor: '#78BE20',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: retailCoTenantId,
        name: 'RetailCo',
        slug: 'retailco',
        logoUrl: null,
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        accentColor: '#3b82f6',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: brandXTenantId,
        name: 'BrandX Marketing',
        slug: 'brandx',
        logoUrl: null,
        primaryColor: '#7c3aed',
        secondaryColor: '#6d28d9',
        accentColor: '#8b5cf6',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Assign super admin to all tenants
    await queryInterface.bulkInsert('UserTenants', [
      {
        userId: superAdminUserId,
        tenantId: asdaTenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: superAdminUserId,
        tenantId: retailCoTenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: superAdminUserId,
        tenantId: brandXTenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Assign existing users to ASDA Demo tenant (including admin)
    const existingUsers = await queryInterface.sequelize.query(
      "SELECT id FROM Users WHERE email IN ('admin@example.com', 'asda.exec@example.com', 'cpm.manager@example.com')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const userTenantAssignments = existingUsers.map(user => ({
      userId: user.id,
      tenantId: asdaTenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (userTenantAssignments.length > 0) {
      await queryInterface.bulkInsert('UserTenants', userTenantAssignments);
    }

    // Create sample campaigns for ASDA Demo tenant
    const thatsNutsCampaignId = randomUUID();
    const bahlsenCampaignId = randomUUID();
    const aveenoCampaignId = randomUUID();

    await queryInterface.bulkInsert('Campaigns', [
      {
        id: thatsNutsCampaignId,
        tenantId: asdaTenantId,
        name: "That's Nuts",
        machineId: 'BB SV365 9052627 EUROPA 200002',
        startDate: new Date('2025-08-20'),
        endDate: new Date('2025-09-10'),
        totalProductsDispensed: 2579,
        totalUserInteractions: 3308,
        totalFreeSamplesRedeemed: 2579,
        totalProductClicks: 3216,
        uniqueCustomers: 2258,
        averageEngagementTime: 75,
        adPlaytime: 13,
        totalAdPlays: 132923,
        machineOfflineMinutes: 47,
        totalHours: 480,
        machineUptimePercent: 99.84,
        restockTimes: 10,
        restockDays: 20,
        productDetails: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: bahlsenCampaignId,
        tenantId: asdaTenantId,
        name: 'Bahlsen',
        machineId: 'BB SV365 9052627 EUROPA 200002',
        startDate: new Date('2025-09-10'),
        endDate: new Date('2025-10-01'),
        totalProductsDispensed: 2724,
        totalUserInteractions: 3836,
        totalFreeSamplesRedeemed: 2724,
        totalProductClicks: 3514,
        uniqueCustomers: 2262,
        averageEngagementTime: 80,
        adPlaytime: 27,
        totalAdPlays: 64000,
        machineOfflineMinutes: 0,
        totalHours: 480,
        machineUptimePercent: 100.00,
        restockTimes: 10,
        restockDays: 20,
        productDetails: 3668,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: aveenoCampaignId,
        tenantId: asdaTenantId,
        name: 'Aveeno',
        machineId: 'BB SV365 9052627 EUROPA 200002',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-21'),
        totalProductsDispensed: 2237,
        totalUserInteractions: 3633,
        totalFreeSamplesRedeemed: 2237,
        totalProductClicks: 3166,
        uniqueCustomers: 1853,
        averageEngagementTime: 80,
        adPlaytime: 17,
        totalAdPlays: 106729,
        machineOfflineMinutes: 0,
        totalHours: 480,
        machineUptimePercent: 100.00,
        restockTimes: 9,
        restockDays: 20,
        productDetails: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // RetailCo Campaigns
      {
        id: randomUUID(),
        tenantId: retailCoTenantId,
        name: 'Fresh Smoothies',
        machineId: 'RC SV500 8421945 METRO 100045',
        startDate: new Date('2025-07-15'),
        endDate: new Date('2025-08-05'),
        totalProductsDispensed: 1845,
        totalUserInteractions: 2567,
        totalFreeSamplesRedeemed: 1845,
        totalProductClicks: 2421,
        uniqueCustomers: 1756,
        averageEngagementTime: 62,
        adPlaytime: 18,
        totalAdPlays: 89453,
        machineOfflineMinutes: 23,
        totalHours: 504,
        machineUptimePercent: 99.92,
        restockTimes: 12,
        restockDays: 21,
        productDetails: 2134,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        tenantId: retailCoTenantId,
        name: 'Protein Bars',
        machineId: 'RC SV500 8421945 METRO 100045',
        startDate: new Date('2025-08-05'),
        endDate: new Date('2025-08-27'),
        totalProductsDispensed: 3124,
        totalUserInteractions: 4287,
        totalFreeSamplesRedeemed: 3124,
        totalProductClicks: 3956,
        uniqueCustomers: 2845,
        averageEngagementTime: 68,
        adPlaytime: 22,
        totalAdPlays: 112890,
        machineOfflineMinutes: 0,
        totalHours: 528,
        machineUptimePercent: 100.00,
        restockTimes: 15,
        restockDays: 22,
        productDetails: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        tenantId: retailCoTenantId,
        name: 'Energy Drinks',
        machineId: 'RC SV500 8421945 METRO 100045',
        startDate: new Date('2025-08-27'),
        endDate: new Date('2025-09-18'),
        totalProductsDispensed: 2967,
        totalUserInteractions: 4156,
        totalFreeSamplesRedeemed: 2967,
        totalProductClicks: 3789,
        uniqueCustomers: 2534,
        averageEngagementTime: 58,
        adPlaytime: 15,
        totalAdPlays: 98765,
        machineOfflineMinutes: 12,
        totalHours: 528,
        machineUptimePercent: 99.96,
        restockTimes: 11,
        restockDays: 22,
        productDetails: 3245,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BrandX Marketing Campaigns
      {
        id: randomUUID(),
        tenantId: brandXTenantId,
        name: 'Luxury Chocolates',
        machineId: 'BX SV750 7653289 PLAZA 300012',
        startDate: new Date('2025-06-10'),
        endDate: new Date('2025-07-02'),
        totalProductsDispensed: 1567,
        totalUserInteractions: 2134,
        totalFreeSamplesRedeemed: 1567,
        totalProductClicks: 1987,
        uniqueCustomers: 1423,
        averageEngagementTime: 92,
        adPlaytime: 25,
        totalAdPlays: 67890,
        machineOfflineMinutes: 0,
        totalHours: 528,
        machineUptimePercent: 100.00,
        restockTimes: 8,
        restockDays: 22,
        productDetails: 1765,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        tenantId: brandXTenantId,
        name: 'Gourmet Coffee',
        machineId: 'BX SV750 7653289 PLAZA 300012',
        startDate: new Date('2025-07-02'),
        endDate: new Date('2025-07-24'),
        totalProductsDispensed: 2156,
        totalUserInteractions: 3012,
        totalFreeSamplesRedeemed: 2156,
        totalProductClicks: 2789,
        uniqueCustomers: 1987,
        averageEngagementTime: 87,
        adPlaytime: 28,
        totalAdPlays: 78654,
        machineOfflineMinutes: 34,
        totalHours: 528,
        machineUptimePercent: 99.89,
        restockTimes: 9,
        restockDays: 22,
        productDetails: 2567,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        tenantId: brandXTenantId,
        name: 'Artisan Snacks',
        machineId: 'BX SV750 7653289 PLAZA 300012',
        startDate: new Date('2025-07-24'),
        endDate: new Date('2025-08-15'),
        totalProductsDispensed: 1923,
        totalUserInteractions: 2678,
        totalFreeSamplesRedeemed: 1923,
        totalProductClicks: 2456,
        uniqueCustomers: 1765,
        averageEngagementTime: 95,
        adPlaytime: 31,
        totalAdPlays: 85432,
        machineOfflineMinutes: 0,
        totalHours: 528,
        machineUptimePercent: 100.00,
        restockTimes: 7,
        restockDays: 22,
        productDetails: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create campaign metrics for products
    await queryInterface.bulkInsert('CampaignMetrics', [
      {
        id: randomUUID(),
        campaignId: thatsNutsCampaignId,
        metricType: 'products',
        data: JSON.stringify([
          { name: "That's Nuts Salt & Vinegar", clicks: 1551 },
          { name: "That's Nuts Smoky Bacon", clicks: 1665 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: thatsNutsCampaignId,
        metricType: 'busyTime',
        data: JSON.stringify([
          { hour: '00-01', interactions: 9 },
          { hour: '01-02', interactions: 8 },
          { hour: '02-03', interactions: 11 },
          { hour: '03-04', interactions: 2 },
          { hour: '04-05', interactions: 1 },
          { hour: '05-06', interactions: 4 },
          { hour: '06-07', interactions: 5 },
          { hour: '07-08', interactions: 12 },
          { hour: '08-09', interactions: 29 },
          { hour: '09-10', interactions: 57 },
          { hour: '10-11', interactions: 183 },
          { hour: '11-12', interactions: 228 },
          { hour: '12-13', interactions: 362 },
          { hour: '13-14', interactions: 252 },
          { hour: '14-15', interactions: 226 },
          { hour: '15-16', interactions: 230 },
          { hour: '16-17', interactions: 183 },
          { hour: '17-18', interactions: 167 },
          { hour: '18-19', interactions: 207 },
          { hour: '19-20', interactions: 151 },
          { hour: '20-21', interactions: 97 },
          { hour: '21-22', interactions: 79 },
          { hour: '22-23', interactions: 45 },
          { hour: '23-24', interactions: 31 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: bahlsenCampaignId,
        metricType: 'products',
        data: JSON.stringify([
          { name: 'Pick Up', clicks: 1838 },
          { name: 'Bahlsen Choco Leibniz', clicks: 1676 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: bahlsenCampaignId,
        metricType: 'busyTime',
        data: JSON.stringify([
          { hour: '00-01', interactions: 41 },
          { hour: '01-02', interactions: 32 },
          { hour: '02-03', interactions: 32 },
          { hour: '03-04', interactions: 5 },
          { hour: '04-05', interactions: 7 },
          { hour: '05-06', interactions: 10 },
          { hour: '06-07', interactions: 13 },
          { hour: '07-08', interactions: 33 },
          { hour: '08-09', interactions: 104 },
          { hour: '09-10', interactions: 204 },
          { hour: '10-11', interactions: 650 },
          { hour: '11-12', interactions: 804 },
          { hour: '12-13', interactions: 957 },
          { hour: '13-14', interactions: 748 },
          { hour: '14-15', interactions: 545 },
          { hour: '15-16', interactions: 657 },
          { hour: '16-17', interactions: 512 },
          { hour: '17-18', interactions: 504 },
          { hour: '18-19', interactions: 617 },
          { hour: '19-20', interactions: 438 },
          { hour: '20-21', interactions: 323 },
          { hour: '21-22', interactions: 239 },
          { hour: '22-23', interactions: 201 },
          { hour: '23-24', interactions: 110 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: aveenoCampaignId,
        metricType: 'products',
        data: JSON.stringify([
          { name: 'Skin Relief', clicks: 1625 },
          { name: 'Daily Care', clicks: 1215 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: aveenoCampaignId,
        metricType: 'busyTime',
        data: JSON.stringify([
          { hour: '00-01', interactions: 16 },
          { hour: '01-02', interactions: 1 },
          { hour: '02-03', interactions: 2 },
          { hour: '03-04', interactions: 2 },
          { hour: '04-05', interactions: 1 },
          { hour: '05-06', interactions: 1 },
          { hour: '06-07', interactions: 10 },
          { hour: '07-08', interactions: 24 },
          { hour: '08-09', interactions: 29 },
          { hour: '09-10', interactions: 68 },
          { hour: '10-11', interactions: 159 },
          { hour: '11-12', interactions: 197 },
          { hour: '12-13', interactions: 340 },
          { hour: '13-14', interactions: 241 },
          { hour: '14-15', interactions: 121 },
          { hour: '15-16', interactions: 138 },
          { hour: '16-17', interactions: 114 },
          { hour: '17-18', interactions: 161 },
          { hour: '18-19', interactions: 230 },
          { hour: '19-20', interactions: 162 },
          { hour: '20-21', interactions: 123 },
          { hour: '21-22', interactions: 59 },
          { hour: '22-23', interactions: 24 },
          { hour: '23-24', interactions: 20 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // RetailCo Campaign Metrics
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Fresh Smoothies' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'products',
        data: JSON.stringify([
          { name: 'Mango Passion Smoothie', clicks: 1345 },
          { name: 'Berry Blast Smoothie', clicks: 1076 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Fresh Smoothies' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'busyTime',
        data: JSON.stringify([
          { hour: '00-01', interactions: 3 },
          { hour: '01-02', interactions: 2 },
          { hour: '02-03', interactions: 1 },
          { hour: '03-04', interactions: 0 },
          { hour: '04-05', interactions: 2 },
          { hour: '05-06', interactions: 8 },
          { hour: '06-07', interactions: 15 },
          { hour: '07-08', interactions: 45 },
          { hour: '08-09', interactions: 89 },
          { hour: '09-10', interactions: 142 },
          { hour: '10-11', interactions: 178 },
          { hour: '11-12', interactions: 245 },
          { hour: '12-13', interactions: 312 },
          { hour: '13-14', interactions: 287 },
          { hour: '14-15', interactions: 198 },
          { hour: '15-16', interactions: 234 },
          { hour: '16-17', interactions: 189 },
          { hour: '17-18', interactions: 156 },
          { hour: '18-19', interactions: 134 },
          { hour: '19-20', interactions: 98 },
          { hour: '20-21', interactions: 67 },
          { hour: '21-22', interactions: 45 },
          { hour: '22-23', interactions: 23 },
          { hour: '23-24', interactions: 12 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Protein Bars' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'products',
        data: JSON.stringify([
          { name: 'Chocolate Peanut Protein Bar', clicks: 2134 },
          { name: 'Vanilla Almond Protein Bar', clicks: 1822 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Protein Bars' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'busyTime',
        data: JSON.stringify([
          { hour: '00-01', interactions: 12 },
          { hour: '01-02', interactions: 8 },
          { hour: '02-03', interactions: 5 },
          { hour: '03-04', interactions: 3 },
          { hour: '04-05', interactions: 7 },
          { hour: '05-06', interactions: 22 },
          { hour: '06-07', interactions: 56 },
          { hour: '07-08', interactions: 98 },
          { hour: '08-09', interactions: 156 },
          { hour: '09-10', interactions: 234 },
          { hour: '10-11', interactions: 298 },
          { hour: '11-12', interactions: 367 },
          { hour: '12-13', interactions: 445 },
          { hour: '13-14', interactions: 398 },
          { hour: '14-15', interactions: 345 },
          { hour: '15-16', interactions: 312 },
          { hour: '16-17', interactions: 267 },
          { hour: '17-18', interactions: 234 },
          { hour: '18-19', interactions: 198 },
          { hour: '19-20', interactions: 156 },
          { hour: '20-21', interactions: 123 },
          { hour: '21-22', interactions: 89 },
          { hour: '22-23', interactions: 45 },
          { hour: '23-24', interactions: 28 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Energy Drinks' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'products',
        data: JSON.stringify([
          { name: 'Ultra Energy Blue', clicks: 2045 },
          { name: 'Power Burst Green', clicks: 1744 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Energy Drinks' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'busyTime',
        data: JSON.stringify([
          { hour: '00-01', interactions: 34 },
          { hour: '01-02', interactions: 28 },
          { hour: '02-03', interactions: 23 },
          { hour: '03-04', interactions: 12 },
          { hour: '04-05', interactions: 15 },
          { hour: '05-06', interactions: 34 },
          { hour: '06-07', interactions: 67 },
          { hour: '07-08', interactions: 112 },
          { hour: '08-09', interactions: 187 },
          { hour: '09-10', interactions: 256 },
          { hour: '10-11', interactions: 321 },
          { hour: '11-12', interactions: 398 },
          { hour: '12-13', interactions: 478 },
          { hour: '13-14', interactions: 423 },
          { hour: '14-15', interactions: 367 },
          { hour: '15-16', interactions: 334 },
          { hour: '16-17', interactions: 289 },
          { hour: '17-18', interactions: 245 },
          { hour: '18-19', interactions: 212 },
          { hour: '19-20', interactions: 178 },
          { hour: '20-21', interactions: 134 },
          { hour: '21-22', interactions: 98 },
          { hour: '22-23', interactions: 67 },
          { hour: '23-24', interactions: 45 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BrandX Campaign Metrics
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Luxury Chocolates' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'products',
        data: JSON.stringify([
          { name: 'Swiss Dark Chocolate Truffles', clicks: 1123 },
          { name: 'Belgian Pralines Collection', clicks: 864 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Luxury Chocolates' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'busyTime',
        data: JSON.stringify([
          { hour: '00-01', interactions: 5 },
          { hour: '01-02', interactions: 3 },
          { hour: '02-03', interactions: 2 },
          { hour: '03-04', interactions: 1 },
          { hour: '04-05', interactions: 0 },
          { hour: '05-06', interactions: 2 },
          { hour: '06-07', interactions: 8 },
          { hour: '07-08', interactions: 23 },
          { hour: '08-09', interactions: 56 },
          { hour: '09-10', interactions: 98 },
          { hour: '10-11', interactions: 134 },
          { hour: '11-12', interactions: 189 },
          { hour: '12-13', interactions: 267 },
          { hour: '13-14', interactions: 234 },
          { hour: '14-15', interactions: 198 },
          { hour: '15-16', interactions: 223 },
          { hour: '16-17', interactions: 187 },
          { hour: '17-18', interactions: 156 },
          { hour: '18-19', interactions: 123 },
          { hour: '19-20', interactions: 89 },
          { hour: '20-21', interactions: 56 },
          { hour: '21-22', interactions: 34 },
          { hour: '22-23', interactions: 18 },
          { hour: '23-24', interactions: 8 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Gourmet Coffee' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'products',
        data: JSON.stringify([
          { name: 'Ethiopian Single Origin', clicks: 1567 },
          { name: 'Colombian Reserve Blend', clicks: 1222 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Gourmet Coffee' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'busyTime',
        data: JSON.stringify([
          { hour: '00-01', interactions: 8 },
          { hour: '01-02', interactions: 5 },
          { hour: '02-03', interactions: 3 },
          { hour: '03-04', interactions: 2 },
          { hour: '04-05', interactions: 4 },
          { hour: '05-06', interactions: 12 },
          { hour: '06-07', interactions: 34 },
          { hour: '07-08', interactions: 89 },
          { hour: '08-09', interactions: 156 },
          { hour: '09-10', interactions: 223 },
          { hour: '10-11', interactions: 289 },
          { hour: '11-12', interactions: 345 },
          { hour: '12-13', interactions: 398 },
          { hour: '13-14', interactions: 356 },
          { hour: '14-15', interactions: 312 },
          { hour: '15-16', interactions: 278 },
          { hour: '16-17', interactions: 234 },
          { hour: '17-18', interactions: 198 },
          { hour: '18-19', interactions: 167 },
          { hour: '19-20', interactions: 123 },
          { hour: '20-21', interactions: 89 },
          { hour: '21-22', interactions: 56 },
          { hour: '22-23', interactions: 34 },
          { hour: '23-24', interactions: 18 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Artisan Snacks' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'products',
        data: JSON.stringify([
          { name: 'Organic Rosemary Crackers', clicks: 1334 },
          { name: 'Truffle Parmesan Crisps', clicks: 1122 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        campaignId: (await queryInterface.sequelize.query(
          "SELECT id FROM Campaigns WHERE name = 'Artisan Snacks' LIMIT 1",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        ))[0].id,
        metricType: 'busyTime',
        data: JSON.stringify([
          { hour: '00-01', interactions: 4 },
          { hour: '01-02', interactions: 2 },
          { hour: '02-03', interactions: 1 },
          { hour: '03-04', interactions: 0 },
          { hour: '04-05', interactions: 1 },
          { hour: '05-06', interactions: 5 },
          { hour: '06-07', interactions: 18 },
          { hour: '07-08', interactions: 45 },
          { hour: '08-09', interactions: 89 },
          { hour: '09-10', interactions: 134 },
          { hour: '10-11', interactions: 198 },
          { hour: '11-12', interactions: 256 },
          { hour: '12-13', interactions: 321 },
          { hour: '13-14', interactions: 289 },
          { hour: '14-15', interactions: 245 },
          { hour: '15-16', interactions: 267 },
          { hour: '16-17', interactions: 223 },
          { hour: '17-18', interactions: 187 },
          { hour: '18-19', interactions: 156 },
          { hour: '19-20', interactions: 112 },
          { hour: '20-21', interactions: 78 },
          { hour: '21-22', interactions: 45 },
          { hour: '22-23', interactions: 23 },
          { hour: '23-24', interactions: 12 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    console.log('✅ Multi-tenancy seed completed!');
    console.log('📧 Super Admin: super@admin.com / SuperAdmin123!');
    console.log('🏢 Tenants: ASDA Demo, RetailCo, BrandX Marketing');
  },

  async down(queryInterface, Sequelize) {
    // Remove campaign metrics
    await queryInterface.bulkDelete('CampaignMetrics', null, {});
    
    // Remove campaigns
    await queryInterface.bulkDelete('Campaigns', null, {});
    
    // Remove user-tenant assignments
    await queryInterface.bulkDelete('UserTenants', null, {});
    
    // Remove tenants
    await queryInterface.bulkDelete('Tenants', null, {});
    
    // Remove super admin user
    await queryInterface.sequelize.query(
      "DELETE FROM UserRoles WHERE userId IN (SELECT id FROM Users WHERE email = 'super@admin.com')"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM Users WHERE email = 'super@admin.com'"
    );
  }
};

