import { verifyRequestUser, sessionResponse, serviceErrorResponse } from '../../server/auth.js'

export async function GET(request) {
  try { return sessionResponse(await verifyRequestUser(request)) }
  catch (error) { return serviceErrorResponse(error) }
}

export function POST() {
  return Response.json({ error: { code: 'METHOD_NOT_ALLOWED' } }, { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } })
}
