import React, { useEffect, useState } from 'react';
import { takeawayStore } from '../../src/lib/localData.js';
import { nightSetupNote } from './setup.js';
export default function SetupNote({night,channelName}) {
  const [saved,setSaved]=useState(null),[error,setError]=useState('');
  const text=nightSetupNote({channelName,channelId:night.channel,minutes:night.minutes,source:night.source,kind:night.needsFile || night.files[night.channel]?'file':'preview'});
  useEffect(()=>{
    const refresh=()=>{try{setSaved(takeawayStore.list().find(note=>note.id===night.noteId) || null);setError('');}catch{setSaved(null);setError('Your saved setup note could not be read. Nothing has been overwritten.');}};
    refresh();window.addEventListener('storage',refresh);window.addEventListener('mentation:takeaways-changed',refresh);
    return ()=>{window.removeEventListener('storage',refresh);window.removeEventListener('mentation:takeaways-changed',refresh);};
  },[night.noteId]);
  return <details className="night-setup-note"><summary>Keep this setup · optional</summary><p>{text}</p><p>Only Save keeps this note in Return points on this device. Files, song links, accounts and playback positions are not saved in the note.</p><button type="button" disabled={saved?.text===text} onClick={()=>{
    try {const note=takeawayStore.save({id:night.noteId,interventionId:'nightChannel',text});night.setNoteId(note.id);setSaved(note);setError('');}
    catch {setError('This setup note could not be saved. Your controls are still here. Try again.');}
  }}>{saved?'Save updated setup on this device':'Save setup note on this device'}</button>{saved?.text===text && <p role="status">Saved setup note on this device.</p>}{saved && saved.text!==text && <p>These changed controls have not been saved in your note.</p>}{error && <p role="alert">{error}</p>}<a href="/return-points" target="_top">Return points · read or delete saved notes</a></details>;
}
