const CACHE='ftk-pwa-shell-v11620-v1';
const SHELL=['./','./index.html','./setup.html','./manifest.webmanifest','./icons/icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy))}return r}).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
function actionUrl(data={}){const u=new URL('./index.html',self.registration.scope);u.searchParams.set('ftkAction',data.action||'dashboard');const p=data.payload||{};['client','origin','destination','time','date'].forEach(k=>{if(p[k])u.searchParams.set(k,p[k])});return u.href}
self.addEventListener('push',event=>{
  let data={};try{data=event.data?event.data.json():{}}catch(e){data={body:event.data?.text?.()||''}}
  const title=data.title||'FTK Gestão Pro',action=data.action||'dashboard';
  event.waitUntil(self.registration.showNotification(title,{body:data.body||'Há uma ação do FTK para conferir.',icon:'./icons/icon.svg',tag:data.tag||`ftk-${action}`,renotify:!!data.renotify,data:{action,payload:data.payload||{}},actions:Array.isArray(data.actions)?data.actions.slice(0,2):[]}));
});
self.addEventListener('message',event=>{const m=event.data||{};if(m.type==='SHOW_NOTIFICATION')event.waitUntil(self.registration.showNotification(m.title||'FTK Gestão Pro',{body:m.body||'Abra o FTK para conferir.',icon:'./icons/icon.svg',tag:m.tag||'ftk-local',data:{action:m.action||'dashboard',payload:m.payload||{}}}))});
self.addEventListener('notificationclick',event=>{
  event.notification.close();const data=event.notification.data||{},action=event.action||data.action||'dashboard',payload=data.payload||{},target=actionUrl({action,payload});
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{for(const client of clients){if(new URL(client.url).origin===self.location.origin){try{client.postMessage({type:'FTK_ACTION',action,payload});await client.focus();return}catch(e){}}}return self.clients.openWindow(target)}));
});