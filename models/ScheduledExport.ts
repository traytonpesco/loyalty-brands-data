import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/sequelize';

interface ScheduledExportAttributes {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  exportType: 'campaign' | 'campaigns' | 'aggregate';
  format: 'csv' | 'excel' | 'json' | 'xml';
  schedule: string;
  recipients: string[];
  filters?: any;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ScheduledExportCreationAttributes
  extends Optional<ScheduledExportAttributes, 'id' | 'description' | 'filters' | 'lastRunAt' | 'nextRunAt' | 'createdBy' | 'createdAt' | 'updatedAt'> {}

class ScheduledExport
  extends Model<ScheduledExportAttributes, ScheduledExportCreationAttributes>
  implements ScheduledExportAttributes
{
  public id!: string;
  public tenantId!: string;
  public name!: string;
  public description?: string;
  public exportType!: 'campaign' | 'campaigns' | 'aggregate';
  public format!: 'csv' | 'excel' | 'json' | 'xml';
  public schedule!: string;
  public recipients!: string[];
  public filters?: any;
  public isActive!: boolean;
  public lastRunAt?: Date;
  public nextRunAt?: Date;
  public createdBy?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly Tenant?: any;
  public readonly Creator?: any;
  public readonly ExportHistory?: any[];
}

ScheduledExport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    exportType: {
      type: DataTypes.ENUM('campaign', 'campaigns', 'aggregate'),
      allowNull: false,
      defaultValue: 'aggregate',
    },
    format: {
      type: DataTypes.ENUM('csv', 'excel', 'json', 'xml'),
      allowNull: false,
      defaultValue: 'excel',
    },
    schedule: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    recipients: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    filters: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastRunAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextRunAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ScheduledExport',
    tableName: 'ScheduledExports',
    timestamps: true,
  }
);

export default ScheduledExport;

