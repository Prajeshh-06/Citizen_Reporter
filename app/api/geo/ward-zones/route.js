
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'data', 'ward-zones.json');
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return new Response(fileContents, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to read ward-zones file:', error);
    return new Response(JSON.stringify({ error: 'Failed to load ward-zones data' }), { status: 500 });
  }
}
