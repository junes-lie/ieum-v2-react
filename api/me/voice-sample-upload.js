import { profileSampleUploadRequest,profileSampleUploadErrorResponse } from '../../server/profileSampleUpload.js'
const handle=async request=>{
  try{return await profileSampleUploadRequest(request)}
  catch(error){return profileSampleUploadErrorResponse(error)}
}
export const POST=handle
