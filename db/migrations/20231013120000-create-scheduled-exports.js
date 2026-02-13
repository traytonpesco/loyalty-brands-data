'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ScheduledExports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      exportType: {
        type: Sequelize.ENUM('campaign', 'campaigns', 'aggregate'),
        allowNull: false,
        defaultValue: 'aggregate',
      },
      format: {
        type: Sequelize.ENUM('csv', 'excel', 'json', 'xml'),
        allowNull: false,
        defaultValue: 'excel',
      },
      schedule: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Cron expression',
      },
      recipients: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of email addresses',
      },
      filters: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Export filters (campaignIds, dateRange, etc)',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastRunAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      nextRunAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create export history table
    await queryInterface.createTable('ExportHistory', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      scheduledExportId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'ScheduledExports',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      format: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      fileName: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      fileSize: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'File size in bytes',
      },
      recordCount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of records exported',
      },
      recipients: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indices
    await queryInterface.addIndex('ScheduledExports', ['tenantId']);
    await queryInterface.addIndex('ScheduledExports', ['isActive']);
    await queryInterface.addIndex('ScheduledExports', ['nextRunAt']);
    await queryInterface.addIndex('ExportHistory', ['scheduledExportId']);
    await queryInterface.addIndex('ExportHistory', ['tenantId']);
    await queryInterface.addIndex('ExportHistory', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ExportHistory');
    await queryInterface.dropTable('ScheduledExports');
  },
};

