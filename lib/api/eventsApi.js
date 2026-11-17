import { apiRequest } from './client.js';

/**
 * Fetch active monthly events for the Homepage Events Widget.
 * Calls the dedicated endpoint GET /api/v1/homepage-events/active
 */
export async function fetchActiveHomepageEvents() {
  try {
    const res = await apiRequest('/homepage-events/active', {
      method: 'GET',
    });
    return res?.data || [];
  } catch (err) {
    console.warn('Failed to fetch active homepage events:', err?.message || err);
    return [];
  }
}

/**
 * Record a click on a homepage event when a candidate clicks 'View details ↗'.
 * @param {number} eventId
 */
export async function trackHomepageEventClick(eventId) {
  if (!eventId) return;
  try {
    await apiRequest(`/homepage-events/${eventId}/click`, {
      method: 'POST',
    });
  } catch (err) {
    // Silent fail for telemetry
    console.warn('Failed to track homepage event click:', err?.message || err);
  }
}
