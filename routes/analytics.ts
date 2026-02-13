import express from 'express';
import models from '../models';
import { requirePermission } from '../middleware/rbac';
import {
  ensembleForecast,
  linearForecast,
  analyzeTrend,
  analyzeSeasonality,
  generateInsights,
  DataPoint,
} from '../services/analyticsService';

const router = express.Router();

/**
 * Helper to get user's tenant IDs
 */
async function getUserTenantIds(user: any): Promise<string[]> {
  if (!user) return [];
  
  const roles = await user.getRoles();
  const isSuperAdmin = roles.some((r: any) => r.name === 'super_admin');
  
  if (isSuperAdmin) {
    const allTenants = await (models as any).Tenant.findAll({ attributes: ['id'] });
    return allTenants.map((t: any) => t.id);
  }
  
  const tenants = await user.getTenants();
  return tenants.map((t: any) => t.id);
}

/**
 * Forecast campaign metric
 * POST /api/analytics/forecast
 * Body: { campaignId: string, metric: string, periods?: number, method?: string }
 */
router.post('/forecast', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { campaignId, metric, periods = 7, method = 'ensemble' } = req.body;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    if (!campaignId || !metric) {
      return res.status(400).json({ error: 'campaignId and metric are required' });
    }

    const campaign = await (models as any).Campaign.findByPk(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (!tenantIds.includes(campaign.tenantId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get historical metrics data
    const metrics = await (models as any).CampaignMetric.findAll({
      where: { campaignId, metricType: metric },
      order: [['createdAt', 'ASC']],
    });

    if (metrics.length < 7) {
      return res.status(400).json({ 
        error: 'Need at least 7 historical data points for forecasting' 
      });
    }

    // Convert to DataPoint format
    const dataPoints: DataPoint[] = metrics.map((m: any) => ({
      timestamp: new Date(m.createdAt),
      value: typeof m.data === 'object' ? m.data.value : m.data,
    }));

    // Generate forecast based on method
    let result;
    if (method === 'linear') {
      const predictions = linearForecast(dataPoints, periods);
      const trend = analyzeTrend(dataPoints);
      result = { predictions, trend, method: 'linear' };
    } else {
      // Ensemble (default)
      result = ensembleForecast(dataPoints, periods);
      result = { ...result, method: 'ensemble' };
    }

    res.json(result);
  } catch (error: any) {
    console.error('Forecast error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze trends for tenant
 * GET /api/analytics/trends/:tenantId
 * Query: metric (optional), startDate, endDate
 */
router.get('/trends/:tenantId', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { metric, startDate, endDate } = req.query;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    if (!tenantIds.includes(tenantId)) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    const campaigns = await (models as any).Campaign.findAll({
      where: { tenantId },
    });

    if (campaigns.length === 0) {
      return res.json({ trends: [], message: 'No campaigns found' });
    }

    // Aggregate metrics by date
    const metricTypes = metric 
      ? [metric as string] 
      : ['totalProductsDispensed', 'totalUserInteractions', 'uniqueCustomers'];

    const trends: any = {};

    for (const metricType of metricTypes) {
      const dataPoints: DataPoint[] = [];
      
      for (const campaign of campaigns) {
        // Create data points from campaign data
        const startDate = new Date(campaign.startDate);
        const endDate = new Date(campaign.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Distribute metric values over campaign duration
        const dailyValue = (campaign[metricType] || 0) / days;
        
        for (let i = 0; i <= days; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          
          dataPoints.push({
            timestamp: date,
            value: dailyValue,
          });
        }
      }

      if (dataPoints.length >= 2) {
        const analysis = analyzeTrend(dataPoints);
        const seasonality = analyzeSeasonality(dataPoints, 7);
        
        trends[metricType] = {
          ...analysis,
          seasonality,
          dataPoints: dataPoints.slice(-30), // Last 30 days
        };
      }
    }

    res.json({ trends });
  } catch (error: any) {
    console.error('Trend analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate insights for campaign
 * GET /api/analytics/insights/:campaignId
 */
router.get('/insights/:campaignId', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { campaignId } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    const campaign = await (models as any).Campaign.findByPk(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (!tenantIds.includes(campaign.tenantId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allInsights: any[] = [];
    
    // Analyze key metrics
    const metricsToAnalyze = [
      { key: 'totalProductsDispensed', name: 'Product Dispensations' },
      { key: 'totalUserInteractions', name: 'User Interactions' },
      { key: 'uniqueCustomers', name: 'Unique Customers' },
    ];

    for (const metricInfo of metricsToAnalyze) {
      try {
        const metrics = await (models as any).CampaignMetric.findAll({
          where: { campaignId, metricType: metricInfo.key },
          order: [['createdAt', 'ASC']],
        });

        if (metrics.length >= 7) {
          const dataPoints: DataPoint[] = metrics.map((m: any) => ({
            timestamp: new Date(m.createdAt),
            value: typeof m.data === 'object' ? m.data.value : m.data,
          }));

          const forecast = ensembleForecast(dataPoints, 7);
          const insights = generateInsights(dataPoints, forecast, metricInfo.name);
          allInsights.push(...insights);
        }
      } catch (error) {
        console.error(`Error analyzing ${metricInfo.key}:`, error);
      }
    }

    // Add campaign-specific insights
    if (campaign.machineUptimePercent < 95) {
      allInsights.push({
        type: 'warning',
        title: 'Low Machine Uptime',
        description: `Machine uptime is ${campaign.machineUptimePercent}%. Consider maintenance to improve reliability.`,
        metric: 'uptime',
        value: campaign.machineUptimePercent,
      });
    }

    if (campaign.averageEngagementTime < 30) {
      allInsights.push({
        type: 'info',
        title: 'Short Engagement Time',
        description: `Average engagement is ${campaign.averageEngagementTime}s. Consider more engaging content to increase interaction time.`,
        metric: 'engagement',
        value: campaign.averageEngagementTime,
      });
    }

    res.json({ insights: allInsights, campaignName: campaign.name });
  } catch (error: any) {
    console.error('Insights error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Compare campaigns performance
 * POST /api/analytics/compare
 * Body: { campaignIds: string[], metric: string }
 */
router.post('/compare', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { campaignIds, metric = 'totalUserInteractions' } = req.body;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length < 2) {
      return res.status(400).json({ 
        error: 'Need at least 2 campaign IDs for comparison' 
      });
    }

    const campaigns = await (models as any).Campaign.findAll({
      where: { id: campaignIds },
    });

    // Verify access
    for (const campaign of campaigns) {
      if (!tenantIds.includes(campaign.tenantId)) {
        return res.status(403).json({ error: 'Access denied to one or more campaigns' });
      }
    }

    const comparison: any[] = [];

    for (const campaign of campaigns) {
      const value = campaign[metric] || 0;
      const trend = analyzeTrend([
        { timestamp: new Date(campaign.startDate), value: 0 },
        { timestamp: new Date(campaign.endDate), value },
      ]);

      comparison.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        value,
        trend: trend.trend,
        changePercent: trend.changePercent,
      });
    }

    // Sort by value descending
    comparison.sort((a, b) => b.value - a.value);

    res.json({ comparison, metric });
  } catch (error: any) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get performance predictions for tenant
 * GET /api/analytics/predictions/:tenantId
 */
router.get('/predictions/:tenantId', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { days = 14 } = req.query;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    if (!tenantIds.includes(tenantId)) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    const campaigns = await (models as any).Campaign.findAll({
      where: { tenantId },
      order: [['startDate', 'ASC']],
    });

    console.log(`[Analytics] Found ${campaigns.length} campaigns for tenant ${tenantId}`);

    if (campaigns.length === 0) {
      return res.json({ 
        predictions: null, 
        campaigns: [],
        summary: null,
        message: 'No campaigns found' 
      });
    }

    // Build campaign summary data
    const campaignSummary = campaigns.map((c: any) => ({
      id: c.id,
      name: c.name,
      totalUserInteractions: c.totalUserInteractions || 0,
      totalProductsDispensed: c.totalProductsDispensed || 0,
      totalFreeSamplesRedeemed: c.totalFreeSamplesRedeemed || 0,
      uniqueCustomers: c.uniqueCustomers || 0,
      machineUptimePercent: c.machineUptimePercent || 100,
      averageEngagementTime: c.averageEngagementTime || 0,
      startDate: c.startDate,
      endDate: c.endDate,
    }));

    // Calculate aggregated summary
    const summary = {
      totalCampaigns: campaigns.length,
      totalInteractions: campaigns.reduce((sum: number, c: any) => sum + (c.totalUserInteractions || 0), 0),
      totalDispensed: campaigns.reduce((sum: number, c: any) => sum + (c.totalProductsDispensed || 0), 0),
      totalSamples: campaigns.reduce((sum: number, c: any) => sum + (c.totalFreeSamplesRedeemed || 0), 0),
      totalCustomers: campaigns.reduce((sum: number, c: any) => sum + (c.uniqueCustomers || 0), 0),
      avgUptime: (campaigns.reduce((sum: number, c: any) => sum + (c.machineUptimePercent || 100), 0) / campaigns.length).toFixed(2),
      avgEngagement: (campaigns.reduce((sum: number, c: any) => sum + (c.averageEngagementTime || 0), 0) / campaigns.length).toFixed(1),
    };

    // Aggregate historical performance for predictions
    const totalInteractions: DataPoint[] = [];
    const totalDispensed: DataPoint[] = [];
    
    campaigns.forEach((campaign: any) => {
      const date = new Date(campaign.endDate || campaign.startDate);
      if (campaign.totalUserInteractions > 0) {
        totalInteractions.push({
          timestamp: date,
          value: campaign.totalUserInteractions,
        });
      }
      if (campaign.totalProductsDispensed > 0) {
        totalDispensed.push({
          timestamp: date,
          value: campaign.totalProductsDispensed,
        });
      }
    });

    // Sort by date
    totalInteractions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    totalDispensed.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    console.log(`[Analytics] Data points - Interactions: ${totalInteractions.length}, Dispensed: ${totalDispensed.length}`);

    const predictions: any = {};

    // Generate predictions if we have enough data points
    if (totalInteractions.length >= 2) {
      try {
        const interactionsForecast = ensembleForecast(totalInteractions, parseInt(days as string));
        predictions.interactions = {
          forecast: interactionsForecast.predictions,
          trend: interactionsForecast.trend,
          confidence: interactionsForecast.predictions[0]?.confidence || 0,
          historical: totalInteractions.map(d => ({
            timestamp: d.timestamp.toISOString(),
            value: d.value,
          })),
        };
      } catch (e) {
        console.error('[Analytics] Error forecasting interactions:', e);
      }
    }

    if (totalDispensed.length >= 2) {
      try {
        const dispensedForecast = ensembleForecast(totalDispensed, parseInt(days as string));
        predictions.dispensed = {
          forecast: dispensedForecast.predictions,
          trend: dispensedForecast.trend,
          confidence: dispensedForecast.predictions[0]?.confidence || 0,
          historical: totalDispensed.map(d => ({
            timestamp: d.timestamp.toISOString(),
            value: d.value,
          })),
        };
      } catch (e) {
        console.error('[Analytics] Error forecasting dispensed:', e);
      }
    }

    res.json({ 
      predictions: Object.keys(predictions).length > 0 ? predictions : null,
      campaigns: campaignSummary,
      summary,
      tenantId 
    });
  } catch (error: any) {
    console.error('Predictions error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

