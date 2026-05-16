// Fetch a remote URL as a data URL string so @ffmpeg/ffmpeg's load() accepts it
// in environments where blob: URLs created from cross-origin fetches are blocked.
export async function fetchToU8(url: string, mime: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(new Blob([blob], { type: mime }));
  });
}
