import {personalIdentityRequest,personalIdentityErrorResponse} from '../../server/personalIdentityResults.js'
const handle=async request=>{try{return await personalIdentityRequest(request)}catch(error){return personalIdentityErrorResponse(error)}}
export const GET=handle
export const POST=handle
