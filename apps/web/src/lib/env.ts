export function showDevPanels() {
  return process.env.NEXT_PUBLIC_SHOW_DEV_PANELS === "true";
}

export function getPublicApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
}

export function getPublicAppConfig() {
  return {
    apiBaseUrl: getPublicApiBaseUrl(),
    showDevPanels: showDevPanels(),
  };
}
