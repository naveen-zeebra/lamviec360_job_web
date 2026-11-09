import { apiRequest } from './client.js';

/**
 * Fetch active promotional banners by placement surface.
 * @param {string} placement - 'LANDING_HERO' | 'LANDING_FEATURED' | 'EMPLOYER_DASHBOARD'
 */
export async function fetchActiveBanners(placement = 'LANDING_HERO') {
  try {
    const res = await apiRequest('/banners/active', {
      method: 'GET',
      params: { placement },
    });
    return res?.data || [];
  } catch (err) {
    console.warn('Failed to fetch active banners:', err?.message || err);
    return [];
  }
}

/**
 * Record a click on a promotional banner.
 * @param {number} bannerId
 */
export async function trackBannerClick(bannerId) {
  if (!bannerId) return;
  try {
    await apiRequest(`/banners/${bannerId}/click`, {
      method: 'POST',
    });
  } catch (err) {
    // Silent fail for telemetry
    console.warn('Failed to track banner click:', err?.message || err);
  }
}

