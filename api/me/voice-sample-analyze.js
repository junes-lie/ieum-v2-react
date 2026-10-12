import {profileSampleAnalysisRequest} from '../../server/profileSampleAnalysis.js'
import {profileSampleUploadErrorResponse} from '../../server/profileSampleUpload.js'
export async function POST(request){
  try{return await profileSampleAnalysisRequest(request)}
  catch(error){return profileSampleUploadErrorResponse(error)}
}
