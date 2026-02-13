export interface Product {
  name: string;
  clicks: number;
}

export interface BusyTimeSlot {
  hour: string;
  interactions: number;
}

export interface Campaign {
  id: string;
  name: string;
  machineId: string;
  startDate: string;
  endDate: string;
  totalProductsDispensed: number;
  totalUserInteractions: number;
  totalFreeSamplesRedeemed: number;
  totalProductClicks: number;
  products: Product[];
  uniqueCustomers: number;
  averageEngagementTime: number;
  adPlaytime: number;
  totalAdPlays: number;
  machineOfflineMinutes: number;
  totalHours: number;
  machineUptimePercent: number;
  restockTimes: number;
  restockDays: number;
  busyTime?: BusyTimeSlot[];
  productDetails?: number;
}

// REAL busy time data from That's Nuts CSV transaction report
// Source: transactions-report-045ed870-3171-44ae-9539-bf6b80389f91.csv
export const busyTimeDataThatsNuts: BusyTimeSlot[] = [
  { hour: '00-01', interactions: 9 },
  { hour: '01-02', interactions: 8 },
  { hour: '02-03', interactions: 11 },
  { hour: '03-04', interactions: 2 },
  { hour: '04-05', interactions: 1 },
  { hour: '05-06', interactions: 4 }, // REAL DATA from CSV
  { hour: '06-07', interactions: 5 },
  { hour: '07-08', interactions: 12 },
  { hour: '08-09', interactions: 29 },
  { hour: '09-10', interactions: 57 },
  { hour: '10-11', interactions: 183 },
  { hour: '11-12', interactions: 228 }, // REAL DATA from CSV
  { hour: '12-13', interactions: 362 },
  { hour: '13-14', interactions: 252 },
  { hour: '14-15', interactions: 226 },
  { hour: '15-16', interactions: 230 },
  { hour: '16-17', interactions: 183 },
  { hour: '17-18', interactions: 167 },
  { hour: '18-19', interactions: 207 },
  { hour: '19-20', interactions: 151 },
  { hour: '20-21', interactions: 97 },
  { hour: '21-22', interactions: 79 },
  { hour: '22-23', interactions: 45 },
  { hour: '23-24', interactions: 31 },
];

// Detailed busy time data for Bahlsen (still using original Europa estimates)
export const busyTimeDataOriginal: BusyTimeSlot[] = [
  { hour: '00-01', interactions: 41 },
  { hour: '01-02', interactions: 32 },
  { hour: '02-03', interactions: 32 },
  { hour: '03-04', interactions: 5 },
  { hour: '04-05', interactions: 7 },
  { hour: '05-06', interactions: 10 }, // Average estimate
  { hour: '06-07', interactions: 13 },
  { hour: '07-08', interactions: 33 },
  { hour: '08-09', interactions: 104 },
  { hour: '09-10', interactions: 204 },
  { hour: '10-11', interactions: 650 },
  { hour: '11-12', interactions: 804 }, // Average estimate
  { hour: '12-13', interactions: 957 },
  { hour: '13-14', interactions: 748 },
  { hour: '14-15', interactions: 545 },
  { hour: '15-16', interactions: 657 },
  { hour: '16-17', interactions: 512 },
  { hour: '17-18', interactions: 504 },
  { hour: '18-19', interactions: 617 },
  { hour: '19-20', interactions: 438 },
  { hour: '20-21', interactions: 323 },
  { hour: '21-22', interactions: 239 },
  { hour: '22-23', interactions: 201 },
  { hour: '23-24', interactions: 110 },
];

// REAL busy time data from Aveeno CSV transaction report
// Source: transactions-report-74208b0d-8b44-4014-b4e8-1f7fa63b9f60.csv
export const busyTimeDataAveeno: BusyTimeSlot[] = [
  { hour: '00-01', interactions: 16 },
  { hour: '01-02', interactions: 1 },
  { hour: '02-03', interactions: 2 },
  { hour: '03-04', interactions: 2 },
  { hour: '04-05', interactions: 1 },
  { hour: '05-06', interactions: 1 }, // REAL DATA from CSV
  { hour: '06-07', interactions: 10 },
  { hour: '07-08', interactions: 24 },
  { hour: '08-09', interactions: 29 },
  { hour: '09-10', interactions: 68 },
  { hour: '10-11', interactions: 159 },
  { hour: '11-12', interactions: 197 }, // REAL DATA from CSV
  { hour: '12-13', interactions: 340 },
  { hour: '13-14', interactions: 241 },
  { hour: '14-15', interactions: 121 },
  { hour: '15-16', interactions: 138 },
  { hour: '16-17', interactions: 114 },
  { hour: '17-18', interactions: 161 },
  { hour: '18-19', interactions: 230 },
  { hour: '19-20', interactions: 162 },
  { hour: '20-21', interactions: 123 },
  { hour: '21-22', interactions: 59 },
  { hour: '22-23', interactions: 24 },
  { hour: '23-24', interactions: 20 },
];

