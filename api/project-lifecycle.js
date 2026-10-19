import { projectLifecycleRequest, projectLifecycleErrorResponse } from '../server/projectLifecycle.js'
const handle=async request=>{
  try { return await projectLifecycleRequest(request) }
  catch (error) { return projectLifecycleErrorResponse(error) }
}
export const GET=handle
export const POST=handle
