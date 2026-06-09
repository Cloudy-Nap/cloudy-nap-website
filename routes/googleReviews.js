const express = require('express');

const router = express.Router();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const PLACE_QUERY =
  process.env.GOOGLE_PLACE_QUERY || 'Diamond Supreme Foam CLOUDYNAP Karachi';
const DEFAULT_LAT = 24.8864581;
const DEFAULT_LNG = 67.0665792;
const DEFAULT_MAPS_URL =
  process.env.GOOGLE_MAPS_URL ||
  'https://www.google.com/maps/place/Diamond+Supreme+Foam+(CLOUDYNAP)/@24.8864581,67.0691541,17z/data=!3m1!4b1!4m6!3m5!1s0x3eb33f005c988d77:0xd0dcddb87f515bd6!8m2!3d24.8864581!4d67.0665792';

const CACHE_MS = 60 * 60 * 1000;
let cache = { data: null, expiresAt: 0 };

async function findPlaceId() {
  if (PLACE_ID) return PLACE_ID;

  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.set('input', PLACE_QUERY);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'place_id');
  url.searchParams.set('locationbias', `circle:3000@${DEFAULT_LAT},${DEFAULT_LNG}`);
  url.searchParams.set('key', API_KEY);

  const response = await fetch(url.toString());
  const payload = await response.json();

  if (payload.status !== 'OK' || !payload.candidates?.[0]?.place_id) {
    throw new Error(payload.error_message || 'Could not find business on Google Maps');
  }

  return payload.candidates[0].place_id;
}

async function fetchGoogleReviews() {
  const placeId = await findPlaceId();

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,rating,reviews,user_ratings_total,url');
  url.searchParams.set('key', API_KEY);

  const response = await fetch(url.toString());
  const payload = await response.json();

  if (payload.status !== 'OK' || !payload.result) {
    throw new Error(payload.error_message || payload.status || 'Failed to load Google reviews');
  }

  const { result } = payload;

  return {
    businessName: result.name || 'Cloudy Nap',
    rating: result.rating ?? null,
    totalReviews: result.user_ratings_total ?? 0,
    googleUrl: result.url || DEFAULT_MAPS_URL,
    reviews: (result.reviews || []).map((review) => ({
      author: review.author_name || 'Google user',
      rating: review.rating || 0,
      text: review.text || '',
      relativeTime: review.relative_time_description || '',
      profilePhotoUrl: review.profile_photo_url || '',
    })),
  };
}

router.get('/', async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({
      configured: false,
      error: 'Google Places API key is not configured',
      googleUrl: DEFAULT_MAPS_URL,
      reviews: [],
    });
  }

  try {
    const now = Date.now();
    if (cache.data && cache.expiresAt > now) {
      return res.json({ ...cache.data, cached: true });
    }

    const data = await fetchGoogleReviews();
    const responseBody = { configured: true, ...data, cached: false };

    cache = {
      data: responseBody,
      expiresAt: now + CACHE_MS,
    };

    res.json(responseBody);
  } catch (error) {
    console.error('Google reviews fetch error:', error);
    res.status(502).json({
      configured: true,
      error: error.message || 'Failed to load Google reviews',
      googleUrl: DEFAULT_MAPS_URL,
      reviews: [],
    });
  }
});

module.exports = router;
