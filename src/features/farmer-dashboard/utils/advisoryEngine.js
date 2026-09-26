export function generateAdvisories(data, activeCrop, lang = 'en') {
  if (!data || !data.current || !data.forecast) return null;

  const current = data.current;
  const forecast = data.forecast;
  const cropName = activeCrop ? activeCrop.name.toLowerCase() : null;
  const hasCropContext = !!cropName;

  const rainProb = forecast[0]?.rainProbability || 0;
  const windSpeed = current.windSpeed || 0;
  const maxTemp = forecast[0]?.temperature || 0;
  const humidity = current.humidity || 0;

  const decisionState = {
    primary: null,
    actions: {
      spraying: null,
      heat: null,
      waterlogging: null,
      disease: null,
      harvest: null
    }
  };

  // 1. Spraying Decision
  if (rainProb > 50 || windSpeed > 15) {
    decisionState.actions.spraying = {
      status: "POSTPONE",
      severity: "HIGH",
      reason: rainProb > 50 ? "High rain probability increases chemical washout risk." : "High wind increases spray drift risk.",
      evidence: `Rain: ${rainProb}%, Wind: ${windSpeed} km/h`,
      confidence: "High",
      timing: "Consider tomorrow if conditions improve."
    };
  } else {
    decisionState.actions.spraying = {
      status: "PROCEED",
      severity: "LOW",
      reason: "Favorable conditions for chemical absorption.",
      evidence: `Rain: ${rainProb}%, Wind: ${windSpeed} km/h`,
      confidence: "High",
      timing: "Today"
    };
  }

  // 2. Heat Stress
  if (maxTemp > 35) {
    decisionState.actions.heat = {
      status: "MONITOR",
      severity: "MODERATE",
      reason: "High temperatures can cause wilting.",
      evidence: `Temp: ${maxTemp}°C`,
      confidence: hasCropContext ? "High" : "Medium",
      timing: "Afternoon"
    };
  } else {
    decisionState.actions.heat = {
      status: "NORMAL",
      severity: "LOW",
      reason: "Temperatures are within acceptable ranges.",
      evidence: `Temp: ${maxTemp}°C`,
      confidence: "High",
      timing: ""
    };
  }

  // 3. Waterlogging / Irrigation
  if (rainProb > 80) {
    decisionState.actions.waterlogging = {
      status: "POSTPONE IRRIGATION",
      severity: "HIGH",
      reason: "Heavy rain expected, risk of root rot.",
      evidence: `Rain: ${rainProb}%`,
      confidence: "High",
      timing: "Next 24 hours"
    };
  } else if (maxTemp > 35 && rainProb < 20) {
    decisionState.actions.waterlogging = {
      status: "PROCEED IRRIGATION",
      severity: "MODERATE",
      reason: "High heat and low rain probability.",
      evidence: `Temp: ${maxTemp}°C, Rain: ${rainProb}%`,
      confidence: "High",
      timing: "Today"
    };
  } else {
    decisionState.actions.waterlogging = {
      status: "NORMAL",
      severity: "LOW",
      reason: "No immediate flooding risk.",
      evidence: `Rain: ${rainProb}%`,
      confidence: "High",
      timing: ""
    };
  }

  // 4. Disease Risk
  if (humidity > 80 && maxTemp > 25 && maxTemp < 32) {
    decisionState.actions.disease = {
      status: "CAUTION",
      severity: "MODERATE",
      reason: "Conditions favor fungal growth.",
      evidence: `Humidity: ${humidity}%, Temp: ${maxTemp}°C`,
      confidence: hasCropContext ? "High" : "Medium",
      timing: "Next 48 hours"
    };
  } else {
    decisionState.actions.disease = {
      status: "NORMAL",
      severity: "LOW",
      reason: "Unfavorable environment for common diseases.",
      evidence: `Humidity: ${humidity}%, Temp: ${maxTemp}°C`,
      confidence: "High",
      timing: ""
    };
  }

  // 5. Harvest Risk
  if (activeCrop?.stage === 'Harvest ready') {
    if (rainProb > 40) {
      decisionState.actions.harvest = {
        status: "POSTPONE",
        severity: "HIGH",
        reason: "Rain threatens crop quality.",
        evidence: `Rain: ${rainProb}%`,
        confidence: "High",
        timing: "Until clear"
      };
    } else {
      decisionState.actions.harvest = {
        status: "PROCEED",
        severity: "LOW",
        reason: "Dry conditions optimal for cutting.",
        evidence: `Rain: ${rainProb}%`,
        confidence: "High",
        timing: "Today"
      };
    }
  } else {
     decisionState.actions.harvest = {
        status: "NOT APPLICABLE",
        severity: "LOW",
        reason: "Crop is not ready for harvest.",
        evidence: `Stage: ${activeCrop?.stage || 'Unknown'}`,
        confidence: "High",
        timing: ""
      };
  }

  // Determine Primary Decision
  const allRisks = Object.values(decisionState.actions).filter(a => a && a.severity === 'HIGH');
  if (allRisks.length > 0) {
    decisionState.primary = {
      status: "ATTENTION NEEDED",
      severity: "HIGH",
      reason: allRisks[0].reason,
      evidence: allRisks[0].evidence,
      confidence: allRisks[0].confidence,
      timing: allRisks[0].timing
    };
  } else {
    const moderateRisks = Object.values(decisionState.actions).filter(a => a && a.severity === 'MODERATE');
    if (moderateRisks.length > 0) {
      decisionState.primary = {
        status: "MONITOR CONDITIONS",
        severity: "MODERATE",
        reason: moderateRisks[0].reason,
        evidence: moderateRisks[0].evidence,
        confidence: moderateRisks[0].confidence,
        timing: moderateRisks[0].timing
      };
    } else {
      decisionState.primary = {
        status: "FAVORABLE",
        severity: "LOW",
        reason: "No major weather constraints today.",
        evidence: `Temp: ${maxTemp}°C, Rain: ${rainProb}%`,
        confidence: "High",
        timing: "Today"
      };
    }
  }

  return decisionState;
}
