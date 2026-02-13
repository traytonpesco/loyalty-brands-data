import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Users, Package, Clock, Percent } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

interface CampaignData {
  id: string;
  name: string;
  totalUserInteractions: number;
  totalProductsDispensed: number;
  totalFreeSamplesRedeemed: number;
  uniqueCustomers: number;
  machineUptimePercent: number;
  averageEngagementTime: number;
  startDate: string;
  endDate: string;
}

interface Summary {
  totalCampaigns: number;
  totalInteractions: number;
  totalDispensed: number;
  totalSamples: number;
  totalCustomers: number;
  avgUptime: string;
  avgEngagement: string;
}

interface Prediction {
  timestamp: string;
  predicted: number;
  confidence?: number;
}

interface Trend {
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
}

interface PredictionData {
  forecast: Prediction[];
  trend: Trend;
  confidence: number;
  historical: { timestamp: string; value: number }[];
}

interface AnalyticsResponse {
  predictions: {
    interactions?: PredictionData;
    dispensed?: PredictionData;
  } | null;
  campaigns: CampaignData[];
  summary: Summary | null;
  message?: string;
}

export default function Analytics() {
  const { selectedTenant } = useTenant();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Analytics] selectedTenant:', selectedTenant);
    if (selectedTenant) {
      fetchAnalytics();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/analytics/predictions/${selectedTenant?.id}?days=14`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Analytics] Response:', result);
        setData(result);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to connect to analytics service');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTrendIcon = (trend?: string) => {
    if (trend === 'increasing') return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (trend === 'decreasing') return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-600" />;
  };

  const formatNumber = (num: number) => num.toLocaleString();

  if (!selectedTenant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">No Tenant Selected</p>
          <p className="text-gray-600">Please select a tenant from the dropdown to view analytics.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const primaryColor = selectedTenant.primaryColor || '#78BE20';
  const campaigns = data?.campaigns || [];
  const summary = data?.summary;
  const predictions = data?.predictions;

  // Prepare chart data for campaign comparison
  const comparisonData = campaigns.map(c => ({
    name: c.name,
    Interactions: c.totalUserInteractions,
    'Products Dispensed': c.totalProductsDispensed,
    Customers: c.uniqueCustomers,
  }));

  // Prepare pie chart data
  const pieData = campaigns.map(c => ({
    name: c.name,
    value: c.totalUserInteractions,
  }));

  const COLORS = [primaryColor, '#82ca9d', '#8884d8', '#ffc658', '#ff7300'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
          Campaign Analytics
        </h1>
        <p className="text-gray-600 mt-1">
          Performance insights and trends for {selectedTenant.name}
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4" style={{ color: primaryColor }} />
                <span className="text-sm text-gray-600">Campaigns</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalCampaigns}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" style={{ color: primaryColor }} />
                <span className="text-sm text-gray-600">Interactions</span>
              </div>
              <p className="text-2xl font-bold">{formatNumber(summary.totalInteractions)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4" style={{ color: primaryColor }} />
                <span className="text-sm text-gray-600">Dispensed</span>
              </div>
              <p className="text-2xl font-bold">{formatNumber(summary.totalDispensed)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" style={{ color: primaryColor }} />
                <span className="text-sm text-gray-600">Customers</span>
              </div>
              <p className="text-2xl font-bold">{formatNumber(summary.totalCustomers)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4" style={{ color: primaryColor }} />
                <span className="text-sm text-gray-600">Avg Uptime</span>
              </div>
              <p className="text-2xl font-bold">{summary.avgUptime}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" style={{ color: primaryColor }} />
                <span className="text-sm text-gray-600">Avg Engagement</span>
              </div>
              <p className="text-2xl font-bold">{summary.avgEngagement}s</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Comparison Chart */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance Comparison</CardTitle>
            <CardDescription>Side-by-side comparison of all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Legend />
                <Bar dataKey="Interactions" fill={primaryColor} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Products Dispensed" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Customers" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interaction Distribution Pie Chart */}
        {campaigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Interaction Distribution</CardTitle>
              <CardDescription>Share of interactions by campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Campaign Details Table */}
        {campaigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Key metrics for each campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">Campaign</th>
                      <th className="text-right py-2 font-semibold">Interactions</th>
                      <th className="text-right py-2 font-semibold">Dispensed</th>
                      <th className="text-right py-2 font-semibold">Uptime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign, index) => (
                      <tr key={campaign.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{campaign.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3">{formatNumber(campaign.totalUserInteractions)}</td>
                        <td className="text-right py-3">{formatNumber(campaign.totalProductsDispensed)}</td>
                        <td className="text-right py-3">{campaign.machineUptimePercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Predictions Section */}
      {predictions && (predictions.interactions || predictions.dispensed) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interactions Trend */}
          {predictions.interactions && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Interactions Trend</CardTitle>
                    <CardDescription>Historical data and forecast</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderTrendIcon(predictions.interactions.trend?.trend)}
                    <span className={`text-sm font-medium ${
                      predictions.interactions.trend?.changePercent > 0 ? 'text-green-600' :
                      predictions.interactions.trend?.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {predictions.interactions.trend?.changePercent > 0 ? '+' : ''}
                      {predictions.interactions.trend?.changePercent?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={[
                    ...(predictions.interactions.historical || []).map(h => ({
                      date: new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      value: h.value,
                      type: 'historical'
                    })),
                    ...(predictions.interactions.forecast || []).slice(0, 7).map(f => ({
                      date: new Date(f.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      predicted: f.predicted,
                      type: 'forecast'
                    }))
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke={primaryColor} strokeWidth={2} name="Historical" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="predicted" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="Forecast" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Dispensed Trend */}
          {predictions.dispensed && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Products Dispensed Trend</CardTitle>
                    <CardDescription>Historical data and forecast</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderTrendIcon(predictions.dispensed.trend?.trend)}
                    <span className={`text-sm font-medium ${
                      predictions.dispensed.trend?.changePercent > 0 ? 'text-green-600' :
                      predictions.dispensed.trend?.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {predictions.dispensed.trend?.changePercent > 0 ? '+' : ''}
                      {predictions.dispensed.trend?.changePercent?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={[
                    ...(predictions.dispensed.historical || []).map(h => ({
                      date: new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      value: h.value,
                      type: 'historical'
                    })),
                    ...(predictions.dispensed.forecast || []).slice(0, 7).map(f => ({
                      date: new Date(f.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      predicted: f.predicted,
                      type: 'forecast'
                    }))
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke={primaryColor} strokeWidth={2} name="Historical" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="predicted" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="Forecast" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">About These Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong className="text-gray-900">Campaign Comparison</strong> - Shows side-by-side metrics for all your campaigns.
            </p>
            <p>
              <strong className="text-gray-900">Trend Forecasts</strong> - Use ensemble machine learning (Linear Regression, Moving Average, Exponential Smoothing) 
              to predict future performance based on historical campaign data.
            </p>
            <p>
              <strong className="text-gray-900">Confidence Score</strong> - Higher values indicate more reliable predictions based on data consistency.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
