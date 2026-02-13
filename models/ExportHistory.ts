import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/sequelize';

interface ExportHistoryAttributes {
  id: string;
  scheduledExportId?: string;
  tenantId: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName?: string;
  fileSize?: number;
  recordCount?: number;
  recipients?: string[];
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExportHistoryCreationAttributes
  extends Optional<
    ExportHistoryAttributes,
    'id' | 'scheduledExportId' | 'fileName' | 'fileSize' | 'recordCount' | 'recipients' | 'error' | 'startedAt' | 'completedAt' | 'createdAt' | 'updatedAt'
  > {}

class ExportHistory
  extends Model<ExportHistoryAttributes, ExportHistoryCreationAttributes>
  implements ExportHistoryAttributes
{
  public id!: string;
  public scheduledExportId?: string;
  public tenantId!: string;
  public format!: string;
  public status!: 'pending' | 'processing' | 'completed' | 'failed';
  public fileName?: string;
  public fileSize?: number;
  public recordCount?: number;
  public recipients?: string[];
  public error?: string;
  public startedAt?: Date;
  public completedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly ScheduledExport?: any;
  public readonly Tenant?: any;
}

ExportHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    scheduledExportId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    format: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    fileName: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    recordCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    recipients: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ExportHistory',
    tableName: 'ExportHistory',
    timestamps: true,
  }
);

export default ExportHistory;

