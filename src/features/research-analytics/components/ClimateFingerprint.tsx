import React from 'react';
import { ClimateFingerprintResponse } from '../types/analytics.js';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart,
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Compass, CloudRain, Thermometer, Wind, Droplets, MapPin } from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

interface Props {
  climateData: ClimateFingerprintResponse | null;
  loading: boolean;
}

export const ClimateFingerprint: React.FC<Props> = ({ climateData, loading }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!climateData) return null;

  return (
    <div className="space-y-6">
      {/* Location Fingerprint Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Climatological Fingerprint & Profile
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mt-1">
              {climateData.location}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Coordinates: {climateData.coordinates.lat}° N, {climateData.coordinates.lon}° E</span>
              <span>•</span>
              <span>Elevation: {climateData.elevationMeters} m ASL</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 text-right">
            <div className="text-[10px] uppercase font-bold text-slate-500">Koppen Classification Proxy</div>
            <div className="text-sm font-bold text-indigo-300 mt-0.5">{climateData.climateZone}</div>
            <div className="text-[11px] text-slate-500">{climateData.dominantWeatherPattern}</div>
          </div>
        </div>

        {/* 4 Feature Matrix Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/70 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-400" />
              MONSOON SHARE
            </div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {climateData.rainfallSeasonality.monsoonPct}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {climateData.rainfallVariability.monsoonMeanMm} mm monsoon average
            </div>
          </div>

          <div className="bg-white/70 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-400" />
              ANNUAL MEAN TEMP
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {climateData.temperatureVariability.annualMean} °C
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Diurnal Range: {climateData.temperatureVariability.diurnalRangeMean} °C
            </div>
          </div>

          <div className="bg-white/70 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-400" />
              ANNUAL PRECIPITATION
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {climateData.rainfallVariability.annualMeanMm} mm
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              CV: {climateData.rainfallVariability.coefficientOfVariationPct}%
            </div>
          </div>

          <div className="bg-white/70 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-rose-400" />
              EXTREME FREQUENCY
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              {climateData.extremeEventFrequencyPerYear} / year
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Anomaly Frequency: {climateData.anomalyFrequencyPct}%
            </div>
          </div>
        </div>
      </div>

      {/* 12-Month Climatological Normal Chart & Seasonal Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              12-Month Climatological Normals (Rainfall & Temperature Envelope)
            </h3>
          </div>

          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={climateData.monthlyNormals} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1329', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="avgRainfall" fill="#3b82f6" name="Precipitation Normal (mm)" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avgTemp" stroke="#f59e0b" strokeWidth={2.5} name="Temperature Normal (°C)" />
                <Line yAxisId="left" type="monotone" dataKey="avgHumidity" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="3 3" name="Relative Humidity (%)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-400" />
              Rainfall Distribution
            </h3>
          </div>
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { season: 'Winter', value: climateData.rainfallSeasonality.winterPct },
                { season: 'Pre-Monsoon', value: climateData.rainfallSeasonality.summerPct },
                { season: 'Monsoon', value: climateData.rainfallSeasonality.monsoonPct },
                { season: 'Post-Monsoon', value: climateData.rainfallSeasonality.postMonsoonPct }
              ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="season" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1329', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Share']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Percentage Share" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <DataProvenance provenance={climateData.provenance} />
    </div>
  );
};
