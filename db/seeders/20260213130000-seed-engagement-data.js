'use strict';

const { randomUUID } = require('crypto');

function addDays(d, days) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Dwell time: most 10-30s, long tail to 120s */
function sampleDuration() {
  const r = Math.random();
  if (r < 0.5) return randomInt(10, 30);
  if (r < 0.85) return randomInt(30, 60);
  if (r < 0.95) return randomInt(60, 90);
  return randomInt(90, 120);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const isSqlite = dialect === 'sqlite';

    // Get first two tenants (ASDA Demo, RetailCo) to attach engagement data
    const tenants = await queryInterface.sequelize.query(
      "SELECT id, name FROM Tenants ORDER BY createdAt LIMIT 2",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (tenants.length < 2) return;

    const [tenant1, tenant2] = tenants;
    const tenant1Id = tenant1.id;
    const tenant2Id = tenant2.id;

    let campaignRows;
    if (isSqlite) {
      campaignRows = await queryInterface.sequelize.query(
        'SELECT id, tenantId, startDate FROM Campaigns WHERE tenantId IN (?, ?) ORDER BY createdAt LIMIT 6',
        { replacements: [tenant1Id, tenant2Id], type: queryInterface.sequelize.QueryTypes.SELECT }
      );
    } else {
      campaignRows = await queryInterface.sequelize.query(
        'SELECT id, "tenantId" as tenantId, "startDate" as startDate FROM Campaigns WHERE "tenantId" IN (?, ?) ORDER BY "createdAt" LIMIT 6',
        { replacements: [tenant1Id, tenant2Id], type: queryInterface.sequelize.QueryTypes.SELECT }
      );
    }

    if (campaignRows.length === 0) return;
    const campaign1 = campaignRows[0];
    const campaign2 = campaignRows[Math.min(3, campaignRows.length - 1)] || campaignRows[0];
    const totalSessions = 5000;
    const sessions = [];
    const impressions = [];
    const contacts = [];
    const now = new Date();
    const startCampaign1 = new Date(campaign1.startDate || now);
    const startCampaign2 = new Date((campaign2 && campaign2.startDate) || now);
    const camp1 = { id: campaign1.id, tenantId: campaign1.tenantId, startDate: startCampaign1 };
    const camp2 = { id: campaign2.id, tenantId: campaign2.tenantId, startDate: startCampaign2 };

    for (let i = 0; i < totalSessions; i++) {
      const campaign = i % 2 === 0 ? camp1 : camp2;
      const baseDate = campaign.tenantId === tenant1Id ? startCampaign1 : startCampaign2;
      const dayOffset = randomInt(0, 13);
      const hour = randomInt(8, 19);
      const minute = randomInt(0, 59);
      const sessionStart = new Date(baseDate);
      sessionStart.setDate(sessionStart.getDate() + dayOffset);
      sessionStart.setHours(hour, minute, 0, 0);
      const duration = sampleDuration();
      const sessionEnd = new Date(sessionStart.getTime() + duration * 1000);
      const journeyStarted = Math.random() < 0.92;
      const journeyCompleted = journeyStarted && Math.random() < 0.65;
      const totalSteps = 5;
      const stepsCompleted = journeyCompleted ? totalSteps : (journeyStarted ? randomInt(1, 4) : 0);
      const dropOffStep = journeyStarted && !journeyCompleted ? stepsCompleted + 1 : null;

      sessions.push({
        id: randomUUID(),
        campaignId: campaign.id,
        tenantId: campaign.tenantId,
        machineId: 'M1',
        sessionStart,
        sessionEnd,
        durationSeconds: duration,
        journeyStarted,
        journeyCompleted,
        stepsCompleted,
        totalSteps,
        dropOffStep,
        createdAt: sessionStart,
        updatedAt: sessionStart,
      });
    }

    const chunk = 500;
    for (let i = 0; i < sessions.length; i += chunk) {
      await queryInterface.bulkInsert('CampaignSessions', sessions.slice(i, i + chunk));
    }

    // Impressions: aggregate by hour per campaign
    for (const camp of [camp1, camp2]) {
      for (let d = 0; d < 14; d++) {
        for (let h = 8; h < 20; h++) {
          const intervalStart = new Date(camp.startDate);
          intervalStart.setDate(intervalStart.getDate() + d);
          intervalStart.setHours(h, 0, 0, 0);
          const intervalEnd = new Date(intervalStart.getTime() + 3600 * 1000);
          const count = randomInt(80, 350);
          impressions.push({
            id: randomUUID(),
            campaignId: camp.id,
            tenantId: camp.tenantId,
            machineId: 'M1',
            intervalStart,
            intervalEnd,
            impressionCount: count,
            createdAt: intervalStart,
            updatedAt: intervalStart,
          });
        }
      }
    }
    for (let i = 0; i < impressions.length; i += chunk) {
      await queryInterface.bulkInsert('CampaignImpressions', impressions.slice(i, i + chunk));
    }

    // Contacts: ~10% of sessions, with consent
    const sessionIds = sessions.map(s => s.id);
    let contactCount = 0;
    const targetContacts = Math.floor(sessions.length * 0.10);
    for (let i = 0; i < sessions.length && contactCount < targetContacts; i++) {
      if (!sessions[i].journeyCompleted || Math.random() > 0.35) continue;
      contacts.push({
        id: randomUUID(),
        campaignId: sessions[i].campaignId,
        tenantId: sessions[i].tenantId,
        sessionId: sessionIds[i],
        contactType: ['email', 'phone', 'both'][randomInt(0, 2)],
        consentGiven: true,
        createdAt: sessions[i].sessionEnd,
        updatedAt: sessions[i].sessionEnd,
      });
      contactCount++;
    }
    for (let i = 0; i < contacts.length; i += chunk) {
      await queryInterface.bulkInsert('CampaignContacts', contacts.slice(i, i + chunk));
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('CampaignContacts', null, {});
    await queryInterface.bulkDelete('CampaignImpressions', null, {});
    await queryInterface.bulkDelete('CampaignSessions', null, {});
  },
};
