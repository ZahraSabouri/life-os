import {useEffect,useRef,useState} from 'react'
import {exercisePictures} from '../../lib/exercisePictures.js'

function Frames({pictures,large=false}) {
  if(large&&pictures.frames.length===1)return <div className="gym-picture-frames is-pair is-diagram-large">{[0,1].map(i=><div key={i}><img src={pictures.frames[0].src} alt={`${i?'Movement':'Set up'} view. ${pictures.frames[0].alt}`} style={i?{transform:'translateX(-50%)'}:undefined}/></div>)}</div>
  return <div className={`gym-picture-frames${pictures.frames.length>1?' is-pair':''}`}>
    {pictures.frames.map((f,i)=><div key={f.src}><img src={f.src} alt={f.alt} loading={large?'eager':'lazy'} decoding="async"/>{pictures.frames.length>1?<span>{i+1} · {i?'Movement':'Set up'}</span>:null}</div>)}
  </div>
}
function PictureDialog({name,pictures,onClose}) {
  const dialog=useRef(null)
  useEffect(()=>{dialog.current.showModal();return()=>dialog.current?.close()},[])
  return <dialog ref={dialog} className="gym-picture-dialog" aria-labelledby="gym-picture-title" onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <header><h2 id="gym-picture-title">{name}</h2><button type="button" autoFocus onClick={onClose} aria-label="Close pictures">Close ×</button></header>
    <Frames pictures={pictures} large/>
    {pictures.alternative?<section><h3>Easier option: heel tap</h3><Frames pictures={{frames:[pictures.alternative]}} large/></section>:null}
    {pictures.note?<p>{pictures.note}</p>:null}
    <p className="gym-picture-credit">{pictures.credit} · <a href={pictures.reference} target="_blank" rel="noreferrer">{pictures.credit.startsWith('Free')?'Photo source and licence':'Movement reference'}</a></p>
  </dialog>
}
export default function ExercisePictures({name}) {
  const pictures=exercisePictures(name),[open,setOpen]=useState(false)
  if(!pictures)return null
  return <figure className="gym-pictures">
    <button type="button" className="gym-picture-open" aria-label={`Enlarge pictures for ${name}`} onClick={()=>setOpen(true)}><Frames pictures={pictures}/><span className="gym-picture-enlarge">Enlarge pictures ↗{pictures.alternative?' · easier option':''}</span></button>
    {open?<PictureDialog name={name} pictures={pictures} onClose={()=>setOpen(false)}/>:null}
  </figure>
}
