# WeatherGPT — Research & Analytics Module

> **Smart India Hackathon (SIH)**  
> **Role:** Research & Analytics Module  
> **Architecture Principle:** *Raw Data → Analytics Engine (Deterministic Math) → Scientific Visualizations → AI Explanation Layer (Zero Numerical Hallucination)*

---

## 🎯 Purpose & Scope

The **Research & Analytics Module** provides meteorological intelligence, historical baseline normalization, long-term climate trajectory calculations, extreme event analytics, spatial anomaly mapping, and forecast verification for the WeatherGPT platform.

All numerical statistics are calculated by the **Node.js TypeScript Analytics Engine** and backed by **Open-Meteo ERA5 Reanalysis / IMD Climatological Reference Baselines**. The AI / LLM is only utilized for natural-language query parsing and narrative explanation—**never for calculating numbers**.

---

## 🚀 Core Features

| Feature | Key Capabilities |
| :--- | :--- |
| **📊 Overview** | Top KPI cards (Mean, Max, Anomaly %, Extreme count), 15-year historical trendline, automated scientific insights. |
| **📈 Historical Explorer** | Time-series explorer with daily/weekly/monthly/yearly aggregations, 7d/30d/90d rolling averages, percentile distribution ($P_{25}, P_{50}, P_{75}, P_{90}, P_{95}$), and CSV export. |
| **📉 Climate Trends** | Ordinary Least Squares (OLS) linear regression ($y = mx + c$), annual slope rate, 4-season climatological partitioning. |
| **🔥 Anomaly Engine** | Climatological baseline normalization vs observed values, Anomaly $\Delta$, Percentage Anomaly %, Z-Score, and Severity Badges (`EXTREME ANOMALY`, `HIGH ANOMALY`, `NORMAL`, `DEFICIT`). |
| **🗺️ Spatial Anomaly Map** | Regional anomaly & rainfall distribution across Indian meteorological zones (Pune, Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Ahmedabad, Shimla, etc.). |
| **⚖️ Location Comparison** | Side-by-side comparative analysis (e.g. Pune vs Mumbai) with synchronized dual time series, differential matrix, and extreme count variance. |
| **🌪️ Extreme Event Analytics** | Filterable table of threshold-exceeding events based on official IMD/WMO criteria (Heavy Rainfall $>64.5$ mm/24h, Severe Heatwave $T_{max} \ge 40^\circ\text{C}$, Gale Winds $>55$ km/h). |
| **⏪ Historical Event Replay** | Interactive time scrubber and synchronized multi-metric charts for historic deluges and cyclones (2005 Mumbai Cloudburst, 2019 Pune Floods, Cyclone Biparjoy, 2022 Heatwave). |
| **🧭 Climate Fingerprint** | Multi-variable profile: Monsoon share %, annual diurnal temperature range, coefficient of variation (CV %), and Koppen climate classification proxy. |
| **🎯 Forecast Accuracy** | NWP Lead-Day Verification Engine computing **MAE**, **RMSE**, **Forecast Bias**, and **Hit Rate %** against ground-truth observations. |
| **🔬 Natural Language Research Query** | Converts questions like *"Compare monsoon rainfall in Pune and Mumbai from 2015 to 2024"* into structured parameters, delegates math to backend, and generates evidence-backed charts. |
| **🛡️ Data Provenance** | Reusable lineage inspector displaying data provider, dataset, coordinates, observation count, and calculation methodology. |

---

## 📡 REST API Reference

All endpoints return structured JSON with attached `provenance` metadata.

* `GET /api/analytics/historical?location=Pune&start_date=2020-01-01&end_date=2024-12-31&metric=rainfall&aggregation=monthly`
* `GET /api/analytics/trends?location=Pune&start_date=2015-01-01&end_date=2024-12-31&metric=rainfall`
* `GET /api/analytics/anomaly?location=Mumbai&start_date=2023-06-01&end_date=2023-09-30&metric=rainfall`
* `GET /api/analytics/compare?location=Pune&comparison_location=Mumbai&start_date=2020-01-01&end_date=2024-12-31&metric=rainfall`
* `GET /api/analytics/extremes?location=Delhi&start_date=2020-01-01&end_date=2024-12-31`
* `GET /api/analytics/climate-profile?location=Pune`
* `GET /api/analytics/forecast-accuracy?location=Delhi&metric=temperature&days=14`
* `GET /api/analytics/event-replay?event_id=mumbai-2005-deluge`
* `POST /api/analytics/query` (Body: `{ "query": "Compare monsoon rainfall in Pune and Mumbai from 2015 to 2024" }`)
* `GET /api/analytics/metadata`

---

## 🛠️ How to Run

### 1. Run Backend (Port 5000)
```bash
cd backend
npm install
npm run dev
```

### 2. Run Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

### 3. Run Backend Numerical Tests
```bash
cd backend
npm test
```

---

## 🤖 Chatbot & Module Integration (How WeatherGPT Consumes This)

Other WeatherGPT modules (Chatbot, Alert System, GIS) can consume this module via lightweight REST calls:

```typescript
// Example: Chatbot asking if today's rainfall in Mumbai is abnormal
const anomalyRes = await fetch('http://localhost:5000/api/analytics/anomaly?location=Mumbai&start_date=2024-07-15&end_date=2024-07-15&metric=rainfall');
const data = await anomalyRes.json();

console.log(data.explanation);
// Output: "Rainfall observation (118.0 mm) is +68.6% above the historical climatological baseline (70.0 mm) for Mumbai..."
```
