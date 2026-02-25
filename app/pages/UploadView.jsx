import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  MenuItem,
  InputLabel,
  Select,
  FormControl,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Stack,
  CircularProgress,
  useTheme
} from '@mui/material';
import { CloudUpload, LocationOn, Send, CheckCircle, Image as ImageIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { apiFetch } from '../../lib/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const priorities = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

function LocationSelector({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    }
  });

  if (!position) return null;

  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: e => {
          setPosition(e.target.getLatLng());
        }
      }}
    />
  );
}

export default function UploadView() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pageBackground = isDark
    ? 'linear-gradient(180deg, #0f172a 0%, #111827 40%, #0f172a 100%)'
    : 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 35%, #f8fafc 100%)';
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'other',
    photo: null, 
  });
  const [markerPosition, setMarkerPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([13.0481, 80.2214]);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [debugPayload, setDebugPayload] = useState(null);
  const [locationFromExif, setLocationFromExif] = useState(false);
  const [map, setMap] = useState(null);

  const steps = ['Issue Details', 'Location & Photo', 'Review & Submit'];

  const categories = [
    { value: 'garbage', label: 'Garbage' },
    { value: 'pothole', label: 'Pothole' },
    { value: 'streetlight', label: 'Streetlight' },
    { value: 'drainage', label: 'Drainage' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setMapCenter([coords.latitude, coords.longitude]);
          setMarkerPosition({ lat: coords.latitude, lng: coords.longitude });
        },
        () => {}
      );
    }
  }, []);

  const handleChange = e => {
    const { name, value, files } = e.target;

    if (name === 'photo') {
      const file = files && files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({ ...prev, photo: reader.result })); 

          window.EXIF.getData(file, function() {
            const lat = window.EXIF.getTag(this, "GPSLatitude");
            const lon = window.EXIF.getTag(this, "GPSLongitude");
            const latRef = window.EXIF.getTag(this, "GPSLatitudeRef");
            const lonRef = window.EXIF.getTag(this, "GPSLongitudeRef");

            if (lat && lon && latRef && lonRef) {
              let decimalLat = lat[0] + (lat[1] / 60) + (lat[2] / 3600);
              if (latRef === "S") {
                decimalLat = -decimalLat;
              }

              let decimalLon = lon[0] + (lon[1] / 60) + (lon[2] / 3600);
              if (lonRef === "W") {
                decimalLon = -decimalLon;
              }

              setMarkerPosition({ lat: decimalLat, lng: decimalLon });
              if (map) {
                map.flyTo([decimalLat, decimalLon], 15);
              }
              setLocationFromExif(true);
            }
          });
        };
        reader.readAsDataURL(file);
      } else {
        setFormData(prev => ({ ...prev, photo: null }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!formData.title || formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters long.');
      return;
    }
    if (!formData.description) {
      setError('Description must be at least 5 characters long.');
      return;
    }
    if (!formData.category || formData.category.trim().length < 2) {
      setError('Please select a category.');
      return;
    }
    if (!formData.photo) {
      setError('Please upload a photo.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        photo: formData.photo, 
      };

      if (markerPosition) {
        payload.lat = markerPosition.lat;
        payload.lng = markerPosition.lng;
      }

      setDebugPayload(payload);

      const response = await apiFetch('/api/issues', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (_) {
          if (errorBody) errorMessage = errorBody;
        }
        throw new Error(errorMessage);
      }

      setSuccess(true);
      setTimeout(() => {
        setFormData({ title: '', description: '', priority: 'medium', category: 'other', photo: null });
        setMarkerPosition(null);
        setActiveStep(0);
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to report issue');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedStep1 = formData.title.trim().length >= 3 && formData.description && formData.priority;
  const canProceedStep2 = formData.photo !== null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent', background: pageBackground }}>
      <PageHeader
        title="Report Issue"
        summary={{ 
          titleText: 'Help us improve Chennai', 
          subText: 'Report civic issues and help make our city better' 
        }}
      />

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mt: 4, pb: 6 }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            maxWidth: 900, 
            mx: 'auto',
            border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e5e7eb'}`,
            borderRadius: 3
          }}
        >
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {success ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CheckCircle sx={{ fontSize: 80, color: '#10b981', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Issue Reported Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thank you for helping improve our community
              </Typography>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              {debugPayload && (
                <Alert severity="info" sx={{ mb: 2, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  Debug payload: {JSON.stringify({ ...debugPayload, photo: debugPayload.photo ? '[base64 data]' : null }, null, 2)}
                </Alert>
              )}

              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Describe the Issue</Typography>
                  <TextField
                    fullWidth required label="Issue Title" name="title" value={formData.title}
                    onChange={handleChange} margin="normal" placeholder="e.g., Pothole on Main Street"
                  />
                  <TextField
                    fullWidth required label="Description" name="description" multiline rows={5} value={formData.description}
                    onChange={handleChange} margin="normal" placeholder="Provide details about the issue..."
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="priority-label">Priority Level</InputLabel>
                    <Select labelId="priority-label" label="Priority Level" name="priority" value={formData.priority} onChange={handleChange}>
                      {priorities.map(p => (
                        <MenuItem key={p.value} value={p.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
                            {p.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select labelId="category-label" label="Category" name="category" value={formData.category} onChange={handleChange}>
                      {categories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" onClick={() => setActiveStep(1)} disabled={!canProceedStep1} sx={{ px: 4 }}>Next</Button>
                  </Box>
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Add Location & Photo</Typography>
                  <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <ImageIcon sx={{ color: '#667eea' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Option 1: Upload Photo</Typography>
                    </Stack>
                    <Button variant="outlined" component="label" startIcon={<CloudUpload />} fullWidth sx={{ mb: 1 }}>
                      {formData.photo ? 'Change Photo' : 'Choose Photo'}
                      <input type="file" name="photo" hidden onChange={handleChange} accept="image/*" />
                    </Button>
                    {formData.photo && (
                      <Box sx={{ mt: 2 }}>
                        <img src={formData.photo} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
                        <Button size="small" onClick={() => setFormData(prev => ({ ...prev, photo: null }))} sx={{ mt: 1 }}>Remove Photo</Button>
                      </Box>
                    )}
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <LocationOn sx={{ color: '#ef4444' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Option 2: Select Location</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Click on the map to set location, or drag the marker</Typography>
                    {locationFromExif && <Alert severity="success" sx={{ mb: 2 }}>Location automatically detected from image.</Alert>}
                    <Box sx={{ height: 350, borderRadius: 2, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} whenCreated={setMap}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors"/>
                        <LocationSelector position={markerPosition} setPosition={setMarkerPosition}/>
                      </MapContainer>
                    </Box>
                  </Paper>
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="outlined" onClick={() => setActiveStep(0)} sx={{ px: 4 }}>Back</Button>
                    <Button variant="contained" onClick={() => setActiveStep(2)} disabled={!canProceedStep2} sx={{ px: 4 }}>Next</Button>
                  </Box>
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Review Your Submission</Typography>
                  <Stack spacing={2}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Issue Title</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{formData.title}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Description</Typography>
                      <Typography variant="body2">{formData.description}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Priority</Typography>
                      <Chip label={priorities.find(p => p.value === formData.priority)?.label} sx={{
                        bgcolor: priorities.find(p => p.value === formData.priority)?.color + '20',
                        color: priorities.find(p => p.value === formData.priority)?.color,
                        fontWeight: 600,
                      }}/>
                    </Paper>
                    {formData.photo && (
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Photo Preview</Typography>
                        <Box sx={{ width: '100%', height: 200, borderRadius: 2, overflow: 'hidden' }}>
                          <img src={formData.photo} alt="Issue" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                      </Paper>
                    )}
                    {markerPosition && (
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Location Selected</Typography>
                        <Chip icon={<LocationOn />} label={`${markerPosition.lat.toFixed(6)}, ${markerPosition.lng.toFixed(6)}`} color="error" variant="outlined"/>
                      </Paper>
                    )}
                  </Stack>
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="outlined" onClick={() => setActiveStep(1)} disabled={submitting} sx={{ px: 4 }}>Back</Button>
                    <Button variant="contained" type="submit" disabled={submitting} startIcon={submitting ? <CircularProgress size={20}/> : <Send/>} sx={{ px: 4 }}>
                      {submitting ? 'Submitting...' : 'Submit Issue'}
                    </Button>
                  </Box>
                </Box>
              )}
            </form>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
