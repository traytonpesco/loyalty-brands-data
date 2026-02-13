import * as fs from 'fs';
import csv from 'csv-parser';
import models from '../models';

interface Product {
  name: string;
  clicks: number;
}

interface BusyTimeSlot {
  hour: string;
  interactions: number;
}

interface CSVRow {
  [key: string]: string;
}

export class CSVParserService {
  /**
   * Parse a CSV file and extract campaign data
   */
  async parseCSVFile(filePath: string, tenantId: string, uploadedBy: string): Promise<string> {
    const csvUpload = await (models as any).CSVUpload.create({
      tenantId,
      filename: filePath.split('/').pop(),
      uploadedBy,
      status: 'processing'
    });

    try {
      const rows: CSVRow[] = await this.readCSVFile(filePath);
      
      if (rows.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Detect CSV type and parse accordingly
      const csvType = this.detectCSVType(rows);
      
      let campaignId: string;
      switch (csvType) {
        case 'transaction':
          campaignId = await this.parseTransactionReport(rows, tenantId);
          break;
        case 'product':
          campaignId = await this.parseProductReport(rows, tenantId);
          break;
        case 'summary':
          campaignId = await this.parseSummaryReport(rows, tenantId);
          break;
        default:
          throw new Error('Unknown CSV format');
      }

      await csvUpload.update({
        status: 'completed',
        processedAt: new Date()
      });

      return campaignId;
    } catch (error: any) {
      await csvUpload.update({
        status: 'failed',
        errorMessage: error.message
      });
      throw error;
    }
  }

  /**
   * Read CSV file and return rows
   */
  private readCSVFile(filePath: string): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      const rows: CSVRow[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: CSVRow) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', (error: Error) => reject(error));
    });
  }

  /**
   * Detect the type of CSV file
   */
  private detectCSVType(rows: CSVRow[]): string {
    const firstRow = rows[0];
    const headers = Object.keys(firstRow).map(h => h.toLowerCase());

    if (headers.includes('timestamp') || headers.includes('transaction_time') || headers.includes('hour')) {
      return 'transaction';
    } else if (headers.includes('product_name') || headers.includes('product') || headers.includes('clicks')) {
      return 'product';
    } else if (headers.includes('campaign_name') || headers.includes('total_interactions') || headers.includes('machine_id')) {
      return 'summary';
    }

    return 'unknown';
  }

  /**
   * Parse transaction report (busy time data)
   */
  private async parseTransactionReport(rows: CSVRow[], tenantId: string): Promise<string> {
    // Extract campaign info from first row
    const campaignName = rows[0].campaign_name || rows[0].Campaign || 'Imported Campaign';
    const machineId = rows[0].machine_id || rows[0].Machine || 'Unknown Machine';

    // Calculate busy time data
    const busyTimeMap = new Map<string, number>();
    
    rows.forEach(row => {
      const timestamp = row.timestamp || row.Timestamp || row.transaction_time;
      if (timestamp) {
        const hour = this.extractHour(timestamp);
        busyTimeMap.set(hour, (busyTimeMap.get(hour) || 0) + 1);
      }
    });

    // Convert to busyTime format
    const busyTime: BusyTimeSlot[] = [];
    for (let i = 0; i < 24; i++) {
      const hourStr = `${i.toString().padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`;
      busyTime.push({
        hour: hourStr,
        interactions: busyTimeMap.get(hourStr) || 0
      });
    }

    // Calculate date range
    const dates = rows
      .map(r => r.timestamp || r.Timestamp || r.transaction_time)
      .filter(Boolean)
      .map(d => new Date(d));
    
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Create campaign
    const campaign = await (models as any).Campaign.create({
      tenantId,
      name: campaignName,
      machineId,
      startDate,
      endDate,
      totalUserInteractions: rows.length,
      uniqueCustomers: this.calculateUniqueCustomers(rows),
      totalHours: this.calculateTotalHours(startDate, endDate)
    });

    // Store busy time metrics
    await (models as any).CampaignMetric.create({
      campaignId: campaign.id,
      metricType: 'busyTime',
      data: busyTime
    });

    return campaign.id;
  }

  /**
   * Parse product report (product clicks data)
   */
  private async parseProductReport(rows: CSVRow[], tenantId: string): Promise<string> {
    const campaignName = rows[0].campaign_name || rows[0].Campaign || 'Imported Campaign';
    const machineId = rows[0].machine_id || rows[0].Machine || 'Unknown Machine';

    // Aggregate product data
    const productMap = new Map<string, number>();
    
    rows.forEach(row => {
      const productName = row.product_name || row.Product || row.product;
      const clicks = parseInt(row.clicks || row.Clicks || '1', 10);
      
      if (productName) {
        productMap.set(productName, (productMap.get(productName) || 0) + clicks);
      }
    });

    const products: Product[] = Array.from(productMap.entries()).map(([name, clicks]) => ({
      name,
      clicks
    }));

    const totalProductClicks = products.reduce((sum, p) => sum + p.clicks, 0);

    // Create campaign
    const campaign = await (models as any).Campaign.create({
      tenantId,
      name: campaignName,
      machineId,
      startDate: new Date(),
      endDate: new Date(),
      totalProductClicks
    });

    // Store product metrics
    await (models as any).CampaignMetric.create({
      campaignId: campaign.id,
      metricType: 'products',
      data: products
    });

    return campaign.id;
  }

  /**
   * Parse summary report (full campaign data)
   */
  private async parseSummaryReport(rows: CSVRow[], tenantId: string): Promise<string> {
    const row = rows[0]; // Summary reports typically have one row with all data

    const campaign = await (models as any).Campaign.create({
      tenantId,
      name: row.campaign_name || row.Campaign || 'Imported Campaign',
      machineId: row.machine_id || row.Machine || 'Unknown Machine',
      startDate: new Date(row.start_date || row.StartDate || Date.now()),
      endDate: new Date(row.end_date || row.EndDate || Date.now()),
      totalProductsDispensed: parseInt(row.total_products_dispensed || row.ProductsDispensed || '0', 10),
      totalUserInteractions: parseInt(row.total_interactions || row.Interactions || '0', 10),
      totalFreeSamplesRedeemed: parseInt(row.free_samples || row.FreeSamples || '0', 10),
      totalProductClicks: parseInt(row.product_clicks || row.ProductClicks || '0', 10),
      uniqueCustomers: parseInt(row.unique_customers || row.UniqueCustomers || '0', 10),
      averageEngagementTime: parseInt(row.avg_engagement || row.AvgEngagement || '0', 10),
      adPlaytime: parseInt(row.ad_playtime || row.AdPlaytime || '0', 10),
      totalAdPlays: parseInt(row.total_ad_plays || row.AdPlays || '0', 10),
      machineOfflineMinutes: parseInt(row.offline_minutes || row.OfflineMinutes || '0', 10),
      totalHours: parseInt(row.total_hours || row.TotalHours || '0', 10),
      machineUptimePercent: parseFloat(row.uptime_percent || row.Uptime || '100'),
      restockTimes: parseInt(row.restock_times || row.RestockTimes || '0', 10),
      restockDays: parseInt(row.restock_days || row.RestockDays || '0', 10)
    });

    return campaign.id;
  }

  /**
   * Extract hour from timestamp
   */
  private extractHour(timestamp: string): string {
    const date = new Date(timestamp);
    const hour = date.getHours();
    return `${hour.toString().padStart(2, '0')}-${(hour + 1).toString().padStart(2, '0')}`;
  }

  /**
   * Calculate unique customers from transaction data
   */
  private calculateUniqueCustomers(rows: CSVRow[]): number {
    const customerIds = new Set(
      rows.map(r => r.customer_id || r.CustomerId || r.user_id).filter(Boolean)
    );
    return customerIds.size || Math.floor(rows.length * 0.68); // Estimate if no customer IDs
  }

  /**
   * Calculate total hours between dates
   */
  private calculateTotalHours(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Parse multiple CSV files and merge into one campaign
   */
  async parseMultipleCSVFiles(
    filePaths: string[],
    tenantId: string,
    uploadedBy: string,
    campaignName: string
  ): Promise<string> {
    // Create campaign first
    const campaign = await (models as any).Campaign.create({
      tenantId,
      name: campaignName,
      machineId: 'Multiple Sources',
      startDate: new Date(),
      endDate: new Date(),
      totalUserInteractions: 0
    });

    // Parse each file and aggregate data
    for (const filePath of filePaths) {
      const rows: CSVRow[] = await this.readCSVFile(filePath);
      const csvType = this.detectCSVType(rows);

      // Process based on type
      if (csvType === 'transaction') {
        const busyTime = this.extractBusyTimeFromRows(rows);
        await (models as any).CampaignMetric.create({
          campaignId: campaign.id,
          metricType: 'busyTime',
          data: busyTime
        });
      } else if (csvType === 'product') {
        const products = this.extractProductsFromRows(rows);
        await (models as any).CampaignMetric.create({
          campaignId: campaign.id,
          metricType: 'products',
          data: products
        });
      }
    }

    return campaign.id;
  }

  private extractBusyTimeFromRows(rows: CSVRow[]): BusyTimeSlot[] {
    const busyTimeMap = new Map<string, number>();
    
    rows.forEach(row => {
      const timestamp = row.timestamp || row.Timestamp || row.transaction_time;
      if (timestamp) {
        const hour = this.extractHour(timestamp);
        busyTimeMap.set(hour, (busyTimeMap.get(hour) || 0) + 1);
      }
    });

    const busyTime: BusyTimeSlot[] = [];
    for (let i = 0; i < 24; i++) {
      const hourStr = `${i.toString().padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`;
      busyTime.push({
        hour: hourStr,
        interactions: busyTimeMap.get(hourStr) || 0
      });
    }

    return busyTime;
  }

  private extractProductsFromRows(rows: CSVRow[]): Product[] {
    const productMap = new Map<string, number>();
    
    rows.forEach(row => {
      const productName = row.product_name || row.Product || row.product;
      const clicks = parseInt(row.clicks || row.Clicks || '1', 10);
      
      if (productName) {
        productMap.set(productName, (productMap.get(productName) || 0) + clicks);
      }
    });

    return Array.from(productMap.entries()).map(([name, clicks]) => ({
      name,
      clicks
    }));
  }
}

export default new CSVParserService();

