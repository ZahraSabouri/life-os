import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {exercisePictures,pictureLibrary} from '../src/lib/exercisePictures.js'

test('movement pictures use readable local files and retain sources and accessible descriptions',()=>{
  assert.equal(new Set(pictureLibrary.map(p=>p.key)).size,pictureLibrary.length)
  for(const p of pictureLibrary){
    assert.match(p.reference,/^https:\/\//)
    assert(p.credit)
    for(const frame of [...p.frames,...(p.alternative?[p.alternative]:[])]){
      const url=new URL(frame.src);assert.equal(url.protocol,'file:');assert(fs.statSync(url).size>100);assert(frame.alt.length>30)
      if(url.pathname.endsWith('.svg')){const svg=fs.readFileSync(url,'utf8');assert.match(svg,/<title>/);assert(!/<script|<image|(?:href|src)=["']https?:|onload=/i.test(svg))}
    }
  }
})

test('recognises common movement names and easier variations without inventing a picture for a custom exercise',()=>{
  for(const [name,key]of [['Chair squat / sit-to-stand','chair-squat'],['Dumbbell floor chest press','floor-press'],['Supported one-arm dumbbell row','supported-row'],['Dead bug / heel taps','dead-bug'],['Hip hinge','hip-hinge'],['Wall / high incline push-up','wall-push-up'],['Modified side plank','knee-side-plank'],['Doorway chest stretch','doorway-stretch']])assert.equal(exercisePictures(name)?.key,key)
  assert(exercisePictures('Dead bug').alternative)
  assert.equal(exercisePictures('Custom exercise'),undefined);assert.equal(exercisePictures(null),undefined)
})
