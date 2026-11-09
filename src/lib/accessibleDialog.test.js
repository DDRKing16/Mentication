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
    ownerDocument:doc,isConnected:true,style:new Proxy({pointerEvents:'',zIndex:''}, { set(target, name, value) { target[name]=value; attrs.set('style',Object.entries(target).filter(([,v])=>v).map(([key,v])=>`${key}: ${v};`).join(' ')); return true; } }),dataset:{},children:[],items:[],tabIndex:0,classList:{contains:()=>false},
    getAttribute(name) { return name==='data-fallback' ? this.dataset.fallback??null : attrs.get(name)??null; },
    setAttribute(name,value) { attrs.set(name,value); if(name==='data-fallback')this.dataset.fallback=value; if(name==='open')this.open=true; },
    removeAttribute(name) { attrs.delete(name); if(name==='data-fallback')delete this.dataset.fallback; if(name==='open')this.open=false; },
    append(child) { child.parentElement=this;this.children.push(child); },
    contains(child) { return child===this || this.children.some(item=>item.contains(child)); },
    querySelectorAll(selector) { return this.items.filter(item=>!item.isSummary||selector.split(',').includes('summary')); },getClientRects() { return [1]; },
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

describe('nested dialog ownership', () => {
  const open = (modal, opener) => openAccessibleDialog(modal.node, modal.layer, { opener, onClose: vi.fn() });
  const native = modal => {
    modal.node.showModal = vi.fn(() => { modal.node.open = true; });
    modal.node.close = vi.fn(() => { modal.node.open = false; });
    return modal;
  };

  it('keeps isolation and scroll locked when the parent cleans up before its child', () => {
    const f = fixture(), one = f.modal(), cleanupOne = open(one, f.opener);
    const two = f.modal(), cleanupTwo = open(two, one.first);
    cleanupOne();
    expect(one.layer.getAttribute('style')).toBeNull();
    expect(f.doc.activeElement).toBe(two.first);
    expect(f.root.getAttribute('inert')).toBe('');
    expect(f.body.style.overflow).toBe('hidden');
    const portal = f.make(); f.body.append(portal); f.observers[0].callback();
    expect(portal.getAttribute('inert')).toBe('');
    cleanupTwo();
    expect(f.root.getAttribute('inert')).toBeNull();
    expect(portal.getAttribute('inert')).toBeNull();
    expect(f.body.style.overflow).toBe('auto');
    expect(f.doc.activeElement).toBe(f.opener);
    expect(f.observers[0].disconnected).toBe(true);
  });

  it('makes repeated cleanup harmless while another modal remains and after reopening', () => {
    const f = fixture(), one = f.modal(), cleanupOne = open(one, f.opener);
    const two = f.modal(), cleanupTwo = open(two, one.first);
    cleanupOne(); cleanupOne();
    f.opener.focus(); expect(f.doc.activeElement).toBe(two.first);
    cleanupTwo();
    const three = f.modal(), cleanupThree = open(three, f.opener);
    cleanupTwo(); cleanupOne();
    expect(f.body.style.overflow).toBe('hidden');
    f.opener.focus(); expect(f.doc.activeElement).toBe(three.first);
    cleanupThree(); expect(f.body.style.overflow).toBe('auto');
  });

  it('restores the outer opener across three out-of-order removals', () => {
    const f = fixture(), one = f.modal(), cleanupOne = open(one, f.opener);
    const two = f.modal(), cleanupTwo = open(two, one.first);
    const three = f.modal(), cleanupThree = open(three, two.first);
    cleanupTwo(); cleanupOne(); cleanupThree();
    expect(f.doc.activeElement).toBe(f.opener);
    expect(f.root.getAttribute('aria-hidden')).toBeNull();
    expect(f.body.style.overflow).toBe('auto');
  });

  it('orders fallback layers by opening order, not persistent portal DOM order', () => {
    const f = fixture(), child = f.modal(), parent = f.modal();
    parent.layer.style.zIndex = '52'; child.layer.style.zIndex = '17';
    const closeParent = open(parent, f.opener), closeChild = open(child, parent.first);
    expect(Number(child.layer.style.zIndex)).toBeGreaterThan(Number(parent.layer.style.zIndex));
    closeChild(); expect(child.layer.style.zIndex).toBe('17');
    closeParent(); expect(parent.layer.style.zIndex).toBe('52');
  });

  it('keeps native dialogs in top tracking and shared scroll-lock ownership', () => {
    const f = fixture(), one = f.modal(), cleanupOne = open(one, f.opener);
    const two = native(f.modal()), cleanupTwo = open(two, one.first);
    two.first.focus();
    expect(f.doc.activeElement).toBe(two.first);
    expect(f.key('Escape').preventDefault).not.toHaveBeenCalled();
    cleanupOne();
    expect(f.body.style.overflow).toBe('hidden');
    cleanupTwo(); cleanupTwo();
    expect(two.node.close).toHaveBeenCalledOnce();
    expect(f.body.style.overflow).toBe('auto');
    expect(f.doc.activeElement).toBe(f.opener);
  });

  it('locks native-only nesting until its last owner cleans up', () => {
    const f = fixture(), one = native(f.modal()), cleanupOne = open(one, f.opener);
    const two = native(f.modal()), cleanupTwo = open(two, one.first);
    expect(f.body.style.overflow).toBe('hidden');
    cleanupOne(); expect(f.body.style.overflow).toBe('hidden');
    cleanupTwo(); expect(f.body.style.overflow).toBe('auto');
  });

  it('demotes native ancestors when a partial native child requires fallback', () => {
    const f = fixture(), one = native(f.modal()), cleanupOne = open(one, f.opener);
    const two = native(f.modal()); two.node.showModal.mockImplementation(() => { throw new Error('unsupported'); });
    const cleanupTwo = open(two, one.first);
    expect(one.node.close).toHaveBeenCalledOnce();
    expect(one.node.open).toBe(true);
    expect(one.layer.dataset.fallback).toBe('true');
    expect(f.doc.activeElement).toBe(two.first);
    cleanupTwo(); expect(f.doc.activeElement).toBe(one.first);
    f.opener.focus(); expect(f.doc.activeElement).toBe(one.first);
    cleanupOne();
    expect(one.node.getAttribute('open')).toBeNull();
    expect(one.layer.dataset.fallback).toBeUndefined();
    expect(f.body.style.overflow).toBe('auto');
  });

  it('restores prior dialog attributes and includes summary in keyboard cycling', () => {
    const f = fixture(), m = f.modal();
    m.first.isSummary = true;
    m.node.setAttribute('tabindex', '3');
    m.layer.setAttribute('data-fallback', 'original');
    const cleanup = open(m, f.opener);
    expect(f.doc.activeElement).toBe(m.first);
    f.key('Tab', true); expect(f.doc.activeElement).toBe(m.last);
    f.key('Tab'); expect(f.doc.activeElement).toBe(m.first);
    cleanup();
    expect(m.node.getAttribute('tabindex')).toBe('3');
    expect(m.layer.getAttribute('data-fallback')).toBe('original');
  });

  it('keeps separate documents independently locked and focused', () => {
    const a = fixture(), b = fixture(), one = a.modal(), two = b.modal();
    const cleanupOne = open(one, a.opener), cleanupTwo = open(two, b.opener);
    a.opener.focus(); expect(a.doc.activeElement).toBe(one.first);
    cleanupOne(); expect(b.body.style.overflow).toBe('hidden');
    b.opener.focus(); expect(b.doc.activeElement).toBe(two.first);
    cleanupTwo(); expect(b.body.style.overflow).toBe('auto');
  });
});

