import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export interface AttentionBuckets {
  '0-15': number;
  '15-30': number;
  '30-60': number;
  '60+': number;
}

interface AttentionDistributionProps {
  buckets: AttentionBuckets;
  total: number;
  accentColor?: string;
}

const BUCKET_ORDER: (keyof AttentionBuckets)[] = ['0-15', '15-30', '30-60', '60+'];
const BUCKET_LABELS: Record<keyof AttentionBuckets, string> = {
  '0-15': '0–15s',
  '15-30': '15–30s',
  '30-60': '30–60s',
  '60+': '60s+ (deep)',
};

export default function AttentionDistribution({ buckets, total, accentColor = '#78BE20' }: AttentionDistributionProps) {
  const chartData = BUCKET_ORDER.map((key) => ({
    name: BUCKET_LABELS[key],
    count: buckets[key] ?? 0,
    isDeep: key === '60+',
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))} />
        <Tooltip
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: 8 }}
          formatter={(value: number) => [value.toLocaleString(), total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '']}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="count" name="Sessions" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.isDeep ? accentColor : '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
