import { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import EngagementFunnel from '../components/charts/EngagementFunnel';
import AttentionDistribution from '../components/charts/AttentionDistribution';
import CompletionFunnel from '../components/charts/CompletionFunnel';
import MetricTimeSeries from '../components/charts/MetricTimeSeries';
import BusyTimeChart from '../components/charts/BusyTimeChart';
import ProductBreakdownChart from '../components/charts/ProductBreakdownChart';
import DateRangePicker from '../components/DateRangePicker';
import { exportPageToPDF } from '../utils/pdfExport';
import { useTenant } from '../contexts/TenantContext';
import { busyTimeDataAggregated } from '../data/campaigns';
import type { FunnelData } from '../components/charts/EngagementFunnel';
import type { AttentionBuckets } from '../components/charts/AttentionDistribution';
import type { CompletionStep } from '../components/charts/CompletionFunnel';
import type { TimeSeriesPoint } from '../components/charts/MetricTimeSeries';

interface Product {
  name: string;
  clicks: number;
}

interface BusyTimeSlot {
  hour: string;
  interactions: number;
}

interface Campaign {
  id: string;
  name: string;
  machineId: string;
  startDate: string;
  endDate: string;
  totalProductsDispensed: number;
  totalUserInteractions: number;
  totalFreeSamplesRedeemed: number;
  totalProductClicks: number;
  uniqueCustomers: number;
  averageEngagementTime: number;
  adPlaytime: number;
  totalAdPlays: number;
  machineOfflineMinutes: number;
  totalHours: number;
  machineUptimePercent: number;
  restockTimes: number;
  restockDays: number;
  CampaignMetrics?: Array<{
    metricType: string;
    data: any;
  }>;
}

interface GenericCampaignProps {
  campaignId: string;
}

interface CampaignMetrics {
  verifiedEngagement: number;
  totalImpressions: number;
  engagementRate: number;
  attentionQuality: { averageDurationSeconds: number; deepEngagementPct: number; sessionCount: number };
  experienceCompletion: { completionRate: number; journeyStarted: number; journeyCompleted: number };
  qualifiedContacts: { total: number; contactRate: number };
}

export default function GenericCampaign({ campaignId }: GenericCampaignProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [busyTime, setBusyTime] = useState<BusyTimeSlot[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [attentionDistribution, setAttentionDistribution] = useState<{ buckets: AttentionBuckets; total: number } | null>(null);
  const [completionFunnel, setCompletionFunnel] = useState<{ steps: CompletionStep[]; totalStarted: number } | null>(null);
  const [timeseries, setTimeseries] = useState<TimeSeriesPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedTenant } = useTenant();

  useEffect(() => {
    if (campaignId && selectedTenant) {
      fetchCampaignData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, selectedTenant]);

  const fetchCampaignData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [campaignRes, metricsRes, funnelRes, attentionRes, completionRes, timeseriesRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}`, { headers }),
        fetch(`/api/campaigns/${campaignId}/metrics`, { headers }),
        fetch(`/api/campaigns/${campaignId}/funnel`, { headers }),
        fetch(`/api/campaigns/${campaignId}/attention-distribution`, { headers }),
        fetch(`/api/campaigns/${campaignId}/completion-funnel`, { headers }),
        fetch(`/api/campaigns/${campaignId}/timeseries`, { headers }),
      ]);

      if (campaignRes.ok) {
        const data = await campaignRes.json();
        setCampaign(data);
        const isAsdaTenant = data.Tenant?.name === 'ASDA Demo';
        if (data.CampaignMetrics) {
          const productsMetric = data.CampaignMetrics.find((m: any) => m.metricType === 'products');
          const busyTimeMetric = data.CampaignMetrics.find((m: any) => m.metricType === 'busyTime');
          if (productsMetric) {
            const productsData = typeof productsMetric.data === 'string' ? JSON.parse(productsMetric.data) : productsMetric.data;
            setProducts(productsData);
          }
          if (isAsdaTenant) setBusyTime(busyTimeDataAggregated);
          else if (busyTimeMetric) {
            const busyTimeData = typeof busyTimeMetric.data === 'string' ? JSON.parse(busyTimeMetric.data) : busyTimeMetric.data;
            setBusyTime(busyTimeData);
          }
        } else if (isAsdaTenant) setBusyTime(busyTimeDataAggregated);
      }

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (funnelRes.ok) setFunnel(await funnelRes.json());
      if (attentionRes.ok) setAttentionDistribution(await attentionRes.json());
      if (completionRes.ok) setCompletionFunnel(await completionRes.json());
      if (timeseriesRes.ok) {
        const ts = await timeseriesRes.json();
        setTimeseries(ts.series ?? []);
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading campaign data...</div>;
  }

  if (!campaign) {
    return <div className="text-center p-8">Campaign not found</div>;
  }

  const primaryColor = selectedTenant?.primaryColor || '#78BE20';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
            {campaign.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Campaign Period: {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
          </p>
          <p className="text-sm text-gray-600 mt-1">Machine ID: {campaign.machineId}</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker />
          <button 
            onClick={exportPageToPDF} 
            className="no-print px-4 py-2 text-white rounded-md transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Four core engagement metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Verified Engagement"
            subtitle="How many people chose you"
            value={metrics.verifiedEngagement.toLocaleString()}
            context={metrics.totalImpressions > 0 ? `of ${metrics.totalImpressions.toLocaleString()} passersby = ${metrics.engagementRate}%` : undefined}
            accentColor={primaryColor}
          />
          <MetricCard
            title="Attention Quality"
            subtitle="How long they stayed"
            value={`${metrics.attentionQuality.averageDurationSeconds}s`}
            context={`${metrics.attentionQuality.deepEngagementPct}% deep engagement (60s+)`}
            accentColor={primaryColor}
          />
          <MetricCard
            title="Experience Completion"
            subtitle="Did the story land"
            value={`${metrics.experienceCompletion.completionRate}%`}
            context={`${metrics.experienceCompletion.journeyCompleted.toLocaleString()} of ${metrics.experienceCompletion.journeyStarted.toLocaleString()} completed`}
            accentColor={primaryColor}
          />
          <MetricCard
            title="Qualified Contacts"
            subtitle="Permission-based leads"
            value={metrics.qualifiedContacts.total.toLocaleString()}
            context={`${metrics.qualifiedContacts.contactRate}% of engaged`}
            accentColor={primaryColor}
          />
        </div>
      )}

      {/* Engagement Funnel */}
      {funnel && (funnel.impressions > 0 || funnel.interactions > 0) && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
            Engagement Funnel
          </h2>
          <EngagementFunnel data={funnel} accentColor={primaryColor} />
        </div>
      )}

      {/* Attention Distribution */}
      {attentionDistribution && attentionDistribution.total > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
            Attention Distribution
          </h2>
          <AttentionDistribution
            buckets={attentionDistribution.buckets}
            total={attentionDistribution.total}
            accentColor={primaryColor}
          />
        </div>
      )}

      {/* Completion Funnel */}
      {completionFunnel && completionFunnel.totalStarted > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
            Completion Funnel
          </h2>
          <CompletionFunnel
            steps={completionFunnel.steps}
            totalStarted={completionFunnel.totalStarted}
            accentColor={primaryColor}
          />
        </div>
      )}

      {/* Time series */}
      {timeseries.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
            Daily Trends
          </h2>
          <MetricTimeSeries series={timeseries} accentColor={primaryColor} />
        </div>
      )}

      {/* Legacy charts */}
      {products.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
            Product Breakdown
          </h2>
          <ProductBreakdownChart products={products} accentColor={primaryColor} />
        </div>
      )}

      {/* Hourly Footfall */}
      {busyTime.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
            Hourly Footfall Analysis
          </h2>
          <BusyTimeChart 
            data={busyTime} 
            title="Average Customer Traffic by Hour" 
            accentColor={primaryColor} 
          />
        </div>
      )}
    </div>
  );
}

