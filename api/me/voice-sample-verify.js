import {profileSampleVerificationRequest} from '../../server/profileSampleVerification.js'
import {profileSampleUploadErrorResponse} from '../../server/profileSampleUpload.js'
export async function POST(request){
  try{return await profileSampleVerificationRequest(request)}
  catch(error){return profileSampleUploadErrorResponse(error)}
}
