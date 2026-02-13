import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export interface CompletionStep {
  step: number;
  count: number;
}

interface CompletionFunnelProps {
  steps: CompletionStep[];
  totalStarted: number;
  accentColor?: string;
}

export default function CompletionFunnel({ steps, totalStarted, accentColor = '#78BE20' }: CompletionFunnelProps) {
  const chartData = steps.map((s) => ({
    name: `Step ${s.step}`,
    step: s.step,
    count: s.count,
  })).filter((d) => d.count > 0);

  const lighten = (color: string, pct: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * pct);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0xff) + amt);
    const B = Math.min(255, (num & 0xff) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  return (
    <div className="w-full">
      {totalStarted > 0 && (
        <p className="text-sm text-gray-600 mb-2">
          Users who started the journey: <strong>{totalStarted.toLocaleString()}</strong>
        </p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData.length ? chartData : [{ name: 'No data', step: 0, count: 0 }]} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: 8 }}
            formatter={(value: number, _name: string, props: { payload?: { step: number } }) =>
              [value.toLocaleString(), props.payload?.step != null && totalStarted > 0 ? `${((value / totalStarted) * 100).toFixed(1)}% reached` : '']
            }
          />
          <Bar dataKey="count" name="Reached step" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={lighten(accentColor, i * 12)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
