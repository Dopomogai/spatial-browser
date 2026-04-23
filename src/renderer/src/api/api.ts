import { supabase } from '../lib/supabase';

const API_BASE_URL = 'https://api.dopomogai.com';

export const syncSpatialEvents = async (events: unknown[], visitorId: string | null) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else if (visitorId) {
    headers['X-Visitor-ID'] = visitorId;
  } else {
    throw new Error('No authentication token or visitor ID available');
  }

  const response = await fetch(`${API_BASE_URL}/spatial/sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ events }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to sync spatial events: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
};

export const transferVisitorOwnership = async (visitorId: string, secureJWT: string) => {
  // Mock API call to transfer ownership of timeline events tagged with visitorId over to user sequence
  console.log(`[MOCK API] Attempting to transfer events from visitor ${visitorId} to authenticated JWT ${secureJWT}`);
  return true;
};
