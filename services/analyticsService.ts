import regression from 'regression';

export interface DataPoint {
  timestamp: Date;
  value: number;
}

export interface Prediction {
  timestamp: Date;
  predicted: number;
  confidence?: number;
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  rSquared: number;
  prediction: number;
  changePercent: number;
}

export interface ForecastResult {
  predictions: Prediction[];
  trend: TrendAnalysis;
  anomalies: number[];
}

/**
 * Linear regression forecasting
 */
export function linearForecast(data: DataPoint[], futurePeriods: number = 7): Prediction[] {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for forecasting');
  }

  // Convert to regression format [x, y] where x is day index
  const regressionData: [number, number][] = data.map((point, index) => [index, point.value]);
  
  // Fit linear regression model
  const result = regression.linear(regressionData);
  
  // Generate predictions
  const predictions: Prediction[] = [];
  const lastIndex = data.length - 1;
  const lastDate = new Date(data[lastIndex].timestamp);
  
  for (let i = 1; i <= futurePeriods; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    const predicted = result.predict(lastIndex + i)[1];
    
    predictions.push({
      timestamp: futureDate,
      predicted: Math.max(0, Math.round(predicted)), // Ensure non-negative
      confidence: result.r2,
    });
  }
  
  return predictions;
}

/**
 * Polynomial regression for non-linear trends
 */
export function polynomialForecast(data: DataPoint[], futurePeriods: number = 7, order: number = 2): Prediction[] {
  if (data.length < order + 1) {
    throw new Error(`Need at least ${order + 1} data points for order ${order} polynomial`);
  }

  const regressionData: [number, number][] = data.map((point, index) => [index, point.value]);
  const result = regression.polynomial(regressionData, { order });
  
  const predictions: Prediction[] = [];
  const lastIndex = data.length - 1;
  const lastDate = new Date(data[lastIndex].timestamp);
  
  for (let i = 1; i <= futurePeriods; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    const predicted = result.predict(lastIndex + i)[1];
    
    predictions.push({
      timestamp: futureDate,
      predicted: Math.max(0, Math.round(predicted)),
      confidence: result.r2,
    });
  }
  
  return predictions;
}

/**
 * Moving average forecast
 */
export function movingAverageForecast(data: DataPoint[], window: number = 7, futurePeriods: number = 7): Prediction[] {
  if (data.length < window) {
    throw new Error(`Need at least ${window} data points for moving average`);
  }

  const values = data.map(d => d.value);
  const lastDate = new Date(data[data.length - 1].timestamp);
  
  // Calculate moving average for last window
  const recentValues = values.slice(-window);
  const avg = recentValues.reduce((sum, val) => sum + val, 0) / window;
  
  // Calculate trend from recent data
  const recentTrend = (recentValues[recentValues.length - 1] - recentValues[0]) / window;
  
  const predictions: Prediction[] = [];
  
  for (let i = 1; i <= futurePeriods; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    // Combine average with trend
    const predicted = avg + (recentTrend * i);
    
    predictions.push({
      timestamp: futureDate,
      predicted: Math.max(0, Math.round(predicted)),
      confidence: 0.7, // Moderate confidence for MA
    });
  }
  
  return predictions;
}

/**
 * Exponential smoothing forecast
 */
export function exponentialSmoothingForecast(
  data: DataPoint[], 
  alpha: number = 0.3, 
  futurePeriods: number = 7
): Prediction[] {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for exponential smoothing');
  }

  const values = data.map(d => d.value);
  
  // Calculate exponentially smoothed values
  let smoothed = values[0];
  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed;
  }
  
  // Calculate trend
  const recentValues = values.slice(-7);
  const trend = (recentValues[recentValues.length - 1] - recentValues[0]) / 7;
  
  const lastDate = new Date(data[data.length - 1].timestamp);
  const predictions: Prediction[] = [];
  
  for (let i = 1; i <= futurePeriods; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    const predicted = smoothed + (trend * i);
    
    predictions.push({
      timestamp: futureDate,
      predicted: Math.max(0, Math.round(predicted)),
      confidence: 0.75,
    });
  }
  
  return predictions;
}

/**
 * Analyze trend of data
 */
export function analyzeTrend(data: DataPoint[]): TrendAnalysis {
  if (data.length < 2) {
    return {
      trend: 'stable',
      slope: 0,
      rSquared: 0,
      prediction: data[0]?.value || 0,
      changePercent: 0,
    };
  }

  const regressionData: [number, number][] = data.map((point, index) => [index, point.value]);
  const result = regression.linear(regressionData);
  
  const slope = result.equation[0];
  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const changePercent = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  
  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(slope) > 0.1) {
    trend = slope > 0 ? 'increasing' : 'decreasing';
  }
  
  // Predict next value
  const nextPrediction = result.predict(data.length)[1];
  
  return {
    trend,
    slope,
    rSquared: result.r2,
    prediction: Math.max(0, Math.round(nextPrediction)),
    changePercent: Math.round(changePercent * 100) / 100,
  };
}

