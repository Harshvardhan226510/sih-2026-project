import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WeatherContext = createContext();

// Haversine distance formula to calculate km between coordinates
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const INITIAL_ALERTS = [
  {
    id: 'sachet-1',
    title: 'River Bagmati High Flood Warning',
    severity: 'RED',
    severityLabel: 'Critical Danger',
    category: 'flood',
    categoryLabel: 'Flash Flood',
    region: 'Muzaffarpur & Sitamarhi, Bihar',
    lat: 26.12,
    lon: 85.39,
    radiusKm: 65,
    issuer: 'SACHET / Central Water Commission (CWC)',
    description: 'River Bagmati at Benibad is flowing 1.8 meters above danger mark with rapid discharge. Embankment breach risk in 14 village panchayats.',
    simpleSummary: 'Severe river flooding. Water is rising fast above safe embankments.',
    safetyDos: [
      'Move immediately to designated flood shelters or elevated pucca buildings',
      'Store 3 days of clean drinking water, dry food, and essential medicines',
      'Keep torch, power bank, and important documents in waterproof bags'
    ],
    safetyDonts: [
      'Do NOT attempt to cross flowing water on foot or in vehicles',
      'Do NOT touch fallen electrical poles or submerged wire fixtures',
      'Do NOT allow children to play near drainage canals or riverbanks'
    ],
    helpline: 'Disaster Emergency: 1070 | NDRF: 112',
    timestamp: 'Active Now',
    issuedAt: 'Today, 06:30 AM',
    expiresAt: 'Tomorrow, 08:00 PM',
    affectedPopulation: '~240,000 residents'
  },
  {
    id: 'sachet-2',
    title: 'Extremely Heavy Rain & Landslide Alert',
    severity: 'RED',
    severityLabel: 'Critical Danger',
    category: 'heavy-rain',
    categoryLabel: 'Heavy Rain & Landslide',
    region: 'Dehradun, Rishikesh & Tehri, Uttarakhand',
    lat: 30.31,
    lon: 78.03,
    radiusKm: 55,
    issuer: 'IMD / NDMA',
    description: 'Cloudburst conditions and localized rainfall exceeding 200mm in 24 hrs. High probability of hill slope landslides along NH-58 and NH-72.',
    simpleSummary: 'Dangerous heavy rainfall with landslide hazards on mountain roads.',
    safetyDos: [
      'Postpone all non-essential hill travel and pilgrimage routes',
      'Stay away from steep natural slopes and river valleys',
      'Monitor district emergency radio and local police bulletins'
    ],
    safetyDonts: [
      'Do NOT drive on mountain passes during active downpours',
      'Do NOT stay in vulnerable mud houses near natural drainage channels'
    ],
    helpline: 'State Disaster Ops: 1070 | Police: 112',
    timestamp: 'Next 12 Hours',
    issuedAt: 'Today, 08:00 AM',
    expiresAt: 'Today, 11:59 PM',
    affectedPopulation: '~180,000 residents'
  },
  {
    id: 'sachet-3',
    title: 'Severe Thunderstorm & Cloud-to-Ground Lightning',
    severity: 'ORANGE',
    severityLabel: 'High Alert',
    category: 'thunderstorm',
    categoryLabel: 'Thunderstorm & Lightning',
    region: 'Lucknow, Pilibhit, Unnao & Barabanki, UP',
    lat: 26.84,
    lon: 80.94,
    radiusKm: 45,
    issuer: 'IMD / SACHET',
    description: 'Squall line with surface wind gusts up to 60 km/h and intense lightning strikes over open fields and urban pockets.',
    simpleSummary: 'Violent thunderstorms with frequent lightning strikes and strong winds.',
    safetyDos: [
      'Immediately take shelter inside a sturdy enclosed building',
      'Unplug sensitive electronic devices and appliances',
      'Farmers should immediately suspend open field harvesting activities'
    ],
    safetyDonts: [
      'Do NOT take shelter under tall isolated trees or tin sheds',
      'Do NOT use metal umbrellas or operate open tractors in the rain'
    ],
    helpline: 'Emergency: 112',
    timestamp: 'Active Now',
    issuedAt: 'Today, 09:15 AM',
    expiresAt: 'Today, 04:30 PM',
    affectedPopulation: '~520,000 residents'
  },
  {
    id: 'sachet-4',
    title: 'Heavy Rainfall & Low-Lying Inundation',
    severity: 'ORANGE',
    severityLabel: 'High Alert',
    category: 'rain',
    categoryLabel: 'Continuous Heavy Rain',
    region: 'Fatehpur, Jhansi & Banda, Bundelkhand, UP',
    lat: 25.92,
    lon: 80.80,
    radiusKm: 50,
    issuer: 'IMD / SACHET',
    description: 'Widespread moderate to heavy rain spells causing water accumulation in agricultural fields and low-lying railway underpasses.',
    simpleSummary: 'Heavy continuous rain leading to waterlogging on roads and fields.',
    safetyDos: [
      'Clear drainage paths around your home and agricultural bunds',
      'Use alternate elevated road routes to avoid waterlogged underpasses'
    ],
    safetyDonts: [
      'Do NOT drive through flooded roads where water depth is unknown'
    ],
    helpline: 'Civic Control Room: 1916',
    timestamp: 'Next 24 Hours',
    issuedAt: 'Today, 07:00 AM',
    expiresAt: 'Tomorrow, 07:00 AM',
    affectedPopulation: '~150,000 residents'
  },
  {
    id: 'sachet-5',
    title: 'Squally Winds & Localized Showers',
    severity: 'YELLOW',
    severityLabel: 'Be Watchful',
    category: 'rain',
    categoryLabel: 'Moderate Rain & Wind',
    region: 'South Tripura & Gomati, Tripura',
    lat: 23.50,
    lon: 91.50,
    radiusKm: 35,
    issuer: 'SACHET / IMD Agartala',
    description: 'Light to moderate rain with localized squalls reaching 35-45 km/h. Minor disruption to weak bamboo structures.',
    simpleSummary: 'Windy weather with rainy spells. Stay updated on forecasts.',
    safetyDos: [
      'Secure loose rooftop objects, tin sheets, and plastic hoardings',
      'Carry umbrellas and rain protection while commuting'
    ],
    safetyDonts: [
      'Do NOT stand under precarious billboards or weak trees'
    ],
    helpline: 'State Helpline: 1070',
    timestamp: 'Active Now',
    issuedAt: 'Today, 09:45 AM',
    expiresAt: 'Today, 06:00 PM',
    affectedPopulation: '~90,000 residents'
  },
  {
    id: 'sachet-6',
    title: 'Severe Lightning & Thunder Activity',
    severity: 'ORANGE',
    severityLabel: 'High Alert',
    category: 'thunderstorm',
    categoryLabel: 'Thunderstorm',
    region: 'Surat, Navsari & Vadodara, Gujarat',
    lat: 21.17,
    lon: 72.83,
    radiusKm: 40,
    issuer: 'IMD / GSDMA',
    description: 'Convective storm cloud development with frequent cloud-to-ground lightning flashes and short intense rain bursts.',
    simpleSummary: 'Sudden thunderstorm with dangerous lightning. Avoid open grounds.',
    safetyDos: [
      'Stay indoors until the thunderstorm passes completely',
      'Keep livestock sheltered under safe pucca sheds'
    ],
    safetyDonts: [
      'Never take refuge under mobile towers or electric poles'
    ],
    helpline: 'Gujarat Disaster Helpline: 1070',
    timestamp: 'Next 18 Hours',
    issuedAt: 'Today, 10:00 AM',
    expiresAt: 'Tomorrow, 04:00 AM',
    affectedPopulation: '~410,000 residents'
  },
  {
    id: 'sachet-7',
    title: 'Extremely Heavy Monsoon Downpour',
    severity: 'RED',
    severityLabel: 'Critical Danger',
    category: 'heavy-rain',
    categoryLabel: 'Urban Deluge Warning',
    region: 'Coastal Maharashtra, Mumbai & Thane',
    lat: 19.07,
    lon: 72.87,
    radiusKm: 60,
    issuer: 'IMD / MCGM Disaster Cell',
    description: 'Intense monsoon surge with rainfall rate 40-50mm/hr during high tide. High risk of urban waterlogging and suburban train delays.',
    simpleSummary: 'Critical rainfall warning combined with high tide in coastal areas.',
    safetyDos: [
      'Work from home if possible; avoid stepping out unless essential',
      'Check live traffic and local train alerts before travel',
      'Keep emergency kits ready with basic first aid and water'
    ],
    safetyDonts: [
      'Do NOT visit coastal promenades or beaches during high tide',
      'Do NOT touch exposed street electric boxes'
    ],
    helpline: 'MCGM Disaster Cell: 1916 | NDRF: 112',
    timestamp: 'Active Now',
    issuedAt: 'Today, 05:30 AM',
    expiresAt: 'Today, 11:59 PM',
    affectedPopulation: '~1,200,000 residents'
  },
  {
    id: 'sachet-8',
    title: 'Severe Heatwave & High Temperature',
    severity: 'ORANGE',
    severityLabel: 'High Alert',
    category: 'heatwave',
    categoryLabel: 'Severe Heatwave',
    region: 'Bikaner, Jaisalmer & Barmer, Rajasthan',
    lat: 28.02,
    lon: 73.31,
    radiusKm: 70,
    issuer: 'NDMA / IMD Rajasthan',
    description: 'Daytime surface temperatures climbing to 45-47°C with dry hot desert winds (Loo). Very high risk of heat exhaustion and sunstroke.',
    simpleSummary: 'Dangerous extreme heat and hot winds. High risk of heat stroke.',
    safetyDos: [
      'Drink plenty of water, ORS, lemonade, or buttermilk frequently',
      'Wear lightweight, loose-fitting, light-colored cotton clothing',
      'Keep animals and pets in shaded areas with plenty of water'
    ],
    safetyDonts: [
      'Do NOT step outdoors between 12:00 PM and 4:00 PM',
      'Never leave children or pets inside parked vehicles'
    ],
    helpline: 'Health Helpline: 104 | Ambulance: 108',
    timestamp: 'Next 24 Hours',
    issuedAt: 'Today, 08:30 AM',
    expiresAt: 'Tomorrow, 06:00 PM',
    affectedPopulation: '~290,000 residents'
  },
  {
    id: 'sachet-9',
    title: 'Flash Flood & Cloudburst Watch',
    severity: 'RED',
    severityLabel: 'Critical Danger',
    category: 'flood',
    categoryLabel: 'Flash Flood Watch',
    region: 'Kangra, Mandi & Kullu, Himachal Pradesh',
    lat: 32.10,
    lon: 76.27,
    radiusKm: 50,
    issuer: 'CWC / SDMA HP',
    description: 'Torrential rainfall over upper catchment areas. Rapid rise expected in local mountain rivulets (Khad) with debris flow hazard.',
    simpleSummary: 'Fast-moving flash floods expected in mountain valleys.',
    safetyDos: [
      'Move away from riverbeds and mountain stream banks immediately',
      'Follow instructions from local village pradhans and police',
      'Park vehicles away from landslide-prone hillside shoulders'
    ],
    safetyDonts: [
      'Never attempt river-crossing or selfie-taking near surging streams'
    ],
    helpline: 'State Emergency Ops: 1070 | Police: 112',
    timestamp: 'Next 12 Hours',
    issuedAt: 'Today, 07:45 AM',
    expiresAt: 'Today, 08:00 PM',
    affectedPopulation: '~140,000 residents'
  },
  {
    id: 'sachet-10',
    title: 'Squally Winds & Coastal Gusts',
    severity: 'YELLOW',
    severityLabel: 'Be Watchful',
    category: 'wind',
    categoryLabel: 'Strong Winds',
    region: 'Silvassa & Dadra & Nagar Haveli',
    lat: 20.27,
    lon: 73.01,
    radiusKm: 30,
    issuer: 'IMD / SACHET',
    description: 'Wind speeds 40-50 kmph with intermittent rain showers. Tree branch falls possible on secondary roads.',
    simpleSummary: 'Strong gusty winds with light showers. Drive with care.',
    safetyDos: [
      'Drive slowly and beware of flying debris or falling branches',
      'Check stability of rooftop solar panels and water tanks'
    ],
    safetyDonts: [
      'Do NOT park vehicles under weak or decaying roadside trees'
    ],
    helpline: 'Admin Helpdesk: 1077',
    timestamp: 'Active Now',
    issuedAt: 'Today, 10:15 AM',
    expiresAt: 'Today, 09:00 PM',
    affectedPopulation: '~65,000 residents'
  },
  {
    id: 'sachet-11',
    title: 'Rough Sea & High Wave Advisory',
    severity: 'ORANGE',
    severityLabel: 'High Alert',
    category: 'marine',
    categoryLabel: 'Rough Sea Advisory',
    region: 'Coastal West Bengal, Digha & Sundarbans',
    lat: 21.64,
    lon: 88.27,
    radiusKm: 60,
    issuer: 'INCOIS / SACHET',
    description: 'High swell waves 3.2 to 3.8 meters along the Bay of Bengal coastline. Strong rip currents active near tourist beaches.',
    simpleSummary: 'Dangerous high ocean waves. Fishermen and tourists must stay off water.',
    safetyDos: [
      'Fishermen and trawlers must remain anchored in safe harbours',
      'Coastal villagers should heed high tide alerts and embankment warnings'
    ],
    safetyDonts: [
      'Strictly NO swimming, bathing, or boating in coastal waters'
    ],
    helpline: 'Coast Guard Emergency: 1554',
    timestamp: 'Next 36 Hours',
    issuedAt: 'Today, 06:00 AM',
    expiresAt: 'Tomorrow, 06:00 PM',
    affectedPopulation: '~195,000 residents'
  },
  {
    id: 'sachet-12',
    title: 'Urban Inundation & Traffic Delays',
    severity: 'YELLOW',
    severityLabel: 'Be Watchful',
    category: 'rain',
    categoryLabel: 'Urban Waterlogging',
    region: 'Patna, Hajipur & East Champaran, Bihar',
    lat: 25.59,
    lon: 85.13,
    radiusKm: 35,
    issuer: 'SACHET / IMD Patna',
    description: 'Persistent moderate rain causing shallow water accumulation on major arterial roads and low-lying hospital approaches.',
    simpleSummary: 'Moderate rain with road waterlogging. Plan extra travel time.',
    safetyDos: [
      'Allow extra commute time for city travel',
      'Follow official traffic diversion advisories'
    ],
    safetyDonts: [
      'Avoid driving through uncovered drain manholes or submerged curbs'
    ],
    helpline: 'Patna Civic Helpline: 155304',
    timestamp: 'Active Now',
    issuedAt: 'Today, 09:00 AM',
    expiresAt: 'Today, 07:00 PM',
    affectedPopulation: '~380,000 residents'
  }
];

