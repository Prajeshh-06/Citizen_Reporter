// Helper to convert DMS (degrees, minutes, seconds) to decimal
function parseDMS(dms, ref) {
  if (Array.isArray(dms) && dms.length === 3) {
    let decimal = dms[0] + dms[1] / 60 + dms[2] / 3600;
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }
    return decimal;
  }
  return null;
}

export function getExifData(file) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    
    reader.onerror = () => {
      console.error('Error reading file for EXIF data');
      resolve(null);
    };
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        
        // Dynamically import exif-parser for client-side use
        const ExifParser = (await import('exif-parser')).default;
        const parser = ExifParser.create(arrayBuffer);
        const result = parser.parse();
        
        if (result.tags && result.tags.GPSLatitude && result.tags.GPSLongitude) {
          const lat = result.tags.GPSLatitude;
          const lng = result.tags.GPSLongitude;
          
          console.log('Raw GPS data:', { lat, lng });
          
          // exif-parser returns decimal degrees directly
          if (typeof lat === 'number' && typeof lng === 'number') {
            resolve({ lat, lng });
          } else {
            resolve(null);
          }
        } else {
          console.log('No GPS tags found in EXIF data');
          resolve(null);
        }
      } catch (error) {
        console.error('Error parsing EXIF data:', error);
        resolve(null);
      }
    };
    
    reader.readAsArrayBuffer(file);
  });
}