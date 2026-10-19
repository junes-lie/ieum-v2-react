import { profileRequest, profileErrorResponse } from '../../server/profileStore.js'

const handle = async request => {
  try { return await profileRequest(request) }
  catch (error) { return profileErrorResponse(error) }
}
export const GET = handle
export const PATCH = handle
export function POST() {
  return Response.json({ error: { code: 'METHOD_NOT_ALLOWED' } }, {
    status: 405, headers: { Allow: 'GET, PATCH', 'Cache-Control': 'private, no-store', Vary: 'Authorization' }
  })
}
