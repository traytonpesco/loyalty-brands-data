'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Webhooks table
    await queryInterface.createTable('Webhooks', {
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
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      secret: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      events: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      description: {
        type: Sequelize.STRING(500),
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

    // Create WebhookDeliveries table
    await queryInterface.createTable('WebhookDeliveries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      webhookId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Webhooks',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      event: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed', 'retrying'),
        allowNull: false,
        defaultValue: 'pending',
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maxAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      responseStatus: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      responseBody: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      nextRetryAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deliveredAt: {
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

    // Add indices for performance
    await queryInterface.addIndex('Webhooks', ['tenantId']);
    await queryInterface.addIndex('Webhooks', ['isActive']);
    await queryInterface.addIndex('WebhookDeliveries', ['webhookId']);
    await queryInterface.addIndex('WebhookDeliveries', ['status']);
    await queryInterface.addIndex('WebhookDeliveries', ['nextRetryAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('WebhookDeliveries');
    await queryInterface.dropTable('Webhooks');
  },
};

