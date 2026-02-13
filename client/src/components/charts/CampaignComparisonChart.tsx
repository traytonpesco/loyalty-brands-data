import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface Campaign {
  name: string;
  totalProductsDispensed: number;
  totalUserInteractions: number;
  totalProductClicks: number;
}

interface CampaignComparisonChartProps {
  campaigns: Campaign[];
  accentColor?: string;
}

export default function CampaignComparisonChart({ campaigns, accentColor = '#78BE20' }: CampaignComparisonChartProps) {
  const comparisonData = campaigns.map(campaign => ({
    name: campaign.name,
    'Products Sampled': campaign.totalProductsDispensed,
    'Total Interactions': campaign.totalUserInteractions,
    'Product Detail Clicks': campaign.totalProductClicks,
  }));

  // Generate color variations based on accent color
  const lightenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  };

  const darkenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
      (G > 0 ? G : 0) * 0x100 +
      (B > 0 ? B : 0))
      .toString(16).slice(1);
  };

  const primaryColor = accentColor;
  const secondaryColor = darkenColor(accentColor, 20);
  const tertiaryColor = lightenColor(accentColor, 20);

  return (
    <ResponsiveContainer width="100%" height={450}>
      <BarChart data={comparisonData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e0e0e0',
            borderRadius: '4px' 
          }}
          formatter={(value: number) => value.toLocaleString()}
        />
        <Legend 
          verticalAlign="bottom" 
          align="center" 
          wrapperStyle={{ paddingTop: '20px' }}
        />
        <Bar dataKey="Products Sampled" fill={primaryColor} radius={[4, 4, 0, 0]}>
          <LabelList dataKey="Products Sampled" position="top" style={{ fontSize: '10px', fill: '#374151' }} />
        </Bar>
        <Bar dataKey="Total Interactions" fill={secondaryColor} radius={[4, 4, 0, 0]}>
          <LabelList dataKey="Total Interactions" position="top" style={{ fontSize: '10px', fill: '#374151' }} />
        </Bar>
        <Bar dataKey="Product Detail Clicks" fill={tertiaryColor} radius={[4, 4, 0, 0]}>
          <LabelList dataKey="Product Detail Clicks" position="top" style={{ fontSize: '10px', fill: '#374151' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

