// SPDX-License-Identifier: AGPL-3.0-only
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      async function promptUpdate(worker) {
        if (!worker || document.getElementById('pathway-update')) return;
        const banner = document.createElement('aside');
        banner.id = 'pathway-update'; banner.setAttribute('role','status');
        Object.assign(banner.style,{position:'fixed',bottom:'100px',left:'20px',right:'20px',maxWidth:'420px',margin:'auto',zIndex:'99999',padding:'22px',borderRadius:'20px',background:'#1E2339',color:'white',fontFamily:'system-ui',boxShadow:'0 8px 40px #0003'});
        const title=document.createElement('strong'); title.textContent='A new Pathway web build is ready'; banner.append(title);
        try {
          const response=await fetch('/release.json',{cache:'no-store',signal:AbortSignal.timeout(5000)});
          if(!response.ok)throw Error(); const release=await response.json();
          if(typeof release.version!=='string'||!Array.isArray(release.highlights))throw Error();
          title.textContent='Pathway '+release.version+' is ready';
          for(const item of release.highlights.slice(0,5)){const row=document.createElement('p');const symbol=item.icon==='map'?'🗺':item.icon==='shield'?'🛡':'✦';row.textContent=symbol+' '+String(item.text);banner.append(row);}
          if(Array.isArray(release.improvements)&&release.improvements.length){const fixes=document.createElement('p');fixes.textContent='Fixes & Improvements: '+release.improvements.slice(0,3).join('. ');banner.append(fixes);}
        } catch {const missing=document.createElement('p');missing.textContent='Release notes are temporarily unavailable. You can wait and review them before updating.';banner.append(missing);}
        const text=document.createElement('p');text.textContent='Finish any unsaved work before reloading.';
        const button=document.createElement('button');button.textContent='Reload and update';button.style.cssText='padding:12px;border:0;border-radius:12px;background:#6269f5;color:white;cursor:pointer';button.onclick=()=>{navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});worker.postMessage('APPLY_UPDATE');};
        const later=document.createElement('button');later.textContent='Later';later.style.cssText='padding:12px;margin-left:10px;border:0;border-radius:12px;cursor:pointer';later.onclick=()=>banner.remove();banner.append(text,button,later);document.body.append(banner);
      }
      if(registration.waiting)void promptUpdate(registration.waiting);
      registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)void promptUpdate(worker);});});
    }).catch(()=>{});
  });
}
