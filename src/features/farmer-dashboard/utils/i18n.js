export const fallbackPlaces = [
  { id: 'nagpur', label: 'Nagpur, Maharashtra', latitude: 21.1458, longitude: 79.0882 },
  { id: 'nashik', label: 'Nashik, Maharashtra', latitude: 19.9975, longitude: 73.7898 },
  { id: 'pune', label: 'Pune, Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { id: 'mumbai', label: 'Mumbai, Maharashtra', latitude: 19.076, longitude: 72.8777 },
  { id: 'delhi', label: 'New Delhi, Delhi', latitude: 28.6139, longitude: 77.209 }
];

export const copy = {
  en: { welcome: 'Welcome', advisory: 'Farmer Advisory', changeLocation: 'Change farm location', search: 'Search', close: 'Close', addCrop: 'Add a crop', now: 'Do now', why: 'Why this matters', avoid: 'Avoid', rain: 'Rain chance', wind: 'Wind', humidity: 'Humidity', demo: 'Demo mode: weather is live; added crops are local until Supabase is connected.', forecast: 'Tap a day to see its forecast.' },
  hi: { welcome: 'नमस्ते', advisory: 'किसान सलाह', changeLocation: 'खेत का स्थान बदलें', search: 'खोजें', close: 'बंद करें', addCrop: 'फसल जोड़ें', now: 'अभी करें', why: 'यह क्यों ज़रूरी है', avoid: 'इससे बचें', rain: 'बारिश की संभावना', wind: 'हवा', humidity: 'नमी', demo: 'डेमो मोड: मौसम लाइव है; जोड़ी गई फसलें सुपाबेस से जुड़ने तक केवल इस डिवाइस पर रहेंगी।', forecast: 'पूर्वानुमान देखने के लिए दिन चुनें।' },
  mr: { welcome: 'नमस्कार', advisory: 'शेतकरी सल्ला', changeLocation: 'शेताचे ठिकाण बदला', search: 'शोधा', close: 'बंद करा', addCrop: 'पीक जोडा', now: 'आता करा', why: 'हे महत्त्वाचे का आहे', avoid: 'हे टाळा', rain: 'पावसाची शक्यता', wind: 'वारा', humidity: 'आर्द्रता', demo: 'डेमो मोड: हवामान थेट आहे; सुपाबेस जोडले जाईपर्यंत जोडलेली पिके फक्त या डिव्हाइसवर राहतील.', forecast: 'अंदाज पाहण्यासाठी दिवस निवडा.' }
};

export function localAdvice(source, language) {
  if (language === 'en') return source;
  const rain = source?.verdict?.includes('Rain expected');
  if (language === 'hi') {
    return rain
      ? { verdict: 'बारिश की संभावना — छिड़काव रोकें', reason: 'अगले 48 घंटों में बारिश की संभावना है। अभी छिड़काव करने पर दवा पत्तों से धुल सकती है।', action: 'बारिश रुकने के 24 घंटे बाद ही छिड़काव करें।' }
      : { verdict: 'आज खेत का काम सुरक्षित है', reason: 'मौसम में अभी कोई बड़ा जोखिम नहीं दिख रहा है।', action: 'अगले पूर्वानुमान के बाद ही छिड़काव या कटाई करें।' };
  }
  return rain
    ? { verdict: 'पावसाची शक्यता — फवारणी थांबवा', reason: 'पुढील 48 तासांत पाऊस पडण्याची शक्यता आहे. आता फवारणी केल्यास औषध पानांवरून वाहून जाऊ शकते.', action: 'पाऊस थांबल्यानंतर 24 तासांनी फवारणी करा.' }
    : { verdict: 'आज शेतातील काम सुरक्षित आहे', reason: 'सध्या हवामानात मोठा धोका दिसत नाही.', action: 'पुढील अंदाज तपासूनच फवारणी किंवा कापणी करा.' };
}
