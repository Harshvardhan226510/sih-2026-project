import { DataProvenance, LocationCoordinates } from '../types/analytics.js';

export class ProvenanceService {
  public static createProvenance(
    location: LocationCoordinates,
    timeRange: { start: string; end: string },
    observationCount: number,
    aggregationPeriod: string,
    calculationMethod: string,
    source = 'Open-Meteo ECMWF ERA5 Reanalysis & IMD Climatological Reference',
    dataset = 'Copernicus Climate Change Service / Indian Meteorological Grid',
    isDemo = false
  ): DataProvenance {
    return {
      source,
      dataset,
      location: `${location.name}, ${location.state}`,
      coordinates: {
        lat: location.lat,
        lon: location.lon
      },
      timeRange,
      observationCount,
      aggregationPeriod,
      calculationMethod,
      lastUpdated: new Date().toISOString(),
      dataQualityStatus: isDemo ? 'DEMO_DATA' : 'EXCELLENT',
      isDemo
    };
  }
}
