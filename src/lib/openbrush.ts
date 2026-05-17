export const PORT = 40074;

export type Headset = {
  id: string;
  name: string;
  ip: string;
  port?: number;
  online?: boolean | null; // null = unknown
  demo?: boolean;
  found?: boolean;
};

export const DEMO_HEADSETS: Headset[] = [
  { id: "demo-matteo", name: "Quest Matteo", ip: "192.168.1.42", port: 40074, online: true, demo: true },
  { id: "demo-guest", name: "Quest Guest", ip: "192.168.1.55", port: 40074, online: true, demo: true },
];

export function apiUrl(ip: string, command: string, value?: string | number | boolean, port: number = PORT) {
  const base = `http://${ip}:${port}/api/v1`;
  if (value === undefined) return `${base}?${command}`;
  return `${base}?${command}=${encodeURIComponent(String(value))}`;
}

export function previewUrl(ip: string, port: number = PORT) {
  return `http://${ip}:${port}/cameraview?t=${Date.now()}`;
}

export async function sendCommand(ip: string, command: string, value?: string | number | boolean, timeoutMs = 4000, port: number = PORT): Promise<boolean> {
  const url = apiUrl(ip, command, value, port);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    await fetch(url, { method: "GET", mode: "cors", signal: ctrl.signal });
    return true;
  } catch {
    // With no-cors fallback we can't read the response, but the GET fires.
    try {
      await fetch(url, { method: "GET", mode: "no-cors", signal: ctrl.signal });
      return true;
    } catch {
      return false;
    }
  } finally {
    clearTimeout(t);
  }
}

export async function ping(ip: string, timeoutMs = 3000): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`http://${ip}:${PORT}/api/v1`, { method: "GET", mode: "cors", signal: ctrl.signal });
    return res.ok || res.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchPreviewBlob(ip: string, timeoutMs = 6000): Promise<Blob | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(previewUrl(ip), { method: "GET", mode: "cors", signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export const BRUSHES = [
  "Ink", "Marker", "Light", "Fire", "Snow", "Bubbles", "Stars", "Smoke",
  "Electricity", "Rainbow", "NeonPulse", "Plasma", "Embers", "Petal",
  "Hypercolor", "Velvet Ink", "Oil Paint", "Wet Paint", "Toon",
  "Dots", "Splatter", "Disco", "TaperedFlat", "TaperedMarker",
  "Highlighter", "Charcoal", "Pencil", "DuctTape", "Chromatic Wave",
  "Comet", "Dry Brush", "Wire", "Cellvein", "Lofted",
];

export const ENVIRONMENTS = [
  "Tundra", "Pegasus", "Dreamscape", "Raft", "Snowman",
  "Lava", "Jungle", "Space", "Black", "Bimini",
];

export type MultiplayerConfig = {
  nickname: string;
  roomName: string;
  roomKey: string;
  isPrivate: boolean;
  maxPlayers: number;
  beginner: boolean;
  viewOnly: boolean;
  perHeadsetNick: boolean;
  perHeadsetNicks: Record<string, string>;
};

export function buildMultiplayerJoin(cfg: MultiplayerConfig, headsetId?: string) {
  const nick = cfg.perHeadsetNick && headsetId ? (cfg.perHeadsetNicks[headsetId] || cfg.nickname) : cfg.nickname;
  // multiplayer.join=[nickname],[roomname],[isPrivate],[maxPlayers],[silentRoom],[viewOnlyRoom]
  return `multiplayer.join=${encodeURIComponent(nick)},${encodeURIComponent(cfg.roomName)},${cfg.isPrivate},${cfg.maxPlayers},false,${cfg.viewOnly}`;
}
