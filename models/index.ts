import { DataTypes, InferAttributes, InferCreationAttributes, Model, CreationOptional } from 'sequelize';
import sequelize from '../db/sequelize';
import ScheduledExport from './ScheduledExport';
import ExportHistory from './ExportHistory';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare passwordHash: string;
  declare firstName: CreationOptional<string | null>;
  declare lastName: CreationOptional<string | null>;
  declare isActive: CreationOptional<boolean>;
  declare lastLoginAt: CreationOptional<Date | null>;
}

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
  declare id: CreationOptional<string>;
  declare name: string;
}

export class Permission extends Model<InferAttributes<Permission>, InferCreationAttributes<Permission>> {
  declare id: CreationOptional<string>;
  declare name: string;
}

export class RefreshToken extends Model<InferAttributes<RefreshToken>, InferCreationAttributes<RefreshToken>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare tokenHash: string;
  declare jti: string;
  declare revokedAt: CreationOptional<Date | null>;
  declare expiresAt: Date;
}

export class PasswordResetToken extends Model<InferAttributes<PasswordResetToken>, InferCreationAttributes<PasswordResetToken>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare usedAt: CreationOptional<Date | null>;
}

// Multi-tenant models
export class Tenant extends Model<InferAttributes<Tenant>, InferCreationAttributes<Tenant>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare slug: string;
  declare logoUrl: CreationOptional<string | null>;
  declare primaryColor: CreationOptional<string>;
  declare secondaryColor: CreationOptional<string>;
  declare accentColor: CreationOptional<string>;
  declare isActive: CreationOptional<boolean>;
}

export class UserTenant extends Model<InferAttributes<UserTenant>, InferCreationAttributes<UserTenant>> {
  declare userId: string;
  declare tenantId: string;
}

export class Campaign extends Model<InferAttributes<Campaign>, InferCreationAttributes<Campaign>> {
  declare id: CreationOptional<string>;
  declare tenantId: string;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare status: CreationOptional<string>;
  declare machineId: CreationOptional<string | null>;
  declare machineIds: CreationOptional<string[] | null>;
  declare startDate: Date;
  declare endDate: Date;
  declare totalProductsDispensed?: number;
  declare totalUserInteractions?: number;
  declare totalFreeSamplesRedeemed?: number;
  declare totalProductClicks?: number;
  declare uniqueCustomers?: number;
  declare averageEngagementTime?: number;
  declare adPlaytime?: number;
  declare totalAdPlays?: number;
  declare machineOfflineMinutes?: number;
  declare totalHours?: number;
  declare machineUptimePercent?: number;
  declare restockTimes?: number;
  declare restockDays?: number;
  declare productDetails?: number | null;
}

export class CampaignSession extends Model<InferAttributes<CampaignSession>, InferCreationAttributes<CampaignSession>> {
  declare id: CreationOptional<string>;
  declare campaignId: string;
  declare tenantId: string;
  declare machineId: CreationOptional<string | null>;
  declare sessionStart: Date;
  declare sessionEnd: CreationOptional<Date | null>;
  declare durationSeconds: CreationOptional<number | null>;
  declare journeyStarted: CreationOptional<boolean>;
  declare journeyCompleted: CreationOptional<boolean>;
  declare stepsCompleted: CreationOptional<number>;
  declare totalSteps: CreationOptional<number>;
  declare dropOffStep: CreationOptional<number | null>;
}

export class CampaignImpression extends Model<InferAttributes<CampaignImpression>, InferCreationAttributes<CampaignImpression>> {
  declare id: CreationOptional<string>;
  declare campaignId: string;
  declare tenantId: string;
  declare machineId: CreationOptional<string | null>;
  declare intervalStart: Date;
  declare intervalEnd: Date;
  declare impressionCount: CreationOptional<number>;
}

export class CampaignContact extends Model<InferAttributes<CampaignContact>, InferCreationAttributes<CampaignContact>> {
  declare id: CreationOptional<string>;
  declare campaignId: string;
  declare tenantId: string;
  declare sessionId: CreationOptional<string | null>;
  declare contactType: string;
  declare consentGiven: CreationOptional<boolean>;
}

