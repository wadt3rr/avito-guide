const developmentApiUrl = 'http://localhost:8081'
const developmentWidgetUrl = 'http://localhost:8082/widget.js'

export class ApiConfigurationError extends Error {
  constructor() {
    super('VITE_API_URL is required in production.')
    this.name = 'ApiConfigurationError'
  }
}

function configuredUrl(value: string | undefined) {
  return value?.trim().replace(/\/$/, '') || null
}

export function getApiOrigin() {
  const configured = configuredUrl(import.meta.env.VITE_API_URL)
  if (configured) return configured
  if (import.meta.env.DEV) return developmentApiUrl
  throw new ApiConfigurationError()
}

export function getWidgetPreviewUrl() {
  const configured = configuredUrl(import.meta.env.VITE_WIDGET_URL)
  if (configured) return configured
  return import.meta.env.DEV ? developmentWidgetUrl : null
}
