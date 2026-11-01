const trayPositionsKey = "smartfarm-admin-tray-positions";

export function readTrayPositions(): Record<string, string> {
  try { return JSON.parse(window.localStorage.getItem(trayPositionsKey) ?? "{}"); }
  catch { return {}; }
}

export function rememberTrayPosition(code: string, value: string | null) {
  const positions = readTrayPositions();
  const key = code.trim().toUpperCase();
  if (value) positions[key] = value;
  else delete positions[key];
  window.localStorage.setItem(trayPositionsKey, JSON.stringify(positions));
}
