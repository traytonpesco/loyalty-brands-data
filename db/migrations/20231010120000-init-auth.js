'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      passwordHash: { type: Sequelize.STRING, allowNull: false },
      firstName: { type: Sequelize.STRING },
      lastName: { type: Sequelize.STRING },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      lastLoginAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('Roles', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('Permissions', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('UserRoles', {
      userId: { type: Sequelize.UUID, allowNull: false },
      roleId: { type: Sequelize.UUID, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addConstraint('UserRoles', { fields: ['userId', 'roleId'], type: 'unique', name: 'ux_user_roles_user_role' });

    await queryInterface.createTable('RolePermissions', {
      roleId: { type: Sequelize.UUID, allowNull: false },
      permissionId: { type: Sequelize.UUID, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addConstraint('RolePermissions', { fields: ['roleId', 'permissionId'], type: 'unique', name: 'ux_role_permissions_role_perm' });

    await queryInterface.createTable('RefreshTokens', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      userId: { type: Sequelize.UUID, allowNull: false },
      tokenHash: { type: Sequelize.STRING, allowNull: false },
      jti: { type: Sequelize.STRING, allowNull: false, unique: true },
      revokedAt: { type: Sequelize.DATE },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('PasswordResetTokens', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      userId: { type: Sequelize.UUID, allowNull: false },
      tokenHash: { type: Sequelize.STRING, allowNull: false },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      usedAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('RefreshTokens');
    await queryInterface.dropTable('RolePermissions');
    await queryInterface.dropTable('UserRoles');
    await queryInterface.dropTable('Permissions');
    await queryInterface.dropTable('Roles');
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('PasswordResetTokens');
  }
};
