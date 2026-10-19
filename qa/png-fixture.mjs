import {deflateSync} from 'node:zlib'
const crc=bytes=>{let value=0xffffffff;for(const byte of bytes){value^=byte;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0)}return (value^0xffffffff)>>>0}
const chunk=(kind,data)=>{const type=Buffer.from(kind),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);type.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([type,data])),out.length-4);return out}
// A decoded test raster, not an AI image or approved Identity/Flow shape.
export function fixturePng(width=512,height=512){
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6
  const pixels=Buffer.alloc(height*(width*4+1))
  for(let row=0;row<height;row++)for(let column=0;column<width;column++){
    const offset=row*(width*4+1)+1+column*4;pixels[offset]=column%256;pixels[offset+1]=row%256;pixels[offset+2]=96;pixels[offset+3]=255
  }
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))])
}
