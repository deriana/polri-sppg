import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface CctvPlayerProps {
  videoUri: string | null;
  label: string;
  height?: number;
}

// Compact inline CCTV feed — same REC/HUD-styled WebView video player as
// CctvMonitorScreen's modal, minus the fullscreen toggle, so it can sit
// embedded directly inside another panel (e.g. Kondisi Gudang). videoUri is
// null while useLocalVideoUri() is still resolving the asset to a real
// file:// path (see src/utils/localVideoAsset.ts for why that step matters).
export default function CctvPlayer({ videoUri, label, height = 200 }: CctvPlayerProps) {
  if (!videoUri) {
    return (
      <View style={[styles.wrap, styles.loading, { height }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body, html { margin:0; padding:0; width:100%; height:100%; background-color:#000; overflow:hidden; font-family: monospace, sans-serif; }
    .container { position:relative; width:100%; height:100%; }
    video { width:100%; height:100%; border:0; object-fit:cover; pointer-events:none; }
    .hud-top-left { position:absolute; top:8px; left:8px; color:#ef4444; font-weight:bold; font-size:10px; display:flex; align-items:center; gap:6px; text-shadow:1px 1px 4px #000; z-index:10; }
    .rec-dot { width:7px; height:7px; background-color:#ef4444; border-radius:50%; animation: blink 1s infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    .hud-bottom-left { position:absolute; bottom:8px; left:8px; max-width:70%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#fff; font-size:10px; font-weight:bold; text-shadow:1px 1px 4px #000; background:rgba(0,0,0,0.6); padding:3px 8px; border-radius:4px; z-index:10; }
  </style>
</head>
<body>
  <div class="container">
    <video src="${videoUri}" autoplay loop playsinline></video>
    <div class="hud-top-left"><div class="rec-dot"></div>● REC LIVE</div>
    <div class="hud-bottom-left">${label.toUpperCase()}</div>
  </div>
</body>
</html>`;

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  webview: { flex: 1 },
  loading: { alignItems: 'center', justifyContent: 'center' },
});
