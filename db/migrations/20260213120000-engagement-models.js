'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // Add new columns to Campaigns (engagement-focused)
    await queryInterface.addColumn('Campaigns', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Campaigns', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'active',
    });
    await queryInterface.addColumn('Campaigns', 'machineIds', {
      type: dialect === 'sqlite' ? Sequelize.TEXT : Sequelize.JSONB,
      allowNull: true,
    });
    // Make machineId nullable for backward compatibility
    await queryInterface.changeColumn('Campaigns', 'machineId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // CampaignSessions - one row per kiosk interaction
    await queryInterface.createTable('CampaignSessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      campaignId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Campaigns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      machineId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sessionStart: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      sessionEnd: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      durationSeconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      journeyStarted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      journeyCompleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      stepsCompleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalSteps: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      dropOffStep: {
        type: Sequelize.INTEGER,
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

    // CampaignImpressions - aggregated footfall per interval
    await queryInterface.createTable('CampaignImpressions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      campaignId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Campaigns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      machineId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      intervalStart: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      intervalEnd: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      impressionCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    // CampaignContacts - captured leads
    await queryInterface.createTable('CampaignContacts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      campaignId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Campaigns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'CampaignSessions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      contactType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      consentGiven: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CampaignContacts');
    await queryInterface.dropTable('CampaignImpressions');
    await queryInterface.dropTable('CampaignSessions');
    await queryInterface.removeColumn('Campaigns', 'machineIds');
    await queryInterface.removeColumn('Campaigns', 'status');
    await queryInterface.removeColumn('Campaigns', 'description');
    await queryInterface.changeColumn('Campaigns', 'machineId', {
      type: require('sequelize').STRING,
      allowNull: false,
    });
  },
};
