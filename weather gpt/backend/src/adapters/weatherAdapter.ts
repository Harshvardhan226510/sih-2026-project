import { LocationCoordinates, RawWeatherRecord, DataProvenance } from '../types/analytics.js';

export interface IWeatherAdapter {
  fetchHistoricalRecords(
    location: LocationCoordinates,
    startDate: string,
    endDate: string
  ): Promise<{
    records: RawWeatherRecord[];
    provenance: DataProvenance;
  }>;

  fetchForecastComparison(
    location: LocationCoordinates,
    days?: number
  ): Promise<{
    pairs: Array<{ date: string; forecast: number; actual: number }>;
    provenance: DataProvenance;
  }>;
}
