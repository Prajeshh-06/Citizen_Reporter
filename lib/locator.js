const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

const divisionsPath = path.join(process.cwd(), 'data', 'gcc-divisions-latest.geojson');
const geojson = JSON.parse(fs.readFileSync(divisionsPath, 'utf8'));
const features = geojson.features || [];

const wardZones = require('../data/ward-zones.json'); 

function locateWard(lat, lng) {
  const point = turf.point([lng, lat]);
  for (const feature of features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      const wardNum = parseInt(feature.properties.Name, 10);
      const wardName = wardZones[wardNum - 1] || null;
      return {
        wardNumber: wardNum,
        wardName: wardName,
        ...feature.properties
      };
    }
  }
  return null;
}

module.exports = { locateWard };