export const WeatherProvider = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState({
    lat: 20.5937,
    lon: 78.9629,
    name: 'India Overview',
    region: 'National Weather & Hazard Grid',
    country: 'India'
  });

  const [userLiveLocation, setUserLiveLocation] = useState({
    lat: 18.62,
    lon: 73.91,
    name: 'My Location',
    region: 'Pune, Maharashtra',
    country: 'India'
  });
  const [activeWeather, setActiveWeather] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [croppedSpatialContext, setCroppedSpatialContext] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState(INITIAL_ALERTS);
  const [selectedAlertForDetail, setSelectedAlertForDetail] = useState(null);
  const [alertFilterCategory, setAlertFilterCategory] = useState('all'); // all, RED, ORANGE, YELLOW, flood, thunderstorm, heatwave, near-me
  const [latestLiveNotification, setLatestLiveNotification] = useState(null);
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  const clearCroppedSpatialContext = () => {
    setCroppedSpatialContext(null);
  };

  // Trigger simulated live emergency alert broadcast
  const simulateNewAlert = useCallback(() => {
    const simulationPool = [
      {
        id: `live-alert-${Date.now()}`,
        title: 'URGENT: Flash Flood & River Overflow Warning',
        severity: 'RED',
        severityLabel: 'Emergency Broadcast',
        category: 'flood',
        categoryLabel: 'Flash Flood',
        region: userLiveLocation ? `${userLiveLocation.name}, ${userLiveLocation.region}` : 'Godavari Basin, Nashik & Nanded',
        lat: userLiveLocation ? userLiveLocation.lat + 0.05 : 19.99,
        lon: userLiveLocation ? userLiveLocation.lon + 0.05 : 73.78,
        radiusKm: 45,
        issuer: 'NDMA / CWC Real-Time Telemetry',
        description: 'Dam gates opened upstream following intense rainfall. River water levels surging rapidly. Immediate evacuation of low-lying floodplains advised.',
        simpleSummary: 'Water levels rising rapidly due to dam release. Move away from riverbanks!',
        safetyDos: [
          'Move livestock and family members to elevated ground immediately',
          'Follow emergency announcements from district disaster vans'
        ],
        safetyDonts: [
          'Do NOT enter or cross surging river bridges or causeways'
        ],
        helpline: 'Disaster SOS: 112 | 1070',
        timestamp: 'Just Now',
        issuedAt: 'Just Now',
        expiresAt: 'Next 6 Hours',
        affectedPopulation: '~85,000 residents'
      },
      {
        id: `live-alert-${Date.now()}`,
        title: 'Severe Gale & Cyclone Squall Warning',
        severity: 'RED',
        severityLabel: 'Emergency Broadcast',
        category: 'marine',
        categoryLabel: 'Cyclone & High Gale',
        region: 'Coastal Odisha & Jagatsinghpur',
        lat: 20.26,
        lon: 86.17,
        radiusKm: 75,
        issuer: 'IMD Early Warning Center',
        description: 'Intensifying deep depression moving northwestward. Wind gusts 80-90 km/h with heavy squalls along coastal ports.',
        simpleSummary: 'Strong cyclone winds approaching coastal zone. Stay inside safe structures.',
        safetyDos: [
          'Stay indoors in concrete pucca shelters with reinforced windows',
          'Keep mobile phones fully charged and flashlights ready'
        ],
        safetyDonts: [
          'Never go near beach promenades or harbour jetties'
        ],
        helpline: 'Odisha SDMA: 1070 | Coast Guard: 1554',
        timestamp: 'Just Now',
        issuedAt: 'Just Now',
        expiresAt: 'Next 18 Hours',
        affectedPopulation: '~210,000 residents'
      }
    ];

    const randomAlert = simulationPool[Math.floor(Math.random() * simulationPool.length)];
    
    // Add to alerts state at front
    setActiveAlerts((prev) => [randomAlert, ...prev.filter(a => a.id !== randomAlert.id)]);
    setLatestLiveNotification(randomAlert);
    setLastSyncTime(new Date());

    // Auto-select and center map on new alert
    setSelectedAlertForDetail(randomAlert);
    setSelectedLocation({
      lat: randomAlert.lat,
      lon: randomAlert.lon,
      name: randomAlert.title,
      region: randomAlert.region,
      country: 'India'
    });

    // Auto dismiss notification banner after 8 seconds
    setTimeout(() => {
      setLatestLiveNotification((current) => (current?.id === randomAlert.id ? null : current));
    }, 8000);
  }, [userLiveLocation]);

  // Periodic heartbeat update to simulate live real-time sync
  useEffect(() => {
    if (!isLiveSyncActive) return;
    const interval = setInterval(() => {
      setLastSyncTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [isLiveSyncActive]);

  // Geolocation detection
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        let name = 'My Location';
        let region = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;

        try {
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lon.toFixed(2)}&count=1`
          );
          const data = await res.json();
          if (data?.results?.[0]) {
            name = data.results[0].name;
            region = data.results[0].admin1 || data.results[0].country || region;
          }
        } catch {}

        const liveData = { lat, lon, name, region, country: 'India' };
        setUserLiveLocation(liveData);
        setSelectedLocation(liveData);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <WeatherContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
        userLiveLocation,
        setUserLiveLocation,
        activeWeather,
        setActiveWeather,
        activeLanguage,
        setActiveLanguage,
        activeAlerts,
        setActiveAlerts,
        selectedAlertForDetail,
        setSelectedAlertForDetail,
        alertFilterCategory,
        setAlertFilterCategory,
        latestLiveNotification,
        setLatestLiveNotification,
        simulateNewAlert,
        isLiveSyncActive,
        setIsLiveSyncActive,
        lastSyncTime,
        croppedSpatialContext,
        setCroppedSpatialContext,
        clearCroppedSpatialContext
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};

export default WeatherContext;

