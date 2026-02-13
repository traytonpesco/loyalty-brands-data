import { getCampaignById } from '../data/campaigns';
import MetricCard from '../components/MetricCard';
import CampaignHeader from '../components/CampaignHeader';
import BusyTimeChart from '../components/charts/BusyTimeChart';
import ProductBreakdownChart from '../components/charts/ProductBreakdownChart';
import { Navigate } from 'react-router-dom';

export default function CampaignThatsNuts() {
  const campaign = getCampaignById('thats-nuts');

  if (!campaign) {
    return <Navigate to="/dashboard" replace />;
  }

  // Campaign metrics
  const campaignDays = campaign.restockDays;

  return (
    <div className="space-y-6">
      <CampaignHeader
        name={campaign.name}
        startDate={campaign.startDate}
        endDate={campaign.endDate}
        machineId={campaign.machineId}
      />

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Products Sampled"
          value={campaign.totalProductsDispensed.toLocaleString()}
          subtitle={`${(campaign.totalProductsDispensed / campaignDays).toFixed(0)} products per day`}
        />
        <MetricCard
          title="Total Interactions"
          value={campaign.totalUserInteractions.toLocaleString()}
          subtitle="Machine engagements"
        />
        <MetricCard
          title="Avg. Engagement Time"
          value={`${campaign.averageEngagementTime}s`}
          subtitle="Per interaction"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Product Detail Clicks"
          value={campaign.totalProductClicks.toLocaleString()}
          subtitle="Information requests"
        />
        <MetricCard
          title="Ad Impressions"
          value={campaign.totalAdPlays.toLocaleString()}
          subtitle={`${campaign.adPlaytime}s per ad`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductBreakdownChart products={campaign.products} />
        
        {/* Machine Performance */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-asda-darkgreen mb-4">Machine Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-lg font-bold text-asda-green">{campaign.machineUptimePercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-asda-green h-2 rounded-full"
                  style={{ width: `${campaign.machineUptimePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Online: {campaign.totalHours}h {Math.floor((campaign.totalHours * 60) - campaign.machineOfflineMinutes)}m</span>
                <span className="text-muted-foreground">Offline: {campaign.machineOfflineMinutes}m</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Restocks</span>
                <span className="text-lg font-bold text-asda-darkgreen">{campaign.restockTimes}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Restocked {campaign.restockTimes} times over {campaign.restockDays} days
                (avg. every {(campaign.restockDays / campaign.restockTimes).toFixed(1)} days)
              </p>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Campaign Duration</span>
                <span className="text-lg font-bold text-asda-darkgreen">{campaignDays} days</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Total operational hours: {campaign.totalHours}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Busy Time Chart */}
      {campaign.busyTime && <BusyTimeChart data={campaign.busyTime} title="Peak Hours" />}

      {/* Campaign Insights */}
      <div className="bg-asda-lightgray p-6 rounded-lg border-l-4 border-asda-green">
        <h3 className="text-lg font-semibold text-asda-darkgreen mb-3">Campaign Insights</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Product Performance</h4>
            <ul className="space-y-1">
              {campaign.products.map((product, idx) => {
                const percentage = ((product.clicks / campaign.totalProductClicks) * 100).toFixed(1);
                return (
                  <li key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">{product.name}</span>
                    <span className="font-medium">{percentage}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Key Metrics</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Exceptional engagement with {campaign.totalUserInteractions.toLocaleString()} total machine interactions</li>
              <li>• Strong product interest driving {campaign.totalProductClicks.toLocaleString()} product detail clicks</li>
              <li>• {campaign.machineUptimePercent}% machine reliability ensuring consistent availability</li>
              <li>• {(campaign.totalProductsDispensed / campaignDays).toFixed(0)} products sampled daily on average</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