describe('native keyboard wrapping and exact style cleanup', () => {
  it('wraps native Tab and Shift-Tab but leaves Escape to native cancel handling', () => {
    const f = fixture(), m = f.modal(), onClose = vi.fn();
    m.node.showModal = () => { m.node.open = true; };
    m.node.close = () => { m.node.open = false; };
    const cleanup = openAccessibleDialog(m.node, m.layer, { opener: f.opener, onClose });
    m.last.focus();
    expect(f.key('Tab').preventDefault).toHaveBeenCalledOnce();
    expect(f.doc.activeElement).toBe(m.first);
    expect(f.key('Tab', true).preventDefault).toHaveBeenCalledOnce();
    expect(f.doc.activeElement).toBe(m.last);
    const escape = f.key('Escape');
    expect(escape.preventDefault).not.toHaveBeenCalled();
    expect(escape.stopPropagation).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    cleanup();
  });

  it('wraps only the top native dialog and handles a native dialog without controls', () => {
    const f = fixture(), one = f.modal(), two = f.modal();
    for (const m of [one, two]) {
      m.node.showModal = () => { m.node.open = true; };
      m.node.close = () => { m.node.open = false; };
    }
    const cleanupOne = openAccessibleDialog(one.node, one.layer, { opener: f.opener, onClose: vi.fn() });
    const cleanupTwo = openAccessibleDialog(two.node, two.layer, { opener: one.first, onClose: vi.fn() });
    two.last.focus();
    expect(f.key('Tab').preventDefault).toHaveBeenCalledOnce();
    expect(f.doc.activeElement).toBe(two.first);
    two.node.items = [];
    expect(f.key('Tab').preventDefault).toHaveBeenCalledOnce();
    expect(f.doc.activeElement).toBe(two.node);
    cleanupTwo(); cleanupOne();
  });

  it('removes empty style attributes only when they were originally absent', () => {
    const f = fixture(), m = f.modal(), empty = f.make();
    empty.setAttribute('style', ''); f.body.append(empty);
    f.body.style.overflow = ''; f.body.removeAttribute('style');
    const cleanup = openAccessibleDialog(m.node, m.layer, { opener: f.opener, onClose: vi.fn() });
    expect(f.root.getAttribute('style')).not.toBeNull();
    cleanup();
    expect(f.root.getAttribute('style')).toBeNull();
    expect(m.layer.getAttribute('style')).toBeNull();
    expect(f.body.getAttribute('style')).toBeNull();
    expect(empty.getAttribute('style')).toBe('');
  });

  it('retains unrelated inline styles added during isolation', () => {
    const f = fixture(), m = f.modal();
    f.body.style.overflow = ''; f.body.removeAttribute('style');
    const cleanup = openAccessibleDialog(m.node, m.layer, { opener: f.opener, onClose: vi.fn() });
    for (const element of [f.root, f.body, m.layer]) element.style.color = 'red';
    cleanup();
    for (const element of [f.root, f.body, m.layer]) {
      expect(element.style.color).toBe('red');
      expect(element.getAttribute('style')).toContain('color: red');
    }
  });
});
