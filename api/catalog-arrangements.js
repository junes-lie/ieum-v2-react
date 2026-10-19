import {catalogReadRequest,catalogReadErrorResponse} from '../server/catalogRead.js'
export const GET=async request=>{
  try{return await catalogReadRequest(request)}catch(error){return catalogReadErrorResponse(error)}
}
