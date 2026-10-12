import {projectDiscoveryRequest} from '../server/projectDiscovery.js'
import {catalogReadErrorResponse} from '../server/catalogRead.js'
export const GET=async request=>{
  try{return await projectDiscoveryRequest(request)}catch(error){return catalogReadErrorResponse(error)}
}
