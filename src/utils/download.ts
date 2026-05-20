import JSZip from "jszip";

const README = `OB Remote — Open Brush Remote Controller
==========================================

HOW TO INSTALL
--------------
iPhone / iPad (Safari):
  1. AirDrop index.html to your device
  2. Open in Safari (not Chrome)
  ⚠️ Safari only on iOS

Android (Chrome):
  1. Move index.html to your device
  2. Open with a file manager → tap index.html → Open with Chrome
  Chrome on Android supports file:// and HTTP local requests

Mac / Windows / Linux:
  Open index.html in any browser

REQUIREMENTS
------------
- Meta Quest with Open Brush installed
- Config file edited:
  /sdcard/Open Brush/Open Brush.cfg
  { "Flags": { "EnableApiRemoteCalls": true, "EnableApiCorsHeaders": true } }
- Quest and device on the same WiFi network

MORE INFO
---------
Docs:    https://docs.openbrush.app/user-guide/open-brush-api
Discord: https://discord.openbrush.app

Created by Matteo Sgherri (@thepixelschips)
In collaboration with Holonexia APS (holonexia.it)
`;

export async function downloadLocalZip(): Promise<void> {
  const response = await fetch(window.location.href);
  const html = await response.text();

  const zip = new JSZip();
  zip.file("index.html", html);
  zip.file("README.txt", README);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ob-remote.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isLocalEnv(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}
