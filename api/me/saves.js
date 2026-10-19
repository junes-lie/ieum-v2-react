import { savedObjectsRequest, savedObjectsErrorResponse } from '../../server/savedObjectStore.js'

const handle = async request => {
  try { return await savedObjectsRequest(request) }
  catch (error) { return savedObjectsErrorResponse(error) }
}
export const GET = handle
export const PUT = handle
export function POST() {
  return Response.json({ error: { code:'METHOD_NOT_ALLOWED' } }, {
    status:405, headers: { Allow:'GET, PUT', 'Cache-Control':'private, no-store', Vary:'Authorization' }
  })
}
