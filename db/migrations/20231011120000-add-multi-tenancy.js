'use strict';

const { randomUUID } = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Tenants table
    await queryInterface.createTable('Tenants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      logoUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      primaryColor: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '#78BE20'
      },
      secondaryColor: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '#006633'
      },
      accentColor: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '#78BE20'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create UserTenants junction table
    await queryInterface.createTable('UserTenants', {
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Campaigns table
    await queryInterface.createTable('Campaigns', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      machineId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      totalProductsDispensed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      totalUserInteractions: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      totalFreeSamplesRedeemed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      totalProductClicks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      uniqueCustomers: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      averageEngagementTime: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      adPlaytime: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      totalAdPlays: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      machineOfflineMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      totalHours: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      machineUptimePercent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100
      },
      restockTimes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      restockDays: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      productDetails: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create CampaignMetrics table
    await queryInterface.createTable('CampaignMetrics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      campaignId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Campaigns',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      metricType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      data: {
        type: Sequelize.JSON,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create CSVUploads table
    await queryInterface.createTable('CSVUploads', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false
      },
      uploadedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add new permissions for multi-tenancy
    const [tenantsReadId, tenantsWriteId, campaignsUploadId, campaignsReadId] = [
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID()
    ];

    await queryInterface.bulkInsert('Permissions', [
      { id: tenantsReadId, name: 'tenants.read', createdAt: new Date(), updatedAt: new Date() },
      { id: tenantsWriteId, name: 'tenants.write', createdAt: new Date(), updatedAt: new Date() },
      { id: campaignsUploadId, name: 'campaigns.upload', createdAt: new Date(), updatedAt: new Date() },
      { id: campaignsReadId, name: 'campaigns.read', createdAt: new Date(), updatedAt: new Date() }
    ]);

    // Create super_admin role
    const superAdminRoleId = randomUUID();
    await queryInterface.bulkInsert('Roles', [
      { id: superAdminRoleId, name: 'super_admin', createdAt: new Date(), updatedAt: new Date() }
    ]);

    // Get all existing permissions
    const allPermissions = await queryInterface.sequelize.query(
      'SELECT id FROM Permissions',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Assign all permissions to super_admin
    const superAdminPermissions = allPermissions.map(perm => ({
      roleId: superAdminRoleId,
      permissionId: perm.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('RolePermissions', superAdminPermissions);

    // Add campaigns.read permission to existing dashboard roles
    const dashboardRoles = await queryInterface.sequelize.query(
      "SELECT id FROM Roles WHERE name IN ('asda_executive', 'cpm_manager')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const dashboardPermissions = dashboardRoles.map(role => ({
      roleId: role.id,
      permissionId: campaignsReadId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (dashboardPermissions.length > 0) {
      await queryInterface.bulkInsert('RolePermissions', dashboardPermissions);
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove new permissions
    await queryInterface.sequelize.query(
      "DELETE FROM RolePermissions WHERE permissionId IN (SELECT id FROM Permissions WHERE name IN ('tenants.read', 'tenants.write', 'campaigns.upload', 'campaigns.read'))"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM Permissions WHERE name IN ('tenants.read', 'tenants.write', 'campaigns.upload', 'campaigns.read')"
    );

    // Remove super_admin role
    await queryInterface.sequelize.query(
      "DELETE FROM RolePermissions WHERE roleId IN (SELECT id FROM Roles WHERE name = 'super_admin')"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM UserRoles WHERE roleId IN (SELECT id FROM Roles WHERE name = 'super_admin')"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM Roles WHERE name = 'super_admin'"
    );

    // Drop tables in reverse order
    await queryInterface.dropTable('CSVUploads');
    await queryInterface.dropTable('CampaignMetrics');
    await queryInterface.dropTable('Campaigns');
    await queryInterface.dropTable('UserTenants');
    await queryInterface.dropTable('Tenants');
  }
};

