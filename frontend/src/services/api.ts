export type HealthResponse = {
  success: boolean
  message: string
  database: 'connected' | 'disconnected'
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch('/api/health')

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }

  return response.json() as Promise<HealthResponse>
}