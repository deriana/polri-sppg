import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Image, Pressable, Text, Modal as RNModal } from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { BRAND_ASSETS } from '../data/images';

export type RouteTripStatus = 'idle' | 'moving' | 'arrived' | 'problem';
const TICK_MS = 600;

// Marker pin memakai path Feather sebagai inline SVG karena isi pin dirender
// di dalam WebView (Leaflet divIcon), di luar jangkauan komponen <Feather />.
export type RouteMarkerIcon = 'home' | 'school' | 'factory' | 'truck' | 'alert';

const MARKER_PATHS: Record<RouteMarkerIcon, string> = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />',
  school:
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />',
  factory:
    '<path d="M16.5 9.4L7.5 4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />',
  truck:
    '<rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />',
  alert:
    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />',
};

function markerSvg(icon: RouteMarkerIcon, size: number) {
  const px = Math.round(size * 0.52);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${MARKER_PATHS[icon]}</svg>`;
}

export interface RouteMapViewProps {
  originLat: number;
  originLng: number;
  originLabel: string;
  destLat: number;
  destLng: number;
  destLabel: string;
  status: RouteTripStatus;
  height?: number;
  originIcon?: RouteMarkerIcon;
  destIcon?: RouteMarkerIcon;
  vehicleIcon?: RouteMarkerIcon;
  problemIcon?: RouteMarkerIcon;
  colors: {
    primary: string;
    danger: string;
    textMuted: string;
    surface: string;
    border: string;
    text: string;
    success?: string;
  };
}

export default function RouteMapView({
  originLat,
  originLng,
  originLabel,
  destLat,
  destLng,
  destLabel,
  status,
  height = 300,
  originIcon = 'home',
  destIcon = 'school',
  vehicleIcon = 'truck',
  problemIcon = 'alert',
  colors,
}: RouteMapViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Image.resolveAssetSource tidak ada di react-native-web; di web require()
  // sudah menghasilkan URL string, jadi dipakai langsung sebagai fallback.
  const truckImgUri =
    Image.resolveAssetSource?.(BRAND_ASSETS.truckMbg)?.uri ?? (BRAND_ASSETS.truckMbg as unknown as string);

  const html = useMemo(
    () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: ${colors.surface}; font-family: -apple-system, Roboto, sans-serif; }
    .pin-badge { border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #ffffff; }
    #hud { position: absolute; top: 12px; left: 12px; max-width: calc(100% - 210px); z-index: 1000; background: ${colors.surface}; border: 1px solid ${colors.border}; color: ${colors.text}; padding: 10px 14px; border-radius: 16px; font-size: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.18); display: flex; flex-direction: column; gap: 4px; }
    #hud-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    #hud-title { font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; font-size: 11px; color: ${colors.textMuted}; }
    #hud-status { font-weight: 800; color: ${colors.primary}; font-size: 12px; }
    #hud-eta { font-weight: 800; color: ${colors.text}; font-size: 13px; margin-top: 2px; }
    #bar-track { width: 100%; height: 6px; background: ${colors.border}; border-radius: 3px; overflow: hidden; margin-top: 4px; }
    #bar-fill { width: 0%; height: 100%; background: ${colors.primary}; transition: width 0.4s ease; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="hud">
    <div id="hud-row">
      <div id="hud-title">LIVE ROUTE TRACKING</div>
      <div id="hud-status">MENUNGGU SINKRON</div>
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

    var map = L.map('map', { zoomControl:false, attributionControl:true }).setView(origin, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map);

    function makeIcon(markup, bgColor, size, isVehicle) {
      var inner = isVehicle
        ? '<img src="${truckImgUri}" style="width:34px;height:34px;object-fit:contain" />'
        : markup;
      var html = '<div class="pin-badge" style="width:' + size + 'px;height:' + size + 'px;background:' + bgColor + ';box-shadow:0 3px 8px rgba(0,0,0,0.35);border:2px solid #fff;overflow:hidden;display:flex;align-items:center;justify-content:center">' + inner + '</div>';
      return L.divIcon({ html: html, className:'', iconSize:[size,size], iconAnchor:[size/2, size/2] });
    }

    var svgOrigin = ${JSON.stringify(markerSvg(originIcon, 36))};
    var svgDest = ${JSON.stringify(markerSvg(destIcon, 38))};
    var svgVehicle = ${JSON.stringify(markerSvg(vehicleIcon, 44))};
    var svgProblem = ${JSON.stringify(markerSvg(problemIcon, 44))};

    // Origin: Dapur SPPG
    L.marker(origin, { icon: makeIcon(svgOrigin, '${colors.primary}', 36, false) }).addTo(map).bindTooltip('<b>Dapur SPPG:</b> ' + originLabel, { permanent: false, direction: 'top' });

    // Dest: Sekolah Tujuan
    L.marker(dest, { icon: makeIcon(svgDest, '${colors.success ?? "#10b981"}', 38, false) }).addTo(map).bindTooltip('<b>Sekolah Tujuan:</b> ' + destLabel, { permanent: false, direction: 'top' });

    var vehicleIconGlyph = status === 'problem' ? svgProblem : svgVehicle;
    var vehicleColor = status === 'problem' ? '${colors.danger}' : '${colors.primary}';
    var vehicleMarker = L.marker(origin, { icon: makeIcon(vehicleIconGlyph, vehicleColor, 44, true) }).addTo(map);

    var hudText = document.getElementById('hud-status');
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
      // Draw double-cased electric blue navigation route line (Google Maps / Grab style)
      L.polyline(latlngs, { color: '#ffffff', weight: 8, opacity: 0.9 }).addTo(map);
      L.polyline(latlngs, { color: '#2563eb', weight: 5, opacity: 0.95 }).addTo(map);
      if (status === 'problem') {
        hudText.textContent = 'KENDALA RUTE: DIHENTIKAN sementara';
        hudEta.textContent = distanceKm.toFixed(1) + ' km dari tujuan • Bantuan Komando dikirim';
        barFill.style.background = '${colors.danger}';
        barFill.style.width = '40%';
        var mid = latlngs[Math.floor(latlngs.length / 2)] || origin;
        vehicleMarker.setLatLng(mid);
        map.setView(mid, 16);
        return;
      }

      if (status === 'idle') {
        hudText.textContent = 'Menunggu Keberangkatan';
        setProgress(0, distanceKm, durationMin);
        vehicleMarker.setLatLng(origin);
        map.setView(origin, 15);
        return;
      }

      if (status === 'arrived') {
        hudText.textContent = 'Tiba di ' + destLabel;
        setProgress(1, 0, 0);
        vehicleMarker.setLatLng(dest);
        map.setView(dest, 16);
        return;
      }

      var totalSteps = Math.max(1, Math.round((durationMin * 60 * 1000) / ${TICK_MS}));
      var step = 0;

      function tick() {
        step++;
        var frac = Math.min(1, step / totalSteps);
        var idxFloat = frac * (latlngs.length - 1);
        var i1 = Math.floor(idxFloat);
        var i2 = Math.min(latlngs.length - 1, i1 + 1);
        var rem = idxFloat - i1;

        var curLat = latlngs[i1][0] + (latlngs[i2][0] - latlngs[i1][0]) * rem;
        var curLng = latlngs[i1][1] + (latlngs[i2][1] - latlngs[i1][1]) * rem;
        var pos = [curLat, curLng];

        vehicleMarker.setLatLng(pos);
        map.panTo(pos, { animate: true, duration: 0.5 });

        var remainKm = distanceKm * (1 - frac);
        var remainMin = durationMin * (1 - frac);
        setProgress(frac, remainKm, remainMin);

        hudText.textContent = 'Dalam Perjalanan ➔ ' + destLabel;

        if (frac >= 1) {
          clearInterval(timer);
          hudText.textContent = 'Sampai di ' + destLabel + ' — menunggu konfirmasi';
        }
      }
      tick();
      var timer = setInterval(tick, ${TICK_MS});
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
        var distanceKm = haversineKm(origin, dest);
        runWithPath([origin, dest], distanceKm, (distanceKm / 30) * 60);
      });
  </script>
</body>
</html>`,
    [originLat, originLng, originLabel, destLat, destLng, destLabel, status, colors, originIcon, destIcon, vehicleIcon, problemIcon, truckImgUri],
  );

  const source = useMemo(() => ({ html }), [html]);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView source={source} style={styles.webview} originWhitelist={['*']} javaScriptEnabled />

      <Pressable
        onPress={() => setIsFullscreen(true)}
        style={({ pressed }) => [
          styles.fullscreenBtn,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Feather name="maximize" size={14} color={colors.primary} />
        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Landscape Fullscreen</Text>
      </Pressable>

      <RNModal visible={isFullscreen} animationType="fade" onRequestClose={() => setIsFullscreen(false)}>
        <View style={[styles.fullContainer, { backgroundColor: colors.surface }]}>
          <WebView source={source} style={styles.webview} originWhitelist={['*']} javaScriptEnabled />

          <Pressable
            onPress={() => setIsFullscreen(false)}
            style={({ pressed }) => [
              styles.exitFullscreenBtn,
              { backgroundColor: colors.danger },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Feather name="minimize-2" size={16} color="#FFFFFF" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Tutup Landscape</Text>
          </Pressable>
        </View>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  fullscreenBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 10,
  },
  fullContainer: { flex: 1, backgroundColor: '#000', position: 'relative' },
  exitFullscreenBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 9999,
  },
});
