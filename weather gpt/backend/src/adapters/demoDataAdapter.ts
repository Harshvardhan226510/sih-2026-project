import { LocationCoordinates, RawWeatherRecord, DataProvenance } from '../types/analytics.js';
import { IWeatherAdapter } from './weatherAdapter.js';

export class DemoDataAdapter implements IWeatherAdapter {
  private generateSyntheticRecords(
    location: LocationCoordinates,
    startDate: string,
    endDate: string
  ): RawWeatherRecord[] {
    const records: RawWeatherRecord[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // City baseline parameters (Indian climate baseline approximations)
    const isCoastal = location.name.toLowerCase().includes('mumbai') || 
                      location.name.toLowerCase().includes('chennai') || 
                      location.name.toLowerCase().includes('kochi') || 
                      location.name.toLowerCase().includes('kolkata');
    
    const isHilly = location.name.toLowerCase().includes('shimla');
    const isArid = location.name.toLowerCase().includes('jaipur') || location.name.toLowerCase().includes('ahmedabad');

    let curr = new Date(start);
    let dayIndex = 0;

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const month = curr.getMonth(); // 0 to 11 (0=Jan, 6=July)
      const isMonsoon = month >= 5 && month <= 8; // June to Sept
      const isSummer = month >= 2 && month <= 4; // March to May

      // Rainfall logic
      let baseRain = 0;
      if (isMonsoon) {
        baseRain = isCoastal ? 22.5 : isHilly ? 16.0 : 12.0;
        // Periodic monsoon surges
        if (dayIndex % 7 === 0 || dayIndex % 11 === 0) {
          baseRain *= 2.8;
        }
      } else if (isSummer) {
        baseRain = 1.2;
      } else {
        baseRain = 0.4;
      }

      // Add realistic meteorological variation
      const rainNoise = Math.sin(dayIndex * 0.25) * 4 + (Math.cos(dayIndex * 0.05) > 0.6 ? 15 : 0);
      const rainfall = Math.max(0, Number((baseRain + rainNoise).toFixed(1)));

      // Temperature logic
      let baseTemp = 27.0;
      if (isSummer) {
        baseTemp = isArid ? 38.0 : isCoastal ? 32.0 : 35.0;
      } else if (isMonsoon) {
        baseTemp = isCoastal ? 28.0 : 26.5;
      } else {
        // Winter
        baseTemp = isHilly ? 8.0 : isArid ? 18.0 : 22.0;
      }
      const tempNoise = Math.sin(dayIndex * 0.1) * 2.5;
      const temperature = Number((baseTemp + tempNoise).toFixed(1));
      const temp_max = Number((temperature + 4.5 + Math.random()).toFixed(1));
      const temp_min = Number((temperature - 4.5 - Math.random()).toFixed(1));

      // Humidity logic
      let humidityBase = isCoastal ? 78 : 55;
      if (isMonsoon) humidityBase += 22;
      if (isSummer && isArid) humidityBase -= 30;
      const humidity = Math.min(100, Math.max(15, Number((humidityBase + Math.sin(dayIndex * 0.2) * 8).toFixed(1))));

      // Wind & Pressure
      const wind_speed = Number((12.0 + (isMonsoon ? 10.0 : 0) + Math.sin(dayIndex * 0.3) * 5).toFixed(1));
      const pressure = Number((1012.0 - (isMonsoon ? 8.0 : 0) + Math.cos(dayIndex * 0.1) * 3).toFixed(1));
      const cloud_cover = isMonsoon ? 82 : isSummer ? 20 : 35;

      records.push({
        date: dateStr,
        timestamp: curr.getTime(),
        rainfall,
        temperature,
        temp_max,
        temp_min,
        humidity,
        wind_speed,
        pressure,
        cloud_cover
      });

      curr.setDate(curr.getDate() + 1);
      dayIndex++;
    }

    return records;
  }

  async fetchHistoricalRecords(
    location: LocationCoordinates,
    startDate: string,
    endDate: string
  ): Promise<{ records: RawWeatherRecord[]; provenance: DataProvenance }> {
    const records = this.generateSyntheticRecords(location, startDate, endDate);
    const provenance: DataProvenance = {
      source: 'Demo Dataset (IMD Climatological Reference Model)',
      dataset: 'Simulated High-Fidelity Indian Meteorological Time Series',
      location: `${location.name}, ${location.state}`,
      coordinates: { lat: location.lat, lon: location.lon },
      timeRange: { start: startDate, end: endDate },
      observationCount: records.length,
      aggregationPeriod: 'daily',
      calculationMethod: 'Climatological Normal Distribution + Regional Monsoon Forcing',
      lastUpdated: new Date().toISOString(),
      dataQualityStatus: 'DEMO_DATA',
      isDemo: true
    };

    return { records, provenance };
  }

  async fetchForecastComparison(
    location: LocationCoordinates,
    days: number = 14
  ): Promise<{ pairs: Array<{ date: string; forecast: number; actual: number }>; provenance: DataProvenance }> {
    const pairs: Array<{ date: string; forecast: number; actual: number }> = [];
    const today = new Date();

    for (let i = days; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Simulated forecast with known error distribution
      const baseVal = 26.5 + Math.sin(i * 0.4) * 4;
      const actual = Number(baseVal.toFixed(1));
      const forecastError = (Math.sin(i * 1.5) * 1.8) + (i > 7 ? 1.2 : 0.4);
      const forecast = Number((actual + forecastError).toFixed(1));

      pairs.push({
        date: dateStr,
        forecast,
        actual
      });
    }

    const provenance: DataProvenance = {
      source: 'Demo Forecast Verification Model',
      dataset: 'Numerical Weather Prediction (NWP) vs Synoptic Observations',
      location: `${location.name}, ${location.state}`,
      coordinates: { lat: location.lat, lon: location.lon },
      timeRange: { start: pairs[0].date, end: pairs[pairs.length - 1].date },
      observationCount: pairs.length,
      aggregationPeriod: 'daily',
      calculationMethod: 'Paired Verification Matrix (Forecast vs Station Actual)',
      lastUpdated: new Date().toISOString(),
      dataQualityStatus: 'DEMO_DATA',
      isDemo: true
    };

    return { pairs, provenance };
  }
}
