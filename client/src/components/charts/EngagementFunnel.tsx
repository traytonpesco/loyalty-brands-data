import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export interface FunnelData {
  impressions: number;
  interactions: number;
  completions: number;
  contacts: number;
  impressionToInteractionRate?: number;
  interactionToCompletionRate?: number;
  completionToContactRate?: number;
}

interface EngagementFunnelProps {
  data: FunnelData;
  accentColor?: string;
}

const STAGE_KEYS = ['impressions', 'interactions', 'completions', 'contacts'] as const;
const STAGE_LABELS: Record<string, string> = {
  impressions: 'Impressions',
  interactions: 'Interactions',
  completions: 'Completions',
  contacts: 'Contacts',
};

export default function EngagementFunnel({ data, accentColor = '#78BE20' }: EngagementFunnelProps) {
  const rateKeys = ['impressionToInteractionRate', 'interactionToCompletionRate', 'completionToContactRate'] as const;
  const chartData = STAGE_KEYS.map((key, i) => ({
    name: STAGE_LABELS[key],
    count: data[key],
    conversionRate: i === 0 ? undefined : (data as any)[rateKeys[i - 1]],
  }));

  const lighten = (color: string, pct: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * pct);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0xff) + amt);
    const B = Math.min(255, (num & 0xff) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  const colors = [accentColor, lighten(accentColor, 15), lighten(accentColor, 30), lighten(accentColor, 45)];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 80, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
          <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: 8 }}
            formatter={(value: number, _name: string, props: { payload?: { conversionRate?: number } }) =>
              props.payload?.conversionRate != null
                ? [value.toLocaleString(), `Conversion: ${props.payload.conversionRate.toFixed(1)}%`]
                : [value.toLocaleString()]
            }
            labelFormatter={(label) => label}
          />
          <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]} minPointSize={8}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
        {data.impressions > 0 && (
          <span>Impressions → Interactions: <strong>{data.impressionToInteractionRate?.toFixed(1) ?? 0}%</strong></span>
        )}
        {data.interactions > 0 && (
          <span>Interactions → Completions: <strong>{data.interactionToCompletionRate?.toFixed(1) ?? 0}%</strong></span>
        )}
        {data.completions > 0 && (
          <span>Completions → Contacts: <strong>{data.completionToContactRate?.toFixed(1) ?? 0}%</strong></span>
        )}
      </div>
    </div>
  );
}