export class CampaignMetric extends Model<InferAttributes<CampaignMetric>, InferCreationAttributes<CampaignMetric>> {
  declare id: CreationOptional<string>;
  declare campaignId: string;
  declare metricType: string; // 'products', 'busyTime', etc.
  declare data: any; // JSONB
}

export class CSVUpload extends Model<InferAttributes<CSVUpload>, InferCreationAttributes<CSVUpload>> {
  declare id: CreationOptional<string>;
  declare tenantId: string;
  declare filename: string;
  declare uploadedBy: string;
  declare status: CreationOptional<string>; // 'pending', 'processing', 'completed', 'failed'
  declare errorMessage: CreationOptional<string | null>;
  declare processedAt: CreationOptional<Date | null>;
}

User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  firstName: { type: DataTypes.STRING, allowNull: true },
  lastName: { type: DataTypes.STRING, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, modelName: 'User', tableName: 'Users', timestamps: true });

Role.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { sequelize, modelName: 'Role', tableName: 'Roles', timestamps: true });

Permission.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { sequelize, modelName: 'Permission', tableName: 'Permissions', timestamps: true });

RefreshToken.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  tokenHash: { type: DataTypes.STRING, allowNull: false },
  jti: { type: DataTypes.STRING, allowNull: false, unique: true },
  revokedAt: { type: DataTypes.DATE, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
}, { sequelize, modelName: 'RefreshToken', tableName: 'RefreshTokens', timestamps: true });

PasswordResetToken.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  tokenHash: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  usedAt: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, modelName: 'PasswordResetToken', tableName: 'PasswordResetTokens', timestamps: true });

// Initialize multi-tenant models
Tenant.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  logoUrl: { type: DataTypes.STRING, allowNull: true },
  primaryColor: { type: DataTypes.STRING, allowNull: false, defaultValue: '#78BE20' },
  secondaryColor: { type: DataTypes.STRING, allowNull: false, defaultValue: '#006633' },
  accentColor: { type: DataTypes.STRING, allowNull: false, defaultValue: '#78BE20' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { sequelize, modelName: 'Tenant', tableName: 'Tenants', timestamps: true });

UserTenant.init({
  userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
}, { sequelize, modelName: 'UserTenant', tableName: 'UserTenants', timestamps: true });

Campaign.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
  machineId: { type: DataTypes.STRING, allowNull: true },
  machineIds: { type: DataTypes.JSON, allowNull: true },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  totalProductsDispensed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalUserInteractions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalFreeSamplesRedeemed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalProductClicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  uniqueCustomers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  averageEngagementTime: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  adPlaytime: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalAdPlays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  machineOfflineMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  machineUptimePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 100 },
  restockTimes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  restockDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  productDetails: { type: DataTypes.INTEGER, allowNull: true },
}, { sequelize, modelName: 'Campaign', tableName: 'Campaigns', timestamps: true });

CampaignSession.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  campaignId: { type: DataTypes.UUID, allowNull: false },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  machineId: { type: DataTypes.STRING, allowNull: true },
  sessionStart: { type: DataTypes.DATE, allowNull: false },
  sessionEnd: { type: DataTypes.DATE, allowNull: true },
  durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
  journeyStarted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  journeyCompleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  stepsCompleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalSteps: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  dropOffStep: { type: DataTypes.INTEGER, allowNull: true },
}, { sequelize, modelName: 'CampaignSession', tableName: 'CampaignSessions', timestamps: true });

CampaignImpression.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  campaignId: { type: DataTypes.UUID, allowNull: false },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  machineId: { type: DataTypes.STRING, allowNull: true },
  intervalStart: { type: DataTypes.DATE, allowNull: false },
  intervalEnd: { type: DataTypes.DATE, allowNull: false },
  impressionCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { sequelize, modelName: 'CampaignImpression', tableName: 'CampaignImpressions', timestamps: true });

CampaignContact.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  campaignId: { type: DataTypes.UUID, allowNull: false },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  sessionId: { type: DataTypes.UUID, allowNull: true },
  contactType: { type: DataTypes.STRING, allowNull: false },
  consentGiven: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { sequelize, modelName: 'CampaignContact', tableName: 'CampaignContacts', timestamps: true });

