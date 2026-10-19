import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {verifyGeneratedPng} from '../server/generatedImageVerification.js'
import {fixturePng} from './png-fixture.mjs'
assert.ok(process.env.IEUM_QA_FFMPEG_PATH,'Existing decoder required; no installation/model')
const options={executable:process.env.IEUM_QA_FFMPEG_PATH},bytes=fixturePng(),blob=new Blob([bytes],{type:'image/png'})
const receipt=await verifyGeneratedPng(blob,options)
assert.equal(receipt.sha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(receipt.decodedBytes,1048576)
assert.deepEqual(await verifyGeneratedPng(blob,options),receipt)
await assert.rejects(verifyGeneratedPng(new Blob([bytes.subarray(0,33)],{type:'image/png'}),options),e=>e.code==='IMAGE_DECODE_FAILED')
await assert.rejects(verifyGeneratedPng(new Blob([fixturePng(256,512)],{type:'image/png'}),options),e=>e.code==='INVALID_GENERATED_IMAGE')
const broken=Buffer.from(bytes);broken[50]^=255
await assert.rejects(verifyGeneratedPng(new Blob([broken],{type:'image/png'}),options),e=>e.code==='IMAGE_DECODE_FAILED')
await assert.rejects(verifyGeneratedPng(blob,{...options,timeoutMs:1}),e=>e.code==='IMAGE_DECODE_TIMEOUT')
assert.equal(process._getActiveHandles().filter(x=>x.constructor?.name==='ChildProcess' && x.exitCode===null && x.signalCode===null).length,0)
console.log('PASS existing actual FFmpeg 512×512 PNG first-frame decode/hash/replay, truncated/corrupt/wrong size/timeout rejection and child release. Test raster, not AI generation or visual approval.')
