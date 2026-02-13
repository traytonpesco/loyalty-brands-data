import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { BusyTimeSlot } from '../../data/campaigns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface BusyTimeChartProps {
  data: BusyTimeSlot[];
  title?: string;
  accentColor?: string;
}

export default function BusyTimeChart({ data, title = 'Customer Traffic by Hour', accentColor = '#78BE20' }: BusyTimeChartProps) {
  // Find peak hour
  const maxInteractions = Math.max(...data.map(d => d.interactions));

  // Generate darker shade for peak hour
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

  const peakColor = darkenColor(accentColor, 30);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Average interactions per hour on a typical day - showing customer traffic patterns throughout the day</CardDescription>
      </CardHeader>
      <CardContent>
        <div role="img" aria-label={`Bar chart showing customer traffic by hour. Peak hour is ${data.find(d => d.interactions === maxInteractions)?.hour} with ${maxInteractions} interactions.`}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '4px'
              }}
              formatter={(value: number) => [`${value} per hour`, 'Avg. Interactions']}
            />
            <Bar dataKey="interactions" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="interactions" position="top" style={{ fontSize: '10px', fill: '#374151' }} />
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.interactions === maxInteractions ? peakColor : accentColor} 
                />
              ))}
            </Bar>
          </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-700 text-center">
          Peak hour: {data.find(d => d.interactions === maxInteractions)?.hour} with an average of {maxInteractions} interactions per hour on a typical day
        </div>
      </CardContent>
    </Card>
  );
}