// Average interactions per hour per day (calculated from total interactions: 10,777 across 60 campaign-days = ~180/day)
// This represents the average number of customer interactions during each hour on a typical day
// Pattern matches the aggregated traffic data, scaled to align with actual total interactions
export const busyTimeDataAggregated: BusyTimeSlot[] = [
  { hour: '00-01', interactions: 0.9 },
  { hour: '01-02', interactions: 0.6 },
  { hour: '02-03', interactions: 0.6 },
  { hour: '03-04', interactions: 0.1 },
  { hour: '04-05', interactions: 0.1 },
  { hour: '05-06', interactions: 0.2 },
  { hour: '06-07', interactions: 0.4 },
  { hour: '07-08', interactions: 0.9 },
  { hour: '08-09', interactions: 2.2 },
  { hour: '09-10', interactions: 4.5 },
  { hour: '10-11', interactions: 13.5 },
  { hour: '11-12', interactions: 16.7 },
  { hour: '12-13', interactions: 22.5 },
  { hour: '13-14', interactions: 16.9 },
  { hour: '14-15', interactions: 12.1 },
  { hour: '15-16', interactions: 13.9 },
  { hour: '16-17', interactions: 11.0 },
  { hour: '17-18', interactions: 11.3 },
  { hour: '18-19', interactions: 14.3 },
  { hour: '19-20', interactions: 10.2 },
  { hour: '20-21', interactions: 7.4 },
  { hour: '21-22', interactions: 5.1 },
  { hour: '22-23', interactions: 3.7 },
  { hour: '23-24', interactions: 2.2 },
];

// Default busy time for campaigns without specific data
export const busyTimeData = busyTimeDataAggregated;

export const campaigns: Campaign[] = [
  {
    id: 'thats-nuts',
    name: "That's Nuts",
    machineId: 'BB SV365 9052627 EUROPA 200002',
    startDate: '2025-08-20',
    endDate: '2025-09-10',
    totalProductsDispensed: 2579,
    totalUserInteractions: 3308,
    totalFreeSamplesRedeemed: 2579,
    totalProductClicks: 3216,
    products: [
      { name: "That's Nuts Salt & Vinegar", clicks: 1551 },
      { name: "That's Nuts Smoky Bacon", clicks: 1665 },
    ],
    uniqueCustomers: 2258,
    averageEngagementTime: 75,
    adPlaytime: 13,
    totalAdPlays: 132923,
    machineOfflineMinutes: 47,
    totalHours: 480,
    machineUptimePercent: 99.84,
    restockTimes: 10,
    restockDays: 20,
    busyTime: busyTimeDataAggregated, // Aggregated across all campaigns
  },
  {
    id: 'bahlsen',
    name: 'Bahlsen',
    machineId: 'BB SV365 9052627 EUROPA 200002',
    startDate: '2025-09-10',
    endDate: '2025-10-01',
    totalProductsDispensed: 2724,
    totalUserInteractions: 3836,
    totalFreeSamplesRedeemed: 2724,
    totalProductClicks: 3514,
    products: [
      { name: 'Pick Up', clicks: 1838 },
      { name: 'Bahlsen Choco Leibniz', clicks: 1676 },
    ],
    uniqueCustomers: 2262,
    averageEngagementTime: 80,
    adPlaytime: 27,
    totalAdPlays: 64000,
    machineOfflineMinutes: 0,
    totalHours: 480,
    machineUptimePercent: 100,
    restockTimes: 10,
    restockDays: 20,
    busyTime: busyTimeDataAggregated, // Aggregated across all campaigns
    productDetails: 3668,
  },
  {
    id: 'aveeno',
    name: 'Aveeno',
    machineId: 'BB SV365 9052627 EUROPA 200002',
    startDate: '2025-10-01',
    endDate: '2025-10-21',
    totalProductsDispensed: 2237,
    totalUserInteractions: 3633,
    totalFreeSamplesRedeemed: 2237,
    totalProductClicks: 3166,
    products: [
      { name: 'Skin Relief', clicks: 1625 },
      { name: 'Daily Care', clicks: 1215 },
    ],
    uniqueCustomers: 1853,
    averageEngagementTime: 80,
    adPlaytime: 17,
    totalAdPlays: 106729,
    machineOfflineMinutes: 0,
    totalHours: 480,
    machineUptimePercent: 100,
    restockTimes: 9,
    restockDays: 20,
    busyTime: busyTimeDataAggregated, // Aggregated across all campaigns
  },
];

// Helper functions for calculations
export const getTotalMetrics = () => {
  return campaigns.reduce(
    (acc, campaign) => ({
      totalProductsDispensed: acc.totalProductsDispensed + campaign.totalProductsDispensed,
      totalUserInteractions: acc.totalUserInteractions + campaign.totalUserInteractions,
      totalFreeSamplesRedeemed: acc.totalFreeSamplesRedeemed + campaign.totalFreeSamplesRedeemed,
      totalProductClicks: acc.totalProductClicks + campaign.totalProductClicks,
      uniqueCustomers: acc.uniqueCustomers + campaign.uniqueCustomers,
      totalAdPlays: acc.totalAdPlays + campaign.totalAdPlays,
    }),
    {
      totalProductsDispensed: 0,
      totalUserInteractions: 0,
      totalFreeSamplesRedeemed: 0,
      totalProductClicks: 0,
      uniqueCustomers: 0,
      totalAdPlays: 0,
    }
  );
};

export const getAverageEngagementTime = () => {
  const total = campaigns.reduce((acc, campaign) => acc + campaign.averageEngagementTime, 0);
  return Math.round(total / campaigns.length);
};

export const getAverageUptime = () => {
  // Calculate weighted average uptime across all campaigns
  const totalMinutes = campaigns.reduce((acc, campaign) => acc + (campaign.totalHours * 60), 0);
  const totalOfflineMinutes = campaigns.reduce((acc, campaign) => acc + campaign.machineOfflineMinutes, 0);
  const uptimePercent = ((totalMinutes - totalOfflineMinutes) / totalMinutes) * 100;
  return uptimePercent.toFixed(2);
};

export const getCampaignById = (id: string) => {
  return campaigns.find((campaign) => campaign.id === id);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const getPeakHours = (busyTime: BusyTimeSlot[]) => {
  const sorted = [...busyTime].sort((a, b) => b.interactions - a.interactions);
  return sorted.slice(0, 3);
};

