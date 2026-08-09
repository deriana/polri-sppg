import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';

// require()-ing a local video only plays reliably inside a WebView <video>
// in dev — Metro serves it over http(s), which a WebView can fetch fine. In
// a release/production build the module is bundled as a raw resource and
// Image.resolveAssetSource() hands back an "asset:/..." URI the embedded
// WebView cannot fetch, so the video silently fails to play. Asset.downloadAsync()
// copies the bundled resource into the app's file cache and returns a real
// file:// path a WebView can load, in both dev and release builds.
const cache = new Map<number, Promise<string>>();

export function useLocalVideoUri(moduleId: number): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let promise = cache.get(moduleId);
    if (!promise) {
      promise = Asset.fromModule(moduleId)
        .downloadAsync()
        .then((asset) => asset.localUri ?? asset.uri);
      cache.set(moduleId, promise);
    }
    promise.then((resolved) => {
      if (alive) setUri(resolved);
    });
    return () => {
      alive = false;
    };
  }, [moduleId]);

  return uri;
}
