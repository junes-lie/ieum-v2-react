import {voiceSourceRegistrationRequest} from '../../server/voiceSourceRegistration.js'
import {profileSampleUploadErrorResponse} from '../../server/profileSampleUpload.js'
const handle=async request=>{
  try{return await voiceSourceRegistrationRequest(request)}
  catch(error){return profileSampleUploadErrorResponse(error)}
}
export const GET=handle
export const POST=handle
