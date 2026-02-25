
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const geojsonPath = path.join(process.cwd(), 'data', 'gcc-divisions-latest.geojson');
  try {
    const fileContents = await fs.readFile(geojsonPath, 'utf8');
    const geojson = JSON.parse(fileContents);
    return new Response(JSON.stringify(geojson), {
      headers: {
        'Content-Type': 'application/geo+json',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to read geojson file:', error);
    return new Response(JSON.stringify({ error: 'Failed to load GeoJSON data' }), { status: 500 });
  }
}
