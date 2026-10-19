// Auth code/env presence is not proof of a fully connected shared service.
export function GET() {
  return Response.json({
    contractVersion: 'ieum-service-v1', mode: 'preparation',
    sharedProjects: false, authenticated: false, publicResults: false, push: false, aiVoiceLayers: false
  }, { headers: { 'Cache-Control': 'no-store' } })
}

export function POST() {
  return Response.json({ error: { code: 'METHOD_NOT_ALLOWED' } }, { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } })
}
