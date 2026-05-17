import { useCallback, useEffect, useRef, useState } from "react";

const OB_PORTS = [40074, 40075, 40076, 40080, 40000, 7777];
const SUBNETS = [
  "192.168.1", "192.168.0", "192.168.2",
  "10.0.0", "10.0.1", "172.16.0",
];

export type ScanResult = { ip: string; port: number; name: string };

async function probe(ip: string, port: number): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 700);
    try {
      await fetch(`http://${ip}:${port}/api/v1`, { signal: ctrl.signal, mode: "no-cors" });
      return true;
    } finally {
      clearTimeout(t);
    }
  } catch {
    return false;
  }
}

export function useNetworkScanner(active: boolean) {
  const [found, setFound] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const runningRef = useRef(false);

  const runScan = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setScanning(true);
    const batch: { ip: string; port: number }[] = [];
    for (const subnet of SUBNETS) {
      for (let i = 1; i <= 254; i++) {
        for (const port of OB_PORTS) batch.push({ ip: `${subnet}.${i}`, port });
      }
    }
    const chunkSize = 30;
    for (let c = 0; c < batch.length; c += chunkSize) {
      if (!runningRef.current) break;
      const chunk = batch.slice(c, c + chunkSize);
      const results = await Promise.all(
        chunk.map(async ({ ip, port }) => ((await probe(ip, port)) ? { ip, port } : null)),
      );
      const hits = results.filter(Boolean) as { ip: string; port: number }[];
      if (hits.length) {
        setFound((prev) => {
          const next = [...prev];
          for (const h of hits) {
            if (!next.some((x) => x.ip === h.ip && x.port === h.port)) {
              next.push({ ip: h.ip, port: h.port, name: `Quest @ ${h.ip}:${h.port}` });
            }
          }
          return next;
        });
      }
    }
    setScanning(false);
    setLastScan(new Date());
    runningRef.current = false;
  }, []);

  useEffect(() => {
    if (!active) {
      runningRef.current = false;
      return;
    }
    runScan();
    const id = setInterval(runScan, 5000);
    return () => {
      clearInterval(id);
      runningRef.current = false;
    };
  }, [active, runScan]);

  return { found, scanning, lastScan, runScan };
}

export { OB_PORTS, SUBNETS };
