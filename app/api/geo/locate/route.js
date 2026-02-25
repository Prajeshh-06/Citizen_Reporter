
import { locateWard } from '@/lib/locator';

export async function POST(request) {
  try {
    const { lat, lng } = await request.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(JSON.stringify({ error: 'lat and lng must be numbers' }), { status: 400 });
    }

    const ward = locateWard(lat, lng);

    if (!ward) {
      return new Response(JSON.stringify({ error: 'Not found in any ward' }), { status: 404 });
    }

    return new Response(JSON.stringify(ward), { status: 200 });
  } catch (error) {
    console.error('Error locating ward:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
