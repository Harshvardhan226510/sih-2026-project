export class ProvenanceService {
    static createProvenance(location, timeRange, observationCount, aggregationPeriod, calculationMethod, source = 'Open-Meteo ECMWF ERA5 Reanalysis & IMD Climatological Reference', dataset = 'Copernicus Climate Change Service / Indian Meteorological Grid', isDemo = false) {
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
