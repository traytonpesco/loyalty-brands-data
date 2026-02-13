import { useEffect, useState } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { useDateRange } from '../contexts/DateRangeContext';
import MetricCard from '../components/MetricCard';
import CampaignComparisonChart from '../components/charts/CampaignComparisonChart';
import BusyTimeChart from '../components/charts/BusyTimeChart';
import DateRangePicker from '../components/DateRangePicker';
import ExportDialog from '../components/ExportDialog';
import { exportPageToPDF } from '../utils/pdfExport';
import { busyTimeDataAggregated } from '../data/campaigns';

interface Campaign {
  name: string;
  totalProductsDispensed: number;
  totalUserInteractions: number;
  totalProductClicks: number;
}

interface AggregatedData {
  totalProductsDispensed: number;
  totalUserInteractions: number;
  totalFreeSamplesRedeemed: number;
  totalProductClicks: number;
  uniqueCustomers: number;
  totalAdPlays: number;
  averageEngagementTime: number;
  averageUptime: string;
  campaignCount: number;
  verifiedEngagement?: number;
  totalImpressions?: number;
  engagementRate?: number;
  completionRate?: number;
  qualifiedContacts?: number;
  contactRate?: number;
  avgDurationSeconds?: number;
  deepEngagementPct?: number;
  journeyCompleted?: number;
}

export default function CampaignOverviewAPI() {
  const { selectedTenant } = useTenant();
  const { dateRange } = useDateRange();
  const [aggregatedData, setAggregatedData] = useState<AggregatedData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedTenant) {
      setIsLoading(true);
      fetchAggregatedData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant, dateRange]);

  const fetchAggregatedData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query string with date range if present
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const queryString = params.toString();
      
      const response = await fetch(
        `/api/campaigns/tenant/${selectedTenant?.id}/aggregate${queryString ? `?${queryString}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAggregatedData(data);
      }

      // Also fetch campaigns for comparison chart
      const campaignsResponse = await fetch(
        `/api/campaigns?tenantId=${selectedTenant?.id}${queryString ? `&${queryString}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData);
      }
    } catch (error) {
      console.error('Error fetching aggregated data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading overview data...</div>;
  }

  if (!aggregatedData) {
    return <div className="text-center p-8">No data available</div>;
  }

  const primaryColor = selectedTenant?.primaryColor || '#78BE20';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
            Campaign Overview
          </h1>
          <p className="text-gray-600 mt-1">
            Overall performance across {aggregatedData.campaignCount} {selectedTenant?.name} campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker />
          <ExportDialog 
            type="aggregate"
            tenantId={selectedTenant?.id}
            buttonText="Export Data"
          />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Verified Engagement"
          subtitle="How many people chose you"
          value={(aggregatedData.verifiedEngagement ?? 0).toLocaleString()}
          context={
            (aggregatedData.totalImpressions ?? 0) > 0
              ? `of ${(aggregatedData.totalImpressions ?? 0).toLocaleString()} passersby = ${(aggregatedData.engagementRate ?? 0)}%`
              : undefined
          }
          accentColor={primaryColor}
        />
        <MetricCard
          title="Attention Quality"
          subtitle="How long they stayed"
          value={`${aggregatedData.avgDurationSeconds ?? 0}s`}
          context={
            (aggregatedData.verifiedEngagement ?? 0) > 0
              ? `${aggregatedData.deepEngagementPct ?? 0}% deep engagement (60s+)`
              : undefined
          }
          accentColor={primaryColor}
        />
        <MetricCard
          title="Experience Completion"
          subtitle="Did the story land"
          value={`${aggregatedData.completionRate ?? 0}%`}
          context={
            (aggregatedData.verifiedEngagement ?? 0) > 0
              ? `${(aggregatedData.journeyCompleted ?? 0).toLocaleString()} of ${(aggregatedData.verifiedEngagement ?? 0).toLocaleString()} completed`
              : undefined
          }
          accentColor={primaryColor}
        />
        <MetricCard
          title="Qualified Contacts"
          subtitle="Permission-based leads"
          value={(aggregatedData.qualifiedContacts ?? 0).toLocaleString()}
          context={
            (aggregatedData.verifiedEngagement ?? 0) > 0
              ? `${aggregatedData.contactRate ?? 0}% of engaged`
              : undefined
          }
          accentColor={primaryColor}
        />
      </div>

      {/* Campaign Comparison */}
      {campaigns.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
            Campaign Comparison
          </h2>
          <CampaignComparisonChart campaigns={campaigns} accentColor={primaryColor} />
        </div>
      )}

      {/* Hourly Footfall - Aggregated Across All Campaigns */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
          Hourly Footfall Analysis
        </h2>
        <BusyTimeChart 
          data={busyTimeDataAggregated} 
          title="Average Customer Traffic by Hour"
          accentColor={primaryColor}
        />
      </div>
    </div>
  );
}

