import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// Generic trip status — decoupled from any one domain's status enum so both
// school food distribution (DistribusiRute) and raw-material shipments from a
// Mitra supplier (PermintaanBahan) can drive the same map: 'idle' (not yet
// moving), 'moving' (in transit — animates), 'arrived', 'problem' (stalled).
export type RouteTripStatus = 'idle' | 'moving' | 'arrived' | 'problem';

export interface RouteMapViewProps {
  originLat: number;
  originLng: number;
  originLabel: string;
  destLat: number;
  destLng: number;
  destLabel: string;
  status: RouteTripStatus;
  height?: number;
  originGlyph?: string;
  destGlyph?: string;
  vehicleGlyph?: string;
  problemGlyph?: string;
  colors: {
    primary: string;
    surface: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    danger: string;
    border: string;
  };
}

// Simulated live-tracking map (Shopee/Google-Maps style): OpenStreetMap tiles via
// Leaflet, real road route from the public OSRM demo router, a vehicle icon
// that glides continuously along that route (small position ticks + a CSS
// transform transition so there's no visible jump between them, like a
// loading bar filling), and a bottom progress bar synced to the same tick
// rate — all inside one self-contained WebView HTML string (same pattern as
// CctvMonitorScreen's player).
const TICK_MS = 600;

export default function RouteMapView({
  originLat,
  originLng,
  originLabel,
  destLat,
  destLng,
  destLabel,
  status,
  height = 220,
  originGlyph = '🍳',
  destGlyph = '🏫',
  vehicleGlyph = '🚚',
  problemGlyph = '⚠️',
  colors,
}: RouteMapViewProps) {
  // Memoized so unrelated re-renders elsewhere in the app (e.g. the 4s
  // production-counter tick in AppContext) don't hand the WebView a new
  // source object — that would reload the page and restart the trip
  // animation from scratch instead of letting it run to arrival.
  const html = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin:0; padding:0; width:100%; height:100%; background:${colors.surface}; font-family: sans-serif; }
    #hud { position:absolute; left:0; right:0; bottom:0; background:${colors.surface}; padding:8px 10px 10px; box-shadow:0 -2px 8px rgba(0,0,0,0.15); z-index:1000; }
    #hud-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
    #hud-icon { display:flex; align-items:center; }
    #hud-text { flex:1; color:${colors.text}; font-size:12px; font-weight:700; }
    #hud-eta { color:${colors.textMuted}; font-size:10px; }
    #bar-track { height:5px; border-radius:3px; background:${colors.border}; overflow:hidden; }
    #bar-fill { height:100%; width:0%; background:${colors.primary}; transition:width ${TICK_MS}ms linear; }
    .leaflet-control-attribution { font-size:8px !important; }
    .leaflet-marker-icon { transition: transform ${TICK_MS}ms linear; }
    .pin-badge { display:flex; align-items:center; justify-content:center; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 5px rgba(0,0,0,0.4); }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="hud">
    <div id="hud-row">
      <span id="hud-icon" style="font-size:16px">${vehicleGlyph}</span>
      <span id="hud-text">Memuat rute...</span>
    </div>
    <div id="bar-track"><div id="bar-fill"></div></div>
    <div id="hud-eta"></div>
  </div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var origin = [${originLat}, ${originLng}];
    var dest = [${destLat}, ${destLng}];
    var status = ${JSON.stringify(status)};
    var destLabel = ${JSON.stringify(destLabel)};
    var originLabel = ${JSON.stringify(originLabel)};

    // Focus on the delivery icon itself (not a wide fit of both endpoints) —
    // starts centered on the vehicle's current position; each status branch
    // below re-centers once the real position is known, and the moving-trip
    // branch keeps panning to follow the icon as it steps along the route.
    var map = L.map('map', { zoomControl:false, attributionControl:true }).setView(origin, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map);

    function makeIcon(glyph, bgColor, size) {
      var html = '<div class="pin-badge" style="width:' + size + 'px;height:' + size + 'px;background:' + bgColor + ';font-size:' + Math.round(size*0.55) + 'px">' + glyph + '</div>';
      return L.divIcon({ html: html, className:'', iconSize:[size,size], iconAnchor:[size/2, size/2] });
    }

    var glyphOrigin = ${JSON.stringify(originGlyph)};
    var glyphDest = ${JSON.stringify(destGlyph)};
    var glyphVehicle = ${JSON.stringify(vehicleGlyph)};
    var glyphProblem = ${JSON.stringify(problemGlyph)};

    L.marker(origin, { icon: makeIcon(glyphOrigin, '${colors.textMuted}', 32) }).addTo(map).bindTooltip(originLabel);
    L.marker(dest, { icon: makeIcon(glyphDest, '${colors.primary}', 36) }).addTo(map).bindTooltip(destLabel);

    var vehicleIconGlyph = status === 'problem' ? glyphProblem : glyphVehicle;
    var vehicleColor = status === 'problem' ? '${colors.danger}' : '${colors.primary}';
    var vehicleMarker = L.marker(origin, { icon: makeIcon(vehicleIconGlyph, vehicleColor, 36) }).addTo(map);

    var hudText = document.getElementById('hud-text');
    var hudEta = document.getElementById('hud-eta');
    var barFill = document.getElementById('bar-fill');

    function haversineKm(a, b) {
      var R = 6371, dLat = (b[0]-a[0]) * Math.PI/180, dLng = (b[1]-a[1]) * Math.PI/180;
      var la1 = a[0]*Math.PI/180, la2 = b[0]*Math.PI/180;
      var h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
    }

    function setProgress(frac, distanceKm, remainMin) {
      barFill.style.width = Math.round(frac*100) + '%';
      hudEta.textContent = distanceKm.toFixed(1) + ' km • ETA ' + Math.max(0, Math.round(remainMin)) + ' menit';
    }

    function runWithPath(latlngs, distanceKm, durationMin) {
      L.polyline(latlngs, { color: '#2563eb', weight:4, opacity:0.85 }).addTo(map);

      if (status === 'idle') {
        map.setView(origin, 16);
        hudText.textContent = 'Menunggu keberangkatan → ' + destLabel;
        setProgress(0, distanceKm, durationMin);
        return;
      }
      if (status === 'arrived') {
        vehicleMarker.setLatLng(dest);
        map.setView(dest, 16);
        hudText.textContent = 'Tiba di ' + destLabel;
        setProgress(1, distanceKm, 0);
        return;
      }
      if (status === 'problem') {
        var idx = Math.floor(latlngs.length * 0.45);
        vehicleMarker.setLatLng(latlngs[idx]);
        map.setView(latlngs[idx], 16);
        hudText.textContent = 'Kendala di perjalanan → ' + destLabel;
        setProgress(0.45, distanceKm, durationMin * 0.55);
        return;
      }

      // moving — step the vehicle icon along the road route every few
      // small, frequent ticks + the CSS transform transition on the marker
      // (see .leaflet-marker-icon above) turn every tick into a smooth glide
      // instead of a jump — a single one-way trip from origin to destination.
      // It parks at the destination and stops once it arrives — it does NOT
      // loop back to origin; the status only changes to "arrived" when a
      // petugas manually advances it.
      hudText.textContent = 'Menuju ' + destLabel;
      map.setView(origin, 16);
      // Simulated trip duration scales with the real ETA (1 real minute = 6
      // simulated seconds) so a quick 18-menit school hop plays noticeably
      // faster than an hours-long cross-province bahan-baku run — clamped so
      // it never feels instant or drags past a couple of minutes on screen.
      var TRIP_MS = Math.max(30000, Math.min(120000, durationMin * 6000));
      var TICK_MS = ${TICK_MS};
      var start = Date.now();
      function tick() {
        var frac = Math.min(1, (Date.now() - start) / TRIP_MS);
        var pos = frac * (latlngs.length - 1);
        var i = Math.floor(pos), t = pos - i;
        var a = latlngs[i], b = latlngs[Math.min(i+1, latlngs.length-1)];
        var vehiclePos = [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t];
        vehicleMarker.setLatLng(vehiclePos);
        map.panTo(vehiclePos, { animate: true, duration: TICK_MS / 1000 });
        setProgress(frac, distanceKm, durationMin * (1 - frac));
        if (frac >= 1) {
          clearInterval(timer);
          hudText.textContent = 'Sampai di ' + destLabel + ' — menunggu konfirmasi petugas';
        }
      }
      tick();
      var timer = setInterval(tick, TICK_MS);
    }

    fetch('https://router.project-osrm.org/route/v1/driving/' + origin[1] + ',' + origin[0] + ';' + dest[1] + ',' + dest[0] + '?overview=full&geometries=geojson')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var route = data.routes && data.routes[0];
        if (!route) throw new Error('no route');
        var latlngs = route.geometry.coordinates.map(function(c) { return [c[1], c[0]]; });
        runWithPath(latlngs, route.distance / 1000, route.duration / 60);
      })
      .catch(function() {
        // Offline/CORS fallback — straight line, speed assumed 30 km/h.
        var distanceKm = haversineKm(origin, dest);
        runWithPath([origin, dest], distanceKm, (distanceKm / 30) * 60);
      });
  </script>
</body>
</html>`,
    [originLat, originLng, originLabel, destLat, destLng, destLabel, status, colors, originGlyph, destGlyph, vehicleGlyph, problemGlyph],
  );

  const source = useMemo(() => ({ html }), [html]);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView source={source} style={styles.webview} originWhitelist={['*']} javaScriptEnabled />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
