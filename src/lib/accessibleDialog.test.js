import { describe, expect, it, vi } from 'vitest';
import { openAccessibleDialog } from './accessibleDialog';
function fixture() {
  const listeners = new Map(), observers = [];
  const doc = { activeElement:null,
    addEventListener(type, handler) { if (!listeners.has(type)) listeners.set(type,new Set()); listeners.get(type).add(handler); },
    removeEventListener(type, handler) { listeners.get(type)?.delete(handler); },
    fire(type,event) { for (const handler of [...(listeners.get(type)||[])]) handler(event); },
    defaultView:{ MutationObserver:class { constructor(callback) { this.callback=callback; observers.push(this); } observe() {} disconnect() { this.disconnected=true; } } },
  };
  const make = () => { const attrs=new Map(); return {
    ownerDocument:doc,isConnected:true,style:{pointerEvents:''},dataset:{},children:[],items:[],tabIndex:0,classList:{contains:()=>false},
    getAttribute:name=>attrs.get(name)??null,
    setAttribute(name,value) { attrs.set(name,value); if(name==='open')this.open=true; },
    removeAttribute(name) { attrs.delete(name); if(name==='open')this.open=false; },
    append(child) { child.parentElement=this;this.children.push(child); },
    contains(child) { return child===this || this.children.some(item=>item.contains(child)); },
    querySelectorAll() { return this.items; },getClientRects() { return [1]; },
    closest() { for(let p=this;p;p=p.parentElement)if(p.getAttribute('hidden')!==null||p.getAttribute('inert')!==null||p.getAttribute('aria-hidden')==='true')return p;return null; },
    focus:vi.fn(function(){doc.activeElement=this;doc.fire('focusin',{target:this});}),
  }; };
  const body=make();body.style.overflow='auto';doc.body=body;
  const root=make(),opener=make();body.append(root);root.append(opener);doc.activeElement=opener;
  const modal=()=>{const layer=make();layer.classList.contains=name=>name==='mcn-modal-layer';const node=make(),first=make(),last=make();node.append(first);node.append(last);node.items=[first,last];layer.append(node);body.append(layer);return{layer,node,first,last};};
  const key=(value,shiftKey=false)=>{const event={key:value,shiftKey,preventDefault:vi.fn(),stopPropagation:vi.fn()};doc.fire('keydown',event);return event;};
  return{doc,body,root,opener,make,observers,modal,key};
}
describe('accessible dialog compatibility lifecycle',()=>{
 it('uses native semantics and restores the opener',()=>{const f=fixture(),m=f.modal();m.node.showModal=vi.fn(()=>{m.node.open=true;});m.node.close=vi.fn(()=>{m.node.open=false;});const cleanup=openAccessibleDialog(m.node,m.layer,{opener:f.opener,onClose:vi.fn()});expect(m.node.showModal).toHaveBeenCalledOnce();expect(m.layer.dataset.fallback).toBeUndefined();cleanup();expect(m.node.close).toHaveBeenCalledOnce();expect(f.doc.activeElement).toBe(f.opener);});
 it('opens without showModal and restores prior background state exactly',()=>{const f=fixture(),m=f.modal();f.root.setAttribute('aria-hidden','false');f.root.style.pointerEvents='auto';const cleanup=openAccessibleDialog(m.node,m.layer,{opener:f.opener,onClose:vi.fn()});expect(m.layer.dataset.fallback).toBe('true');expect(m.node.open).toBe(true);expect(f.doc.activeElement).toBe(m.first);expect(f.root.getAttribute('aria-hidden')).toBe('true');expect(f.root.getAttribute('inert')).toBe('');expect(f.root.style.pointerEvents).toBe('none');expect(f.body.style.overflow).toBe('hidden');cleanup();expect(f.root.getAttribute('aria-hidden')).toBe('false');expect(f.root.getAttribute('inert')).toBeNull();expect(f.root.style.pointerEvents).toBe('auto');expect(f.body.style.overflow).toBe('auto');expect(m.node.getAttribute('open')).toBeNull();expect(m.node.getAttribute('tabindex')).toBeNull();expect(f.doc.activeElement).toBe(f.opener);expect(f.observers[0].disconnected).toBe(true);});
 it('contains Tab, Shift-Tab and programmatic focus without inert support',()=>{const f=fixture(),m=f.modal(),cleanup=openAccessibleDialog(m.node,m.layer,{opener:f.opener,onClose:vi.fn()});expect(f.key('Tab',true).preventDefault).toHaveBeenCalled();expect(f.doc.activeElement).toBe(m.last);expect(f.key('Tab').preventDefault).toHaveBeenCalled();expect(f.doc.activeElement).toBe(m.first);f.opener.focus();expect(f.doc.activeElement).toBe(m.first);cleanup();});
 it('closes on Escape and removes listeners on cleanup',()=>{const f=fixture(),m=f.modal(),onClose=vi.fn(),cleanup=openAccessibleDialog(m.node,m.layer,{opener:f.opener,onClose});const event=f.key('Escape');expect(onClose).toHaveBeenCalledOnce();expect(event.preventDefault).toHaveBeenCalled();expect(event.stopPropagation).toHaveBeenCalled();cleanup();f.key('Escape');expect(onClose).toHaveBeenCalledOnce();});
 it('focuses dialog when no tabbable controls exist',()=>{const f=fixture(),m=f.modal();m.node.items=[];const cleanup=openAccessibleDialog(m.node,m.layer,{opener:f.opener,onClose:vi.fn()});expect(f.doc.activeElement).toBe(m.node);expect(f.key('Tab').preventDefault).toHaveBeenCalled();cleanup();});
 it('falls back when a partial native implementation throws',()=>{const f=fixture(),m=f.modal();m.node.showModal=()=>{throw new Error('unsupported');};m.node.close=vi.fn();const cleanup=openAccessibleDialog(m.node,m.layer,{opener:f.opener,onClose:vi.fn()});expect(m.layer.dataset.fallback).toBe('true');cleanup();expect(m.node.close).not.toHaveBeenCalled();});
 it('isolates new portals and preserves hidden sibling attributes',()=>{const f=fixture(),m=f.modal();f.root.setAttribute('aria-hidden','true');f.root.setAttribute('inert','original');const cleanup=openAccessibleDialog(m.node,m.layer,{opener:f.opener,onClose:vi.fn()});const portal=f.make();f.body.append(portal);f.observers[0].callback();expect(portal.getAttribute('aria-hidden')).toBe('true');cleanup();expect(portal.getAttribute('aria-hidden')).toBeNull();expect(f.root.getAttribute('aria-hidden')).toBe('true');expect(f.root.getAttribute('inert')).toBe('original');});
 it('keeps newer modals usable and restores the underlying modal',()=>{const f=fixture(),one=f.modal(),closeOne=vi.fn(),cleanupOne=openAccessibleDialog(one.node,one.layer,{opener:f.opener,onClose:closeOne});const two=f.modal(),closeTwo=vi.fn();f.observers[0].callback();expect(two.layer.getAttribute('inert')).toBeNull();const cleanupTwo=openAccessibleDialog(two.node,two.layer,{opener:one.first,onClose:closeTwo});f.observers[0].callback();expect(two.layer.getAttribute('inert')).toBeNull();expect(one.layer.getAttribute('inert')).toBe('');f.key('Escape');expect(closeTwo).toHaveBeenCalledOnce();expect(closeOne).not.toHaveBeenCalled();cleanupTwo();expect(f.doc.activeElement).toBe(one.first);expect(one.layer.getAttribute('inert')).toBeNull();f.key('Escape');expect(closeOne).toHaveBeenCalledOnce();cleanupOne();});
});