CampaignMetric.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  campaignId: { type: DataTypes.UUID, allowNull: false },
  metricType: { type: DataTypes.STRING, allowNull: false },
  data: { type: DataTypes.JSON, allowNull: false },
}, { sequelize, modelName: 'CampaignMetric', tableName: 'CampaignMetrics', timestamps: true });

CSVUpload.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  filename: { type: DataTypes.STRING, allowNull: false },
  uploadedBy: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  errorMessage: { type: DataTypes.TEXT, allowNull: true },
  processedAt: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, modelName: 'CSVUpload', tableName: 'CSVUploads', timestamps: true });

// Associations
User.belongsToMany(Role, { through: 'UserRoles', foreignKey: 'userId' });
Role.belongsToMany(User, { through: 'UserRoles', foreignKey: 'roleId' });

Role.belongsToMany(Permission, { through: 'RolePermissions', foreignKey: 'roleId' });
Permission.belongsToMany(Role, { through: 'RolePermissions', foreignKey: 'permissionId' });

User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(PasswordResetToken, { foreignKey: 'userId' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });

// Multi-tenant associations
User.belongsToMany(Tenant, { through: UserTenant, foreignKey: 'userId' });
Tenant.belongsToMany(User, { through: UserTenant, foreignKey: 'tenantId' });

Tenant.hasMany(Campaign, { foreignKey: 'tenantId' });
Campaign.belongsTo(Tenant, { foreignKey: 'tenantId' });

Campaign.hasMany(CampaignMetric, { foreignKey: 'campaignId' });
CampaignMetric.belongsTo(Campaign, { foreignKey: 'campaignId' });

Campaign.hasMany(CampaignSession, { foreignKey: 'campaignId' });
CampaignSession.belongsTo(Campaign, { foreignKey: 'campaignId' });
Tenant.hasMany(CampaignSession, { foreignKey: 'tenantId' });
CampaignSession.belongsTo(Tenant, { foreignKey: 'tenantId' });

Campaign.hasMany(CampaignImpression, { foreignKey: 'campaignId' });
CampaignImpression.belongsTo(Campaign, { foreignKey: 'campaignId' });
Tenant.hasMany(CampaignImpression, { foreignKey: 'tenantId' });
CampaignImpression.belongsTo(Tenant, { foreignKey: 'tenantId' });

Campaign.hasMany(CampaignContact, { foreignKey: 'campaignId' });
CampaignContact.belongsTo(Campaign, { foreignKey: 'campaignId' });
Tenant.hasMany(CampaignContact, { foreignKey: 'tenantId' });
CampaignContact.belongsTo(Tenant, { foreignKey: 'tenantId' });
CampaignSession.hasMany(CampaignContact, { foreignKey: 'sessionId' });
CampaignContact.belongsTo(CampaignSession, { foreignKey: 'sessionId' });

Tenant.hasMany(CSVUpload, { foreignKey: 'tenantId' });
CSVUpload.belongsTo(Tenant, { foreignKey: 'tenantId' });
User.hasMany(CSVUpload, { foreignKey: 'uploadedBy' });
CSVUpload.belongsTo(User, { foreignKey: 'uploadedBy' });

// Scheduled export associations
Tenant.hasMany(ScheduledExport, { foreignKey: 'tenantId' });
ScheduledExport.belongsTo(Tenant, { foreignKey: 'tenantId' });

User.hasMany(ScheduledExport, { foreignKey: 'createdBy', as: 'ScheduledExports' });
ScheduledExport.belongsTo(User, { foreignKey: 'createdBy', as: 'Creator' });

ScheduledExport.hasMany(ExportHistory, { foreignKey: 'scheduledExportId' });
ExportHistory.belongsTo(ScheduledExport, { foreignKey: 'scheduledExportId' });

Tenant.hasMany(ExportHistory, { foreignKey: 'tenantId' });
ExportHistory.belongsTo(Tenant, { foreignKey: 'tenantId' });

export default { 
  sequelize, 
  User, 
  Role, 
  Permission, 
  RefreshToken, 
  PasswordResetToken,
  Tenant,
  UserTenant,
  Campaign,
  CampaignMetric,
  CampaignSession,
  CampaignImpression,
  CampaignContact,
  CSVUpload,
  ScheduledExport,
  ExportHistory
};