/**
 * Detect anomalies using IQR method
 */
export function detectAnomalies(data: DataPoint[]): number[] {
  if (data.length < 4) {
    return [];
  }

  const values = data.map(d => d.value);
  const sorted = [...values].sort((a, b) => a - b);
  
  // Calculate Q1, Q3, and IQR
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  // Find anomaly indices
  const anomalies: number[] = [];
  values.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      anomalies.push(index);
    }
  });
  
  return anomalies;
}

/**
 * Comprehensive forecast with ensemble approach
 */
export function ensembleForecast(data: DataPoint[], futurePeriods: number = 7): ForecastResult {
  if (data.length < 7) {
    throw new Error('Need at least 7 data points for ensemble forecasting');
  }

  // Get predictions from multiple models
  const linearPred = linearForecast(data, futurePeriods);
  const maPred = movingAverageForecast(data, Math.min(7, data.length), futurePeriods);
  const esPred = exponentialSmoothingForecast(data, 0.3, futurePeriods);
  
  // Ensemble: average of all models
  const predictions: Prediction[] = [];
  for (let i = 0; i < futurePeriods; i++) {
    const avgPredicted = Math.round(
      (linearPred[i].predicted + maPred[i].predicted + esPred[i].predicted) / 3
    );
    
    predictions.push({
      timestamp: linearPred[i].timestamp,
      predicted: avgPredicted,
      confidence: (linearPred[i].confidence! + maPred[i].confidence! + esPred[i].confidence!) / 3,
    });
  }
  
  // Analyze trend
  const trend = analyzeTrend(data);
  
  // Detect anomalies
  const anomalies = detectAnomalies(data);
  
  return {
    predictions,
    trend,
    anomalies,
  };
}

/**
 * Calculate seasonality patterns
 */
export function analyzeSeasonality(data: DataPoint[], period: number = 7): { pattern: number[], strength: number } {
  if (data.length < period * 2) {
    return { pattern: [], strength: 0 };
  }

  const values = data.map(d => d.value);
  const pattern: number[] = new Array(period).fill(0);
  const counts: number[] = new Array(period).fill(0);
  
  // Calculate average for each position in the period
  values.forEach((value, index) => {
    const pos = index % period;
    pattern[pos] += value;
    counts[pos]++;
  });
  
  // Average the patterns
  for (let i = 0; i < period; i++) {
    pattern[i] = counts[i] > 0 ? pattern[i] / counts[i] : 0;
  }
  
  // Calculate seasonality strength (coefficient of variation)
  const mean = pattern.reduce((sum, val) => sum + val, 0) / pattern.length;
  const variance = pattern.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pattern.length;
  const stdDev = Math.sqrt(variance);
  const strength = mean !== 0 ? (stdDev / mean) : 0;
  
  return { pattern, strength };
}

/**
 * Generate insights from campaign data
 */
export interface CampaignInsight {
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  metric: string;
  value: number;
}

export function generateInsights(
  historical: DataPoint[],
  forecast: ForecastResult,
  metricName: string
): CampaignInsight[] {
  const insights: CampaignInsight[] = [];
  
  // Trend insights
  if (forecast.trend.trend === 'decreasing' && forecast.trend.changePercent < -10) {
    insights.push({
      type: 'warning',
      title: `Declining ${metricName}`,
      description: `${metricName} has decreased by ${Math.abs(forecast.trend.changePercent).toFixed(1)}% recently. Consider reviewing campaign strategy.`,
      metric: metricName,
      value: forecast.trend.changePercent,
    });
  } else if (forecast.trend.trend === 'increasing' && forecast.trend.changePercent > 10) {
    insights.push({
      type: 'success',
      title: `Growing ${metricName}`,
      description: `${metricName} has increased by ${forecast.trend.changePercent.toFixed(1)}%! Campaign is performing well.`,
      metric: metricName,
      value: forecast.trend.changePercent,
    });
  }
  
  // Anomaly insights
  if (forecast.anomalies.length > 0) {
    insights.push({
      type: 'info',
      title: 'Unusual Activity Detected',
      description: `Detected ${forecast.anomalies.length} unusual data point(s). This could indicate special events or data quality issues.`,
      metric: metricName,
      value: forecast.anomalies.length,
    });
  }
  
  // Forecast insights
  const lastValue = historical[historical.length - 1].value;
  const nextPredicted = forecast.predictions[0].predicted;
  const predictedChange = ((nextPredicted - lastValue) / lastValue) * 100;
  
  if (Math.abs(predictedChange) > 15) {
    insights.push({
      type: predictedChange > 0 ? 'success' : 'warning',
      title: 'Significant Change Expected',
      description: `${metricName} is predicted to ${predictedChange > 0 ? 'increase' : 'decrease'} by ${Math.abs(predictedChange).toFixed(1)}% tomorrow.`,
      metric: metricName,
      value: predictedChange,
    });
  }
  
  return insights;
}

