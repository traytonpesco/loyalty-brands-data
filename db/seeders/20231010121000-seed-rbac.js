'use strict';

const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    const [adminRoleId, userRoleId, asdaExecRoleId, cpmManagerRoleId] = [
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID(),
    ];
    const [usersReadId, usersWriteId, rolesReadId, rolesWriteId, dashboardReadId] = [
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID(),
    ];

    await queryInterface.bulkInsert('Roles', [
      { id: adminRoleId, name: 'admin', createdAt: new Date(), updatedAt: new Date() },
      { id: userRoleId, name: 'user', createdAt: new Date(), updatedAt: new Date() },
      { id: asdaExecRoleId, name: 'asda_executive', createdAt: new Date(), updatedAt: new Date() },
      { id: cpmManagerRoleId, name: 'cpm_manager', createdAt: new Date(), updatedAt: new Date() },
    ]);

    await queryInterface.bulkInsert('Permissions', [
      { id: usersReadId, name: 'users.read', createdAt: new Date(), updatedAt: new Date() },
      { id: usersWriteId, name: 'users.write', createdAt: new Date(), updatedAt: new Date() },
      { id: rolesReadId, name: 'roles.read', createdAt: new Date(), updatedAt: new Date() },
      { id: rolesWriteId, name: 'roles.write', createdAt: new Date(), updatedAt: new Date() },
      { id: dashboardReadId, name: 'dashboard.read', createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Add campaigns.read permission
    const campaignsReadId = randomUUID();
    await queryInterface.bulkInsert('Permissions', [
      { id: campaignsReadId, name: 'campaigns.read', createdAt: new Date(), updatedAt: new Date() },
    ]);

    await queryInterface.bulkInsert('RolePermissions', [
      // Admin permissions
      { roleId: adminRoleId, permissionId: usersReadId, createdAt: new Date(), updatedAt: new Date() },
      { roleId: adminRoleId, permissionId: usersWriteId, createdAt: new Date(), updatedAt: new Date() },
      { roleId: adminRoleId, permissionId: rolesReadId, createdAt: new Date(), updatedAt: new Date() },
      { roleId: adminRoleId, permissionId: rolesWriteId, createdAt: new Date(), updatedAt: new Date() },
      { roleId: adminRoleId, permissionId: dashboardReadId, createdAt: new Date(), updatedAt: new Date() },
      { roleId: adminRoleId, permissionId: campaignsReadId, createdAt: new Date(), updatedAt: new Date() },
      // ASDA Executive permissions
      { roleId: asdaExecRoleId, permissionId: dashboardReadId, createdAt: new Date(), updatedAt: new Date() },
      { roleId: asdaExecRoleId, permissionId: campaignsReadId, createdAt: new Date(), updatedAt: new Date() },
      // CPM Manager permissions
      { roleId: cpmManagerRoleId, permissionId: dashboardReadId, createdAt: new Date(), updatedAt: new Date() },
      { roleId: cpmManagerRoleId, permissionId: campaignsReadId, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    const adminUserId = randomUUID();

    // ASDA Executive account
    const asdaExecEmail = 'asda.exec@example.com';
    const asdaExecPassword = 'ASDA123!';
    const asdaExecPasswordHash = await bcrypt.hash(asdaExecPassword, 12);
    const asdaExecUserId = randomUUID();

    // CPM Manager account
    const cpmManagerEmail = 'cpm.manager@example.com';
    const cpmManagerPassword = 'CPM123!';
    const cpmManagerPasswordHash = await bcrypt.hash(cpmManagerPassword, 12);
    const cpmManagerUserId = randomUUID();

    await queryInterface.bulkInsert('Users', [
      { id: adminUserId, email: adminEmail, passwordHash: adminPasswordHash, firstName: 'Admin', lastName: 'User', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: asdaExecUserId, email: asdaExecEmail, passwordHash: asdaExecPasswordHash, firstName: 'ASDA', lastName: 'Executive', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: cpmManagerUserId, email: cpmManagerEmail, passwordHash: cpmManagerPasswordHash, firstName: 'CPM', lastName: 'Manager', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ]);

    await queryInterface.bulkInsert('UserRoles', [
      { userId: adminUserId, roleId: adminRoleId, createdAt: new Date(), updatedAt: new Date() },
      { userId: asdaExecUserId, roleId: asdaExecRoleId, createdAt: new Date(), updatedAt: new Date() },
      { userId: cpmManagerUserId, roleId: cpmManagerRoleId, createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('UserRoles', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('RolePermissions', null, {});
    await queryInterface.bulkDelete('Permissions', null, {});
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
