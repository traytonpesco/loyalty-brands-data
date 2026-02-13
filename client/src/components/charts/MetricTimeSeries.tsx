import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface TimeSeriesPoint {
  date: string;
  interactions: number;
  completions: number;
  contacts: number;
}

interface MetricTimeSeriesProps {
  series: TimeSeriesPoint[];
  accentColor?: string;
}

const lighten = (color: string, pct: number) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * pct);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0xff) + amt);
  const B = Math.min(255, (num & 0xff) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};

export default function MetricTimeSeries({ series, accentColor = '#78BE20' }: MetricTimeSeriesProps) {
  const colors = {
    interactions: accentColor,
    completions: lighten(accentColor, 20),
    contacts: lighten(accentColor, 40),
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDate} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: 8 }}
          labelFormatter={formatDate}
          formatter={(value: number) => value.toLocaleString()}
        />
        <Legend wrapperStyle={{ paddingTop: 8 }} />
        <Line type="monotone" dataKey="interactions" name="Interactions" stroke={colors.interactions} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="completions" name="Completions" stroke={colors.completions} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="contacts" name="Contacts" stroke={colors.contacts} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
