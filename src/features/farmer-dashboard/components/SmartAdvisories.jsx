import React from 'react';

const advisories = [
  {
    id: 1,
    title: {
      en: "1. Power & Motor Timing (Bijli / Pump Schedule)",
      hi: "1. बिजली और मोटर टाइमिंग (पंप शेड्यूल)",
      mr: "1. वीज आणि मोटर वेळ (पंप वेळापत्रक)"
    },
    points: {
      en: [
        "Three-phase agri-power availability: 10:00 PM - 6:00 AM",
        "Expected rainfall: Heavy rain at 3:00 AM",
        "Action: \"Do not run motor tonight. Rain will fulfill watering needs; save diesel/power.\""
      ],
      hi: [
        "थ्री-फेज कृषि बिजली: रात 10:00 - सुबह 6:00",
        "अपेक्षित वर्षा: सुबह 3:00 बजे भारी बारिश",
        "कार्रवाई: \"आज रात मोटर न चलाएं। बारिश से सिंचाई हो जाएगी; डीजल/बिजली बचाएं।\""
      ],
      mr: [
        "थ्री-फेज कृषी वीज: रात्री 10:00 - सकाळी 6:00",
        "अपेक्षित पाऊस: पहाटे 3:00 वाजता मुसळधार पाऊस",
        "कृती: \"आज रात्री मोटर चालवू नका. पावसाने पाण्याची गरज पूर्ण होईल; डिझेल/वीज वाचवा.\""
      ]
    },
    impact: {
      en: "Saves ₹500–₹1,500 per acre on diesel pump runs and prevents waterlogging root rot.",
      hi: "डीजल पंप पर प्रति एकड़ ₹500-₹1,500 बचाता है और जड़ों को सड़ने से रोकता है।",
      mr: "डिझेल पंपावर प्रति एकर ₹500-₹1,500 वाचवते आणि मुळे कुजण्यापासून प्रतिबंधित करते."
    }
  },
  {
    id: 2,
    title: {
      en: "2. Chemical Washout Risk (Dawaai Chhidkaav)",
      hi: "2. केमिकल वाशआउट जोखिम (दवाई छिड़काव)",
      mr: "2. रासायनिक धुऊन जाण्याचा धोका (फवारणी)"
    },
    points: {
      en: [
        "Next rain window: Within 4 hours",
        "Wind speed: 19 km/h (High drift risk)",
        "Verdict: \"दवा का छिड़काव रोकें (Stop Spraying)\"",
        "Safe window: Friday after 9:00 AM"
      ],
      hi: [
        "अगली बारिश: 4 घंटे के भीतर",
        "हवा की गति: 19 किमी/घंटा (बहाव का उच्च जोखिम)",
        "निर्णय: \"दवा का छिड़काव रोकें (Stop Spraying)\"",
        "सुरक्षित समय: शुक्रवार सुबह 9:00 बजे के बाद"
      ],
      mr: [
        "पुढील पाऊस: 4 तासांच्या आत",
        "वाऱ्याचा वेग: 19 किमी/तास (वाहून जाण्याचा उच्च धोका)",
        "निर्णय: \"औषध फवारणी थांबवा (Stop Spraying)\"",
        "सुरक्षित वेळ: शुक्रवार सकाळी 9:00 नंतर"
      ]
    },
    impact: {
      en: "A systemic pesticide spray costs ₹1,200–₹2,500/acre. Spraying before a downpour washes the chemical into the ground, wasting the entire investment.",
      hi: "एक कीटनाशक स्प्रे की कीमत ₹1,200–₹2,500/एकड़ होती है। बारिश से पहले छिड़काव करने से रसायन जमीन में बह जाता है, जिससे पूरा निवेश बर्बाद हो जाता है।",
      mr: "प्रणालीगत कीटकनाशक फवारणीसाठी ₹1,200-₹2,500/एकर खर्च येतो. पावसापूर्वी फवारणी केल्याने रसायन जमिनीत वाहून जाते, संपूर्ण गुंतवणूक वाया जाते."
    }
  },
  {
    id: 3,
    title: {
      en: "3. Mandi & Harvest Protection",
      hi: "3. मंडी और फसल सुरक्षा",
      mr: "3. बाजार समिती आणि पीक संरक्षण"
    },
    points: {
      en: [
        "Open-air Mandi yard alert: Nashik APMC - Rain expected at 4 PM",
        "Transport alert: Cover trolleys with tarpaulin (तिरपाल)",
        "Moisture cut risk: Damp grain/cotton faces a 10–20% price deduction by traders."
      ],
      hi: [
        "खुली मंडी अलर्ट: नासिक APMC - शाम 4 बजे बारिश की संभावना",
        "परिवहन अलर्ट: ट्रॉलियों को तिरपाल से ढकें",
        "नमी जोखिम: नम अनाज/कपास पर व्यापारी 10-20% की कीमत में कटौती करते हैं।"
      ],
      mr: [
        "खुल्या बाजार समितीचा इशारा: नाशिक APMC - दुपारी 4 वाजता पावसाची शक्यता",
        "वाहतूक इशारा: ट्रॉली ताडपत्रीने (तिरपाल) झाकून ठेवा",
        "ओलाव्याचा धोका: ओलसर धान्य/कापसाला व्यापाऱ्यांकडून 10-20% भाव कमी मिळतो."
      ]
    },
    impact: {
      en: "Prevents harvested produce from getting soaked at the market yard or during transit.",
      hi: "कटी हुई फसल को बाजार या रास्ते में भीगने से बचाता है।",
      mr: "काढणी केलेले पीक बाजारात किंवा प्रवासात भिजण्यापासून वाचवते."
    }
  },
  {
    id: 4,
    title: {
      en: "4. IMD Yellow/Orange Alert (Block-Level)",
      hi: "4. IMD येलो/ऑरेंज अलर्ट (ब्लॉक स्तर)",
      mr: "4. IMD पिवळा/नारंगी इशारा (तालुका स्तर)"
    },
    points: {
      en: [
        "Formal IMD Warning badge: Orange Alert (Thunderstorm & Gusty Winds)",
        "Local Taluka/Block level, not just broad district level."
      ],
      hi: [
        "IMD चेतावनी बैज: ऑरेंज अलर्ट (आंधी और तेज हवाएं)",
        "स्थानीय तालुका/ब्लॉक स्तर, केवल जिला स्तर नहीं।"
      ],
      mr: [
        "IMD चेतावणी बॅज: नारंगी इशारा (वादळ आणि सोसाट्याचा वारा)",
        "स्थानिक तालुका पातळीवर, केवळ जिल्हा पातळीवर नाही."
      ]
    },
    impact: {
      en: "Warns against lodging risk in tall standing crops (sugarcane, maize, banana stem breakage).",
      hi: "खड़ी फसलों (गन्ना, मक्का, केले के तने टूटने) के गिरने के जोखिम की चेतावनी देता है।",
      mr: "उभ्या पिकांच्या (ऊस, मका, केळीचे खोड मोडणे) कोसळण्याच्या धोक्याचा इशारा देते."
    }
  },
  {
    id: 5,
    title: {
      en: "5. Pest Attack Trigger (Khit/Rog Chetwani)",
      hi: "5. कीट हमला ट्रिगर (कीट/रोग चेतावनी)",
      mr: "5. कीड प्रादुर्भाव ट्रिगर (कीट/रोग चेतावणी)"
    },
    points: {
      en: [
        "Trigger: Relative Humidity > 80% for 3 continuous days",
        "Target Pest: Bollworm / Leaf curl in Cotton (or Downy Mildew in Grapes for Nashik)",
        "Recommended action: Preventative bio-spray or drain standing water."
      ],
      hi: [
        "ट्रिगर: लगातार 3 दिनों तक सापेक्ष आर्द्रता > 80%",
        "लक्षित कीट: कपास में बॉलवर्म / लीफ कर्ल (या नासिक में अंगूर में डाउनी मिल्ड्यू)",
        "अनुशंसित कार्रवाई: निवारक बायो-स्प्रे या खड़े पानी को निकालें।"
      ],
      mr: [
        "ट्रिगर: सलग 3 दिवस सापेक्ष आर्द्रता > 80%",
        "लक्षित कीड: कापसामध्ये बोंडअळी / लीफ कर्ल (किंवा नाशिकसाठी द्राक्षांमध्ये डाउनी मिल्ड्यू)",
        "शिफारस केलेली कृती: प्रतिबंधात्मक बायो-स्प्रे किंवा साचलेले पाणी काढून टाका."
      ]
    },
    impact: {
      en: "Moves advisory from abstract weather data to concrete pest defense tied directly to their active crop stage.",
      hi: "सलाह को केवल मौसम डेटा से हटाकर सीधे उनकी सक्रिय फसल की स्थिति से जुड़े ठोस कीट बचाव में बदलता है।",
      mr: "सल्ला केवळ हवामान डेटावरून थेट त्यांच्या सक्रिय पिकाच्या अवस्थेशी जोडलेल्या ठोस कीड संरक्षणाकडे हलवतो."
    }
  }
];

export function SmartAdvisories({ language }) {
  const lang = language || 'en';
  
  return (
    <section className="smart-advisories">
      <div className="advisories-header">
        <h2>
          {lang === 'hi' ? 'स्मार्ट कृषि सलाह' : lang === 'mr' ? 'स्मार्ट कृषी सल्ला' : 'Smart Farm Advisories'}
        </h2>
        <p>
          {lang === 'hi' ? 'आपकी फसल और मौसम के आधार पर अनुकूलित अनुशंसाएं' 
          : lang === 'mr' ? 'आपले पीक आणि हवामानावर आधारित सानुकूलित शिफारसी' 
          : 'Customized recommendations based on your crop and weather'}
        </p>
      </div>
      
      <div className="advisories-list">
        {advisories.map((advisory) => (
          <div key={advisory.id} className="advisory-card">
            <h3 className="advisory-title">{advisory.title[lang]}</h3>
            <div className="advisory-content">
              <ul className="advisory-points">
                {advisory.points[lang].map((point, idx) => (
                  <li key={idx}>• {point}</li>
                ))}
              </ul>
              <div className="advisory-impact">
                <span className="impact-icon">💡</span>
                <p>{advisory.impact[lang]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
