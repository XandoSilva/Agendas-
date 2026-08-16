var Y=Object.defineProperty,Ae=(e,t)=>{let a={};for(var i in e)Y(a,i,{get:e[i],enumerable:!0});return t||Y(a,Symbol.toStringTag,{value:"Module"}),a};(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function a(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=a(s);fetch(s.href,n)}})();var xe="https://docs.google.com/spreadsheets/d/e/2PACX-1vQW2W-bMXbTD8M-HcIVsXNuodovb-wBPEQ677zxaNMjyYOr3fax9ZkTapHAPukpHfABbwQ_ywiVb1gt/pub?output=csv",C={VISAO_GERAL:{gid:"113587035",name:"📊 Visão Geral",key:"visao_geral"},APOIO_LISTAS:{gid:"1236509559",name:"⚙️ Apoio & Listas",key:"apoio_listas"},CHAMADOS_B2B:{gid:"2005931044",name:"Chamados B2B",key:"chamados_b2b"},INCIDENTES:{gid:"1386014215",name:"Incidentes",key:"incidentes"},VISTORIAS_RJ:{gid:"1475053554",name:"Vistorias RJ",key:"vistorias_rj"},INFRA_RJ:{gid:"170808402",name:"Infra RJ",key:"infra_rj"},POPS:{gid:"705477249",name:"POPs & Preventivas",key:"pops"},DADOS_ACESSO:{gid:"384155401",name:"Dados de acesso",key:"dados_acesso"},LOGISTICA:{gid:"1088075983",name:"Logística Reversa",key:"logistica"},ESTOQUE:{gid:"738843736",name:"Estoque Disponível",key:"estoque"},ACESSOS:{gid:"1550019024",name:"Acessos",key:"acessos"}},W="vero_cache_",Oe="vero_ts_",N=[],R=null,Se=null;function we(e){const t=[];let a=[],i="",s=!1;for(let n=0;n<e.length;n++){const o=e[n],r=e[n+1];s?o==='"'&&r==='"'?(i+='"',n++):o==='"'?s=!1:i+=o:o==='"'?s=!0:o===","?(a.push(i.trim()),i=""):o===`
`?(a.push(i.trim()),a.some(l=>l!=="")&&t.push(a),a=[],i=""):o==="\r"||(i+=o)}return a.push(i.trim()),a.some(n=>n!=="")&&t.push(a),t}function $(e,t=0){if(e.length<=t+1)return[];const a=e[t].map(s=>s.replace(/\n/g," ").replace(/\s+/g," ").trim()),i=[];for(let s=t+1;s<e.length;s++){const n=e[s];if(n.length<2||(n[0]||"").toUpperCase().includes("TOTAL"))continue;const o={_rowIndex:s+1};for(let r=0;r<a.length;r++)o[a[r]]=n[r]||"";i.push(o)}return i}async function E(e){const t=`${xe}&gid=${e.gid}`;try{const a=await fetch(t);if(!a.ok)throw new Error(`HTTP ${a.status}`);const i=we(await a.text());try{localStorage.setItem(W+e.key,JSON.stringify(i)),localStorage.setItem(Oe+e.key,Date.now().toString())}catch{console.warn("Cache overflow, cleaning old data")}return i}catch(a){console.error(`Erro ao buscar aba "${e.name}":`,a);const i=localStorage.getItem(W+e.key);return i?(console.log(`Usando cache local para "${e.name}"`),JSON.parse(i)):[]}}async function $e(){const e=await E(C.CHAMADOS_B2B),t=e.findIndex(a=>(a[0]||"").includes("Dt. Abertura"));return t===-1?[]:$(e,t)}async function Ie(){const e=await E(C.INCIDENTES),t=e.findIndex(a=>(a[0]||"").includes("Origem"));return t===-1?[]:$(e,t)}async function Le(){const e=await E(C.VISTORIAS_RJ),t=e.findIndex(a=>(a[0]||"").includes("Data Agendada"));return t===-1?[]:$(e,t)}async function Te(){const e=await E(C.INFRA_RJ),t=e.findIndex(a=>(a[0]||"").includes("Data Agendada"));return t===-1?[]:$(e,t)}async function ke(){const e=await E(C.POPS),t=e.findIndex(a=>(a[0]||"").includes("Sigla"));return t===-1?[]:$(e,t)}async function De(){const e=await E(C.ESTOQUE),t=e.findIndex(a=>(a[0]||"").includes("Categoria"));return t===-1?[]:$(e,t)}async function Ne(){const e=await E(C.APOIO_LISTAS);if(e.length<2)return{};const t=e[0],a={};return t.forEach((i,s)=>{if(i){a[i]=[];for(let n=1;n<e.length;n++)e[n][s]&&a[i].push(e[n][s])}}),a}async function Re(){const e=await E(C.ACESSOS),t=e.findIndex(a=>a.some(i=>typeof i=="string"&&i.toLowerCase().replace("-","").includes("email")));return t===-1?(console.warn('[Sheets] Aba Acessos não encontrada ou sem header "Email"'),[]):$(e,t)}async function Me(){const e=await E(C.VISAO_GERAL),t={},a=e.findIndex(l=>(l[0]||"").includes("TOTAL B2B"));if(a>=0&&e[a+1]){e[a];const l=e[a+1];t.totalB2B=parseInt(l[0])||0,t.totalIncidentes=parseInt(l[2])||0,t.totalVistorias=parseInt(l[4])||0,t.totalInfra=parseInt(l[6])||0}const i=e.findIndex(l=>(l[0]||"").includes("B2B NORMALIZADOS"));if(i>=0&&e[i+1]){const l=e[i+1];t.b2bNormalizados=parseInt(l[0])||0,t.incidentesConcluidos=parseInt(l[2])||0,t.vistoriasConcluidas=parseInt(l[4])||0,t.infraConcluidas=parseInt(l[6])||0}const s=e.findIndex(l=>(l[0]||"").includes("Técnico / Responsável")),n=[];if(s>=0)for(let l=s+1;l<e.length;l++){const d=e[l];!d[0]||d[0].includes("TOTAL")||n.push({tecnico:d[0],b2bAtrib:parseInt(d[1])||0,b2bConcl:parseInt(d[2])||0,incAtrib:parseInt(d[3])||0,incConcl:parseInt(d[4])||0,vistAtrib:parseInt(d[5])||0,vistConcl:parseInt(d[6])||0,infraAtrib:parseInt(d[7])||0,infraConcl:parseInt(d[8])||0,totalAtrib:parseInt(d[9])||0,totalConcl:parseInt(d[10])||0,eficacia:d[11]||"0%"})}const o=e.findIndex(l=>(l[0]||"").includes("Período:")),r={};return o>=0&&(r.periodo=e[o][1]||"GERAL",r.tecnico=e[o][3]||"TODOS",r.dtInicio=e[o][5]||"",r.dtFim=e[o][7]||""),{kpis:t,produtividade:n,filtros:r}}async function k(){const e=Date.now(),[t,a,i,s,n,o,r,l,d]=await Promise.all([Me(),$e(),Ie(),Le(),Te(),ke(),De(),Ne(),Re()]);Se=new Date;const c=Date.now()-e;console.log(`[Sheets] Todos os dados carregados em ${c}ms (${d.length} perfis de acesso)`);const p={visaoGeral:t,chamadosB2B:a,incidentes:i,vistorias:s,infra:n,pops:o,estoque:r,apoioListas:l,acessos:d};return N.forEach(h=>h(p)),p}function _e(e=12e4){Pe(),R=setInterval(()=>{k().catch(t=>console.error("[Sheets] Auto-refresh failed:",t))},e)}function Pe(){R&&(clearInterval(R),R=null)}function Be(e){return N.push(e),()=>{N=N.filter(t=>t!==e)}}function u(e){return e==null?"":String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}var L=null,ne=[];function Ue(){const e=localStorage.getItem("vero_user");e&&(L=JSON.parse(e),Z())}function qe(e,t,a){if(!a||a.length===0)return!1;const i=e.trim().toLowerCase(),s=a.find(n=>(n.Email||"").trim().toLowerCase()===i);return s&&s.Senha&&s.Senha.toString()===t?(L={email:s.Email,name:s.Nome||i.split("@")[0],picture:`https://ui-avatars.com/api/?name=${encodeURIComponent(s.Nome||i)}&background=14b8a6&color=fff`,role:s.Perfil||"VISUALIZADOR"},localStorage.setItem("vero_user",JSON.stringify(L)),Z(),!0):!1}function Fe(){L=null,localStorage.removeItem("vero_user"),Z()}function H(){return L}function He(e){ne.push(e)}function Z(){ne.forEach(e=>e(L))}var ee={ADMIN:{dashboard:{view:!0,edit:!1},b2b:{view:!0,edit:!0,create:!0},incidentes:{view:!0,edit:!0,create:!0},vistorias:{view:!0,edit:!0,create:!0},infra:{view:!0,edit:!0,create:!0},pops:{view:!0,edit:!0,create:!0},estoque:{view:!0,edit:!0,create:!0}},"TÉCNICO CAMPO":{dashboard:{view:!1,edit:!1},b2b:{view:!1,edit:!1,create:!1},incidentes:{view:!0,edit:!0,create:!1},vistorias:{view:!0,edit:!0,create:!1},infra:{view:!0,edit:!0,create:!1},pops:{view:!1,edit:!1,create:!1},estoque:{view:!0,edit:!1,create:!1}},"TECNICO CAMPO":null,"TÉCNICO B2B":{dashboard:{view:!1,edit:!1},b2b:{view:!0,edit:!0,create:!1},incidentes:{view:!0,edit:!0,create:!1},vistorias:{view:!1,edit:!1,create:!1},infra:{view:!1,edit:!1,create:!1},pops:{view:!1,edit:!1,create:!1},estoque:{view:!1,edit:!1,create:!1}},"TECNICO B2B":null,INFRA:{dashboard:{view:!1,edit:!1},b2b:{view:!1,edit:!1,create:!1},incidentes:{view:!0,edit:!0,create:!1},vistorias:{view:!1,edit:!1,create:!1},infra:{view:!0,edit:!0,create:!0},pops:{view:!0,edit:!0,create:!1},estoque:{view:!1,edit:!1,create:!1}},INFRAESTRUTURA:null,LOGÍSTICA:{dashboard:{view:!1,edit:!1},b2b:{view:!1,edit:!1,create:!1},incidentes:{view:!1,edit:!1,create:!1},vistorias:{view:!1,edit:!1,create:!1},infra:{view:!1,edit:!1,create:!1},pops:{view:!1,edit:!1,create:!1},estoque:{view:!0,edit:!0,create:!0}},LOGISTICA:null,VISUALIZADOR:{dashboard:{view:!0,edit:!1},b2b:{view:!0,edit:!1,create:!1},incidentes:{view:!0,edit:!1,create:!1},vistorias:{view:!0,edit:!1,create:!1},infra:{view:!0,edit:!1,create:!1},pops:{view:!0,edit:!1,create:!1},estoque:{view:!0,edit:!1,create:!1}}},ze={b2b:["Status / Andamento","Técnico / Responsável","Observações Gerais","Dt. Finalizado"],incidentes:["Status","Responsável Técnico","Observações"],vistorias:["Responsável pela vistoria (Manual)","Status Execução (Manual)","Observação geral (Manual)"],infra:["Responsável pela infra (Manual)","Status Execução (Manual)","Observação geral (Manual)"],pops:["Status","Observações"],estoque:["Quantidade","Status Equipamento","Observações"]},Ve={"TECNICO CAMPO":"TÉCNICO CAMPO","TECNICO B2B":"TÉCNICO B2B",INFRAESTRUTURA:"INFRA",LOGISTICA:"LOGÍSTICA"};function je(e){if(!e)return"VISUALIZADOR";const t=e.toUpperCase().trim();return Ve[t]||t}var S="VISUALIZADOR",Ge=null,te=null;function ae(e,t){if(te=e||[],Ge=t,!t){S="VISUALIZADOR";return}const a=te.find(i=>i.Email&&i.Email.toLowerCase().trim()===t.toLowerCase().trim());a&&a.Perfil?S=je(a.Perfil):S="VISUALIZADOR",console.log(`[RBAC] User ${t} → Role: ${S}`)}function Je(){return S}function Ze(e){const t=Q(e);return t?t.view:!1}function A(e){const t=Q(e);return t?t.edit:!1}function oe(e){const t=Q(e);return t?t.create:!1}function Qe(e,t){return A(e)?S==="ADMIN"?!0:(ze[e]||[]).includes(t):!1}function re(){return["dashboard","b2b","incidentes","vistorias","infra","pops","estoque"].filter(e=>Ze(e))}function Ke(){const e=re();return e.length>0?e[0]:null}function Q(e){const t=ee[S];return t?t[e]||null:ee.VISUALIZADOR[e]||null}var Xe=Ae({WEBHOOK_URL:()=>le,appendRow:()=>ue,batchUpdate:()=>ce,enqueueWrite:()=>K,getPendingCount:()=>ve,onQueueChange:()=>fe,processQueue:()=>w,updateCell:()=>de,uploadPhoto:()=>pe}),le="https://script.google.com/macros/s/AKfycbz-q0Ngl4KZAvnocvxcbRigshjGx5pYSSY6a9qMXscibifFnaxnmv8gSKcHTNaKsIvJ/exec",y=[],F=!1,M=[];function Ye(){if(!H())throw new Error("AUTH_REQUIRED")}async function P(e){Ye();const t=await fetch(le,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`Erro HTTP no Webhook: ${t.status}`);const a=await t.json();if(a.error)throw new Error(`Erro do servidor: ${a.error}`);return a.data}async function de(e,t,a,i){return P({action:"updateCell",sheetName:e,row:t,col:a,value:i})}async function ce(e){return P({action:"batchUpdate",updates:e})}async function ue(e,t){return P({action:"appendRow",sheetName:e,rowData:t})}function We(e,t=1200,a=.7){return new Promise((i,s)=>{const n=new FileReader;n.onload=o=>{const r=new Image;r.onload=()=>{const l=document.createElement("canvas");let d=r.width,c=r.height;d>t&&(c=Math.round(c*t/d),d=t),l.width=d,l.height=c,l.getContext("2d").drawImage(r,0,0,d,c),l.toDataURL("image/jpeg",a),i(l.toDataURL("image/jpeg",a))},r.onerror=s,r.src=o.target.result},n.onerror=s,n.readAsDataURL(e)})}async function pe(e,t="evidencia"){const a=await We(e);return P({action:"uploadPhoto",filename:`${t}_${new Date().toISOString().replace(/[:.]/g,"-")}.jpg`,mimeType:"image/jpeg",base64Data:a})}var he="vero_write_queue";function B(){try{const e=localStorage.getItem(he);y=e?JSON.parse(e):[]}catch{y=[]}}function z(){localStorage.setItem(he,JSON.stringify(y)),me()}function K(e,t){B(),y.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),type:e,payload:t,createdAt:new Date().toISOString(),retries:0}),z(),w()}async function w(){if(!(F||y.length===0)&&navigator.onLine){for(F=!0,B();y.length>0;){const e=y[0];try{e.type==="update"?await de(e.payload.sheetName,e.payload.row,e.payload.col,e.payload.value):e.type==="batch"?await ce(e.payload.updates):e.type==="append"&&await ue(e.payload.sheetName,e.payload.rowData),y.shift(),z()}catch(t){console.error("[Write Queue] Failed:",t),e.retries++,(e.retries>=5||t.message==="AUTH_REQUIRED")&&(console.error("[Write Queue] Error blocking queue, discarding or waiting:",e),t.message!=="AUTH_REQUIRED"&&(y.shift(),z()));break}}F=!1,me()}}function ve(){return B(),y.length}function fe(e){return M.push(e),()=>{M=M.filter(t=>t!==e)}}function me(){M.forEach(e=>e(y.length))}window.addEventListener("online",()=>{console.log("[Write Queue] Back online, processing queue..."),w()});B();var O=null,et=0;function tt(){return O||(O=document.createElement("div"),O.className="toast-container",O.id="toast-container",document.body.appendChild(O),O)}function U(e,t="info",a=3500){const i=tt(),s=`toast-${++et}`,n={success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',warning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',sync:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27"/></svg>'},o=document.createElement("div");return o.className=`toast toast-${t}`,o.id=s,o.innerHTML=`
    <div class="toast-icon">${n[t]||n.info}</div>
    <div class="toast-message">${e}</div>
    <button class="toast-close" aria-label="Fechar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `,o.querySelector(".toast-close").addEventListener("click",()=>se(s)),i.appendChild(o),requestAnimationFrame(()=>{o.classList.add("toast-show")}),a>0&&setTimeout(()=>se(s),a),s}function se(e){const t=document.getElementById(e);t&&(t.classList.remove("toast-show"),t.classList.add("toast-hide"),setTimeout(()=>t.remove(),300))}function q(e,t){return U(e,"success",t)}function x(e,t){return U(e,"error",t||5e3)}function ge(e,t){return U(e,"warning",t)}function V(e,t){return U(e,"info",t)}function be(e="evidencia",t=null){const a=document.createElement("div");a.className="photo-capture",a.innerHTML=`
    <div class="photo-capture-header">
      <span class="photo-capture-label">📷 Evidências Fotográficas</span>
      <button class="photo-capture-btn" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Tirar Foto
      </button>
    </div>
    <input type="file" accept="image/*" capture="environment" class="photo-capture-input" style="display:none">
    <div class="photo-capture-gallery"></div>
    <div class="photo-capture-uploading" style="display:none">
      <div class="photo-upload-spinner"></div>
      <span>Enviando foto...</span>
    </div>
  `;const i=a.querySelector(".photo-capture-input"),s=a.querySelector(".photo-capture-gallery"),n=a.querySelector(".photo-capture-uploading");return a.querySelector(".photo-capture-btn").addEventListener("click",()=>i.click()),i.addEventListener("change",async o=>{const r=o.target.files[0];if(!r)return;const l=new FileReader;l.onload=d=>{const c=document.createElement("div");c.className="photo-thumb photo-thumb-uploading",c.innerHTML=`
        <img src="${d.target.result}" alt="Preview">
        <div class="photo-thumb-overlay">
          <div class="photo-upload-spinner-sm"></div>
        </div>
      `,s.appendChild(c),n.style.display="flex",pe(r,e).then(p=>{c.classList.remove("photo-thumb-uploading"),c.querySelector(".photo-thumb-overlay").innerHTML=`
            <svg viewBox="0 0 24 24" fill="none" stroke="#4ADE80" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          `,c.dataset.url=p.url,c.dataset.viewUrl=p.viewUrl,c.addEventListener("click",()=>{at(p.url,p.viewUrl)}),t&&t(p),q("Foto enviada com sucesso!")}).catch(p=>{console.error("Photo upload failed:",p),c.classList.add("photo-thumb-error"),c.querySelector(".photo-thumb-overlay").innerHTML=`
            <svg viewBox="0 0 24 24" fill="none" stroke="#FB7185" stroke-width="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          `,x("Falha no upload da foto. Verifique sua conexão.")}).finally(()=>{n.style.display="none",i.value=""})},l.readAsDataURL(r)}),a}function ye(e){const t=e.querySelectorAll(".photo-thumb[data-url]");return Array.from(t).map(a=>({url:a.dataset.url,viewUrl:a.dataset.viewUrl}))}function at(e,t){const a=document.createElement("div");a.className="gallery-viewer",a.innerHTML=`
    <div class="gallery-viewer-backdrop"></div>
    <div class="gallery-viewer-content">
      <img src="${e}" alt="Evidência">
      <div class="gallery-viewer-actions">
        ${t?`<a href="${t}" target="_blank" class="gallery-viewer-btn">Abrir no Drive</a>`:""}
        <button class="gallery-viewer-btn gallery-viewer-close">Fechar</button>
      </div>
    </div>
  `,a.querySelector(".gallery-viewer-backdrop").addEventListener("click",()=>a.remove()),a.querySelector(".gallery-viewer-close").addEventListener("click",()=>a.remove()),document.body.appendChild(a),requestAnimationFrame(()=>a.classList.add("gallery-viewer-show"))}var st={b2b:{sheetName:"Chamados B2B",keyColumn:"B",keyField:"Protocolo",fields:[{name:"Status / Andamento",col:8,type:"select",options:"Status Chamados"},{name:"Técnico / Responsável",col:7,type:"select",options:"Técnicos"},{name:"Observações Gerais",col:10,type:"textarea"},{name:"Dt. Finalizado",col:9,type:"text",placeholder:"dd/mm/yyyy HH:mm:ss"}],headerOffset:4},incidentes:{sheetName:"Incidentes",keyColumn:"B",keyField:"Task ID",fields:[{name:"Status",col:6,type:"select",options:"Status Chamados"},{name:"Responsável Técnico",col:5,type:"select",options:"Técnicos"},{name:"Observações",col:8,type:"textarea"},{name:"Data Finalizado",col:7,type:"text",placeholder:"dd/mm/yyyy"}],headerOffset:4},vistorias:{sheetName:"Vistorias RJ",keyColumn:"E",keyField:"Contrato / Protocolo",fields:[{name:"Responsável pela vistoria (Manual)",col:11,type:"select",options:"Técnicos"},{name:"Status Execução (Manual)",col:12,type:"select",options:"Status Execução"},{name:"Observação geral (Manual)",col:13,type:"textarea"}],headerOffset:4,compositeKey:e=>`${e["Data Agendada"]||""}|${e["Contrato / Protocolo"]||""}`},infra:{sheetName:"Infra RJ",keyColumn:"E",keyField:"Contrato / Protocolo",fields:[{name:"Responsável pela infra (Manual)",col:13,type:"select",options:"Técnicos"},{name:"Status Execução (Manual)",col:14,type:"select",options:"Status Execução"},{name:"Observação geral (Manual)",col:15,type:"textarea"}],headerOffset:5,compositeKey:e=>`${e["Data Agendada"]||""}|${e["Contrato / Protocolo"]||""}`}},f=null,j=null,G=null;function it(e,t,a,i=null){const s=st[e];if(!s){x("Módulo não suportado para edição");return}j=a||{},G=i,nt(e,s,t)}function I(){f&&(f.classList.remove("edit-modal-show"),setTimeout(()=>{f.remove(),f=null},300))}function nt(e,t,a){f&&f.remove(),f=document.createElement("div"),f.className="edit-modal",f.id="edit-modal";const i=a["Razão Social / Cliente"]||a["Título do Chamado / Trecho"]||"Registro";f.innerHTML=`
    <div class="edit-modal-backdrop"></div>
    <div class="edit-modal-sheet">
      <div class="edit-modal-drag-handle"></div>
      <div class="edit-modal-header">
        <div>
          <h3 class="edit-modal-title">Editar Registro</h3>
          <p class="edit-modal-subtitle">${u(i)}</p>
        </div>
        <button class="edit-modal-close" aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="edit-modal-body">
        <div class="edit-modal-fields" id="edit-fields"></div>
        <div class="edit-modal-photos" id="edit-photos"></div>
      </div>
      <div class="edit-modal-footer">
        <button class="edit-modal-cancel" type="button">Cancelar</button>
        <button class="edit-modal-save" type="button" id="edit-save-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Salvar Alterações
        </button>
      </div>
    </div>
  `;const s=f.querySelector("#edit-fields");t.fields.forEach(l=>{const d=Qe(e,l.name),c=a[l.name]||"";s.appendChild(ot(l,c,d))});const n=f.querySelector("#edit-photos"),o=a[t.keyField]||"unknown",r=be(`${e.toUpperCase()}_${o}`);n.appendChild(r),f.querySelector(".edit-modal-backdrop").addEventListener("click",I),f.querySelector(".edit-modal-close").addEventListener("click",I),f.querySelector(".edit-modal-cancel").addEventListener("click",I),f.querySelector("#edit-save-btn").addEventListener("click",()=>{rt(e,t,a,n)}),lt(f.querySelector(".edit-modal-sheet")),document.body.appendChild(f),requestAnimationFrame(()=>f.classList.add("edit-modal-show"))}function ot(e,t,a){const i=document.createElement("div");i.className="edit-field";const s=document.createElement("label");s.className="edit-field-label",s.textContent=e.name,i.appendChild(s);let n;if(e.type==="select"){n=document.createElement("select"),n.className="edit-field-input",n.disabled=!a;const o=e.options,r=j&&j[o]||[],l=document.createElement("option");if(l.value="",l.textContent="— Selecionar —",n.appendChild(l),r.forEach(d=>{const c=document.createElement("option");c.value=d,c.textContent=d,d.trim().toUpperCase()===t.trim().toUpperCase()&&(c.selected=!0),n.appendChild(c)}),t&&!r.some(d=>d.trim().toUpperCase()===t.trim().toUpperCase())){const d=document.createElement("option");d.value=t,d.textContent=t,d.selected=!0,n.appendChild(d)}}else e.type==="textarea"?(n=document.createElement("textarea"),n.className="edit-field-input edit-field-textarea",n.rows=3,n.value=t,n.disabled=!a):(n=document.createElement("input"),n.type="text",n.className="edit-field-input",n.value=t,n.placeholder=e.placeholder||"",n.disabled=!a);return n.dataset.fieldName=e.name,n.dataset.col=e.col,a||i.classList.add("edit-field-readonly"),i.appendChild(n),i}async function rt(e,t,a,i){const s=f.querySelector("#edit-save-btn");s.disabled=!0,s.innerHTML='<div class="btn-spinner"></div> Salvando...';try{const n=f.querySelectorAll(".edit-field-input:not(:disabled)"),o=[];let r=a._rowIndex;if(!r){x("Registro não encontrado na planilha. O dado pode ter sido movido."),s.disabled=!1,s.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg> Salvar Alterações';return}n.forEach(d=>{const c=parseInt(d.dataset.col),p=d.dataset.fieldName,h=d.value;h!==(a[p]||"")&&o.push({sheetName:t.sheetName,row:r,col:c,value:h})});const l=ye(i);if(l.length>0){const d=l.map(p=>p.viewUrl||p.url).join(`
`),c=n[n.length-1];if(c){const p=c.value,h=p?`${p}
📷 Fotos: ${d}`:`📷 Fotos: ${d}`;c.value=h;const v=parseInt(c.dataset.col),g=o.findIndex(b=>b.col===v);g>=0?o[g].value=h:o.push({sheetName:t.sheetName,row:r,col:v,value:h})}}if(o.length===0){V("Nenhuma alteração detectada"),I();return}K("batch",{updates:o}),q(`${o.length} campo${o.length>1?"s":""} atualizado${o.length>1?"s":""}`),o.forEach(d=>{const c=Array.from(n).find(p=>parseInt(p.dataset.col)===d.col)?.dataset.fieldName;c&&(a[c]=d.value)}),G&&G(a),I()}catch(n){console.error("[EditModal] Save failed:",n),n.message==="AUTH_REQUIRED"?x("Sessão expirada. Faça login novamente."):x("Erro ao salvar. A alteração foi enfileirada para retry.")}finally{s.disabled=!1,s.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg> Salvar Alterações'}}function lt(e){let t=0,a=0,i=!1;const s=e.querySelector(".edit-modal-drag-handle");s&&(s.addEventListener("touchstart",n=>{t=n.touches[0].clientY,i=!0,e.style.transition="none"},{passive:!0}),s.addEventListener("touchmove",n=>{if(!i)return;a=n.touches[0].clientY;const o=Math.max(0,a-t);e.style.transform=`translateY(${o}px)`},{passive:!0}),s.addEventListener("touchend",()=>{i&&(i=!1,e.style.transition="",a-t>120?I():e.style.transform="")}))}var dt={b2b:{sheetName:"Chamados B2B",title:"Novo Chamado B2B",icon:"📋",fields:[{name:"Dt. Abertura",type:"datetime-local",required:!0,default:()=>new Date().toISOString().slice(0,16)},{name:"Protocolo",type:"text",required:!0,placeholder:"Nº do protocolo"},{name:"Contrato",type:"text",placeholder:"Nº do contrato"},{name:"Razão Social / Cliente",type:"text",required:!0,placeholder:"Nome do cliente"},{name:"Endereço",type:"text",required:!0,placeholder:"Rua, número"},{name:"Número / Complemento",type:"text",placeholder:"Complemento"},{name:"Diagnóstico / Tipo de Falha",type:"select",options:"Diagnóstico / Falha",required:!0},{name:"Técnico / Responsável",type:"select",options:"Técnicos"},{name:"Status / Andamento",type:"select",options:"Status Chamados",default:()=>"Pendente"},{name:"Observações Gerais",type:"textarea",placeholder:"Detalhes do chamado"}]},incidentes:{sheetName:"Incidentes",title:"Novo Incidente",icon:"⚡",fields:[{name:"Origem / Categoria",type:"select",options:"Categoria Incidente",required:!0},{name:"Task ID",type:"text",placeholder:"TAS000000XXXXX"},{name:"Incidente",type:"text",placeholder:"INC000000XXXXX"},{name:"Título do Chamado / Trecho",type:"text",required:!0,placeholder:"Descrição do incidente"},{name:"Diagnóstico / Problema",type:"text",placeholder:"Diagnóstico"},{name:"Responsável Técnico",type:"select",options:"Técnicos"},{name:"Status",type:"select",options:"Status Chamados",default:()=>"Pendente"},{name:"Observações",type:"textarea"}]},vistorias:{sheetName:"Vistorias RJ",title:"Nova Vistoria",icon:"🔍",fields:[{name:"Data Agendada",type:"date",required:!0,default:()=>new Date().toISOString().slice(0,10)},{name:"Aba Ref.",type:"text",default:()=>{const e=new Date;return`${String(e.getDate()).padStart(2,"0")}-${String(e.getMonth()+1).padStart(2,"0")}`}},{name:"Atendente",type:"text",placeholder:"Nome do atendente"},{name:"Tipo de Vistoria",type:"select",staticOptions:["MONO","CONECTORIZADO","CONECTORIZADA"]},{name:"Contrato / Protocolo",type:"text",required:!0,placeholder:"Nº contrato"},{name:"Razão Social / Cliente",type:"text",required:!0,placeholder:"Nome do cliente"},{name:"Período / Horário",type:"text",placeholder:"HC, 08:00, etc.",default:()=>"HC"},{name:"Status da Vistoria",type:"select",staticOptions:["AGENDADO","AGUARDANDO CONFIRMAÇÃO"],default:()=>"AGENDADO"},{name:"Localidade (Bairro/RJ)",type:"text",placeholder:"RJ - BAIRRO"},{name:"ADM / Restrição",type:"select",staticOptions:["NÃO","TERJ","SIGMA"],default:()=>"NÃO"},{name:"Observações / Contato de Acompanhamento",type:"textarea",placeholder:"Quem acompanhará, contatos, OS..."},{name:"Responsável pela vistoria (Manual)",type:"select",options:"Técnicos"},{name:"Status Execução (Manual)",type:"select",options:"Status Execução",default:()=>"Pendente"},{name:"Observação geral (Manual)",type:"textarea"}]},infra:{sheetName:"Infra RJ",title:"Nova Atividade de Infra",icon:"🏗️",fields:[{name:"Data Agendada",type:"date",required:!0,default:()=>new Date().toISOString().slice(0,10)},{name:"Aba Ref.",type:"text",default:()=>{const e=new Date;return`${String(e.getDate()).padStart(2,"0")}-${String(e.getMonth()+1).padStart(2,"0")}`}},{name:"Atendente",type:"text",placeholder:"Nome do atendente"},{name:"Tipo de Atividade",type:"select",staticOptions:["MONO","CONECTORIZADO"]},{name:"Contrato / Protocolo",type:"text",required:!0},{name:"Razão Social / Cliente",type:"text",required:!0},{name:"Período / Horário",type:"text",default:()=>"HC"},{name:"Status da Atividade",type:"select",staticOptions:["AGENDADO","AGUARDANDO CONFIRMAÇÃO"],default:()=>"AGENDADO"},{name:"Localidade (Bairro/RJ)",type:"text",placeholder:"RJ - BAIRRO"},{name:"ADM / Restrição",type:"select",staticOptions:["NÃO","TERJ","SIGMA"],default:()=>"NÃO"},{name:"Materiais Necessários",type:"text",placeholder:"NÃO, ALÇAPÃO, GESSO...",default:()=>"NÃO"},{name:"Detalhes Atendimento",type:"select",staticOptions:["COMPLETO","PARCIAL"],default:()=>"COMPLETO"},{name:"Observações",type:"textarea"},{name:"Responsável pela infra (Manual)",type:"select",options:"Técnicos"},{name:"Status Execução (Manual)",type:"select",options:"Status Execução",default:()=>"Pendente"},{name:"Observação geral (Manual)",type:"textarea"}]}},m=null,J=null;function ct(e,t,a=null){if(!oe(e)){ge("Você não tem permissão para criar registros neste módulo.");return}const i=dt[e];if(!i){x("Módulo não suportado para criação");return}J=t||{},ut(e,i,a)}function _(){m&&(m.classList.remove("edit-modal-show"),setTimeout(()=>{m.remove(),m=null},300))}function ut(e,t,a){m&&m.remove(),m=document.createElement("div"),m.className="edit-modal",m.innerHTML=`
    <div class="edit-modal-backdrop"></div>
    <div class="edit-modal-sheet edit-modal-sheet-tall">
      <div class="edit-modal-drag-handle"></div>
      <div class="edit-modal-header">
        <div>
          <h3 class="edit-modal-title">${t.icon} ${u(t.title)}</h3>
          <p class="edit-modal-subtitle">Preencha os campos obrigatórios (*)</p>
        </div>
        <button class="edit-modal-close" aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="edit-modal-body">
        <div class="edit-modal-fields" id="create-fields"></div>
        <div class="edit-modal-photos" id="create-photos"></div>
      </div>
      <div class="edit-modal-footer">
        <button class="edit-modal-cancel" type="button">Cancelar</button>
        <button class="edit-modal-save create-btn" type="button" id="create-save-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Criar Registro
        </button>
      </div>
    </div>
  `;const i=m.querySelector("#create-fields");t.fields.forEach(o=>{i.appendChild(pt(o))});const s=m.querySelector("#create-photos"),n=be(`NOVO_${e.toUpperCase()}`);s.appendChild(n),m.querySelector(".edit-modal-backdrop").addEventListener("click",_),m.querySelector(".edit-modal-close").addEventListener("click",_),m.querySelector(".edit-modal-cancel").addEventListener("click",_),m.querySelector("#create-save-btn").addEventListener("click",()=>{ht(e,t,s,a)}),document.body.appendChild(m),requestAnimationFrame(()=>m.classList.add("edit-modal-show"))}function pt(e){const t=document.createElement("div");t.className="edit-field";const a=document.createElement("label");a.className="edit-field-label",a.textContent=e.name+(e.required?" *":""),t.appendChild(a);let i;const s=e.default?e.default():"";if(e.type==="select"){i=document.createElement("select"),i.className="edit-field-input";const n=document.createElement("option");n.value="",n.textContent="— Selecionar —",i.appendChild(n);let o=[];e.staticOptions?o=e.staticOptions:e.options&&J[e.options]&&(o=J[e.options]),o.forEach(r=>{const l=document.createElement("option");l.value=r,l.textContent=r,r===s&&(l.selected=!0),i.appendChild(l)})}else e.type==="textarea"?(i=document.createElement("textarea"),i.className="edit-field-input edit-field-textarea",i.rows=3,i.value=s,e.placeholder&&(i.placeholder=e.placeholder)):(i=document.createElement("input"),i.type=e.type||"text",i.className="edit-field-input",i.value=s,e.placeholder&&(i.placeholder=e.placeholder));return i.dataset.fieldName=e.name,i.dataset.required=e.required?"true":"false",t.appendChild(i),t}function ht(e,t,a,i){const s=m.querySelector("#create-save-btn"),n=m.querySelectorAll("#create-fields .edit-field-input");let o=!1;if(n.forEach(d=>{d.classList.remove("edit-field-error"),d.dataset.required==="true"&&!d.value.trim()&&(d.classList.add("edit-field-error"),o=!0)}),o){ge("Preencha todos os campos obrigatórios (*)");return}const r=t.fields.map(d=>{const c=m.querySelector(`[data-field-name="${d.name}"]`);let p=c?c.value:"";if(d.type==="date"&&p){const h=p.split("-");p=`${h[2]}/${h[1]}/${h[0]}`}return d.type==="datetime-local"&&p&&(p=new Date(p).toLocaleString("pt-BR")),p}),l=ye(a);if(l.length>0){const d=r.length-1,c=l.map(p=>p.viewUrl||p.url).join(" | ");r[d]=r[d]?`${r[d]} | 📷 ${c}`:`📷 ${c}`}s.disabled=!0,s.innerHTML='<div class="btn-spinner"></div> Criando...',K("append",{sheetName:t.sheetName,rowData:r}),q("Registro criado com sucesso!"),i&&i(r),_()}var vt=class{constructor(){this.container=null,this.data=null,this.filterPeriod="GERAL"}init(e){this.container=e}render(e){if(!this.container)return;this.data=e;const{kpis:t,produtividade:a}=this._calculateDynamicStats(e,this.filterPeriod);this.container.innerHTML=`
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📊 Painel Operacional</h2>
          <p class="module-subtitle">Visão consolidada de produtividade</p>
        </div>
        <div class="filters-bar" style="justify-content: flex-end;">
          <select id="dashboard-period" class="search-input" style="width: auto; padding: 8px 12px; background: var(--panel);">
            <option value="HOJE" ${this.filterPeriod==="HOJE"?"selected":""}>Hoje</option>
            <option value="SEMANA" ${this.filterPeriod==="SEMANA"?"selected":""}>Últimos 7 dias</option>
            <option value="MES" ${this.filterPeriod==="MES"?"selected":""}>Este Mês</option>
            <option value="GERAL" ${this.filterPeriod==="GERAL"?"selected":""}>Geral (Todos)</option>
          </select>
        </div>
      </div>

      <div class="kpi-grid">
        ${this._renderKPI("Chamados B2B",t.totalB2B,t.b2bNormalizados,"teal")}
        ${this._renderKPI("Incidentes",t.totalIncidentes,t.incidentesConcluidos,"coral")}
        ${this._renderKPI("Vistorias",t.totalVistorias,t.vistoriasConcluidas,"amber")}
        ${this._renderKPI("Infra",t.totalInfra,t.infraConcluidas,"violet")}
      </div>

      <div class="kpi-grid" style="margin-bottom: 28px;">
        ${this._renderRateKPI("Taxa Geral",this._calcRate(a),"sky")}
        ${this._renderCountKPI("Total Atribuído",this._sumField(a,"totalAtrib"),"blue")}
        ${this._renderCountKPI("Total Concluído",this._sumField(a,"totalConcl"),"green")}
        ${this._renderCountKPI("Técnicos Ativos",a.filter(i=>i.totalAtrib>0).length,"cyan")}
      </div>

      <h3 style="font-size:15px; font-weight:700; margin-bottom:14px; color:var(--text);">
        📈 Produtividade Individual
      </h3>
      ${this._renderProdTable(a)}
    `,this._bindEvents()}_bindEvents(){const e=this.container.querySelector("#dashboard-period");e&&e.addEventListener("change",t=>{this.filterPeriod=t.target.value,this.render(this.data)})}_parseDate(e){if(!e||typeof e!="string")return null;const t=e.match(/(\d{2})\/(\d{2})\/(\d{4})/);return t?new Date(t[3],parseInt(t[2])-1,t[1]):null}_isDateInPeriod(e,t){if(t==="GERAL")return!0;const a=this._parseDate(e);if(!a)return!1;const i=new Date;i.setHours(0,0,0,0);const s=a.getTime();if(t==="HOJE")return s===i.getTime();if(t==="SEMANA"){const n=new Date(i);return n.setDate(i.getDate()-7),a>=n&&a<=i}return t==="MES"?a.getMonth()===i.getMonth()&&a.getFullYear()===i.getFullYear():!0}_calculateDynamicStats(e,t){const a={totalB2B:0,b2bNormalizados:0,totalIncidentes:0,incidentesConcluidos:0,totalVistorias:0,vistoriasConcluidas:0,totalInfra:0,infraConcluidas:0},i={},s=o=>{const r=(o||"").trim();return!r||r==="-"||r.toUpperCase()==="A DEFINIR"||r.toUpperCase()==="SEM ATUAÇÃO"?null:(i[r]||(i[r]={tecnico:r,b2bAtrib:0,b2bConcl:0,incAtrib:0,incConcl:0,vistAtrib:0,vistConcl:0,infraAtrib:0,infraConcl:0,totalAtrib:0,totalConcl:0,eficacia:"0%"}),i[r])};(e.chamadosB2B||[]).forEach(o=>{const r=this._isDateInPeriod(o["Dt. Abertura"],t),l=this._isDateInPeriod(o["Dt. Finalizado"]||o["Dt. Finalizado / Previsão"],t)&&(o["Status / Andamento"]||"").toUpperCase().includes("NORMALIZADO"),d=r||l,c=s(o["Técnico / Responsável"]);d&&(a.totalB2B++,c&&(c.b2bAtrib++,c.totalAtrib++)),l&&(a.b2bNormalizados++,c&&(c.b2bConcl++,c.totalConcl++))}),(e.incidentes||[]).forEach(o=>{const r=(o.Status||"").toUpperCase().includes("NORMALIZADO"),l=r&&this._isDateInPeriod(o["Data Finalizado"],t),d=!r&&t==="GERAL"||l,c=s(o["Responsável Técnico"]);d&&(a.totalIncidentes++,c&&(c.incAtrib++,c.totalAtrib++)),l&&(a.incidentesConcluidos++,c&&(c.incConcl++,c.totalConcl++))}),(e.vistorias||[]).forEach(o=>{const r=this._isDateInPeriod(o["Data Agendada"],t),l=((o["Status da Vistoria"]||"").toUpperCase().includes("CONCLUÍD")||(o["Status da Vistoria"]||"").toUpperCase().includes("REALIZAD")||(o["Status Execução (Manual)"]||"").toUpperCase().includes("NORMALIZADO"))&&r,d=r,c=s(o["Responsável pela vistoria (Manual)"]||o.Atendente);d&&(a.totalVistorias++,c&&(c.vistAtrib++,c.totalAtrib++)),l&&(a.vistoriasConcluidas++,c&&(c.vistConcl++,c.totalConcl++))}),(e.infra||[]).forEach(o=>{const r=this._isDateInPeriod(o["Data Agendada"],t),l=((o["Status Execução (Manual)"]||"").toUpperCase().includes("NORMALIZADO")||(o["Status Execução (Manual)"]||"").toUpperCase().includes("CONCLUÍDO"))&&r,d=r,c=s(o["Responsável pela infra (Manual)"]||o.Atendente);d&&(a.totalInfra++,c&&(c.infraAtrib++,c.totalAtrib++)),l&&(a.infraConcluidas++,c&&(c.infraConcl++,c.totalConcl++))});const n=Object.values(i).map(o=>(o.eficacia=(o.totalAtrib>0?Math.round(o.totalConcl/o.totalAtrib*100):0)+"%",o));return n.sort((o,r)=>parseInt(r.eficacia)-parseInt(o.eficacia)),{kpis:a,produtividade:n}}_renderKPI(e,t,a,i){t=t||0,a=a||0;const s=t-a,n=t>0?Math.round(a/t*100):0;return`
      <div class="kpi-card ${i}">
        <div class="kpi-label">${e}</div>
        <div class="kpi-value">${t}</div>
        <div class="kpi-sub">
          <span class="done">${a}</span> concluídos | <span class="pending">${s}</span> pendentes
          <span style="margin-left:auto; font-family:var(--font-mono); font-weight:600;">${n}%</span>
        </div>
        <div class="progress-bar" style="margin-top:10px;">
          <div class="progress-bar-fill ${i}" style="width:${n}%"></div>
        </div>
      </div>
    `}_renderRateKPI(e,t,a){return`
      <div class="kpi-card ${a}">
        <div class="kpi-label">${e}</div>
        <div class="kpi-value">${t}%</div>
        <div class="kpi-sub">Eficácia consolidada</div>
      </div>
    `}_renderCountKPI(e,t,a){return`
      <div class="kpi-card ${a}">
        <div class="kpi-label">${e}</div>
        <div class="kpi-value">${t}</div>
      </div>
    `}_renderProdTable(e){return e.length?`
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Técnico</th>
              <th style="text-align:center">B2B Atrib.</th>
              <th style="text-align:center">B2B Concl.</th>
              <th style="text-align:center">Inc. Atrib.</th>
              <th style="text-align:center">Inc. Concl.</th>
              <th style="text-align:center">Vist. Atrib.</th>
              <th style="text-align:center">Vist. Concl.</th>
              <th style="text-align:center">Infra Atrib.</th>
              <th style="text-align:center">Infra Concl.</th>
              <th style="text-align:center">Total</th>
              <th style="text-align:center">Concl.</th>
              <th>Eficácia</th>
            </tr>
          </thead>
          <tbody>${e.map(t=>{const a=t.eficacia.replace(",",".").replace("%",""),i=parseFloat(a)||0,s=i>=80?"high":i>=50?"mid":"low",n=i>=80?"green":i>=50?"amber":"coral";return`
        <tr>
          <td class="prod-table-name">${u(t.tecnico)}</td>
          <td style="text-align:center">${t.b2bAtrib}</td>
          <td style="text-align:center">${t.b2bConcl}</td>
          <td style="text-align:center">${t.incAtrib}</td>
          <td style="text-align:center">${t.incConcl}</td>
          <td style="text-align:center">${t.vistAtrib}</td>
          <td style="text-align:center">${t.vistConcl}</td>
          <td style="text-align:center">${t.infraAtrib}</td>
          <td style="text-align:center">${t.infraConcl}</td>
          <td style="text-align:center; font-weight:600">${t.totalAtrib}</td>
          <td style="text-align:center; font-weight:600; color:var(--green)">${t.totalConcl}</td>
          <td>
            <span class="prod-table-rate ${s}">${u(t.eficacia)}</span>
            <div class="progress-bar" style="margin-top:4px; width:80px;">
              <div class="progress-bar-fill ${n}" style="width:${i}%"></div>
            </div>
          </td>
        </tr>
      `}).join("")}</tbody>
        </table>
      </div>
    `:'<div class="empty-state"><h3>Sem dados de produtividade</h3></div>'}_calcRate(e){const t=this._sumField(e,"totalAtrib"),a=this._sumField(e,"totalConcl");return t>0?Math.round(a/t*100):0}_sumField(e,t){return e.reduce((a,i)=>a+(i[t]||0),0)}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="kpi-grid">
        ${Array(4).fill('<div class="skeleton skeleton-kpi"></div>').join("")}
      </div>
      ${Array(3).fill('<div class="skeleton skeleton-card"></div>').join("")}
    `)}},ft=class{constructor(){this.container=null,this.data=[],this.filteredData=[],this.filterStatus="PENDENTES",this.filterTecnico="",this.filterDiagnostico="",this.searchTerm="",this._editCallback=null}setEditCallback(e){this._editCallback=e}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.chamadosB2B||[],this._applyFilters();const t=this._getUniqueValues("Técnico / Responsável"),a=this._getUniqueValues("Diagnóstico / Tipo de Falha"),i=this.data.filter(r=>(r["Status / Andamento"]||"").toUpperCase().includes("NORMALIZADO")).length,s=this.data.filter(r=>(r["Status / Andamento"]||"").toUpperCase().includes("CANCELADO")).length,n=this.data.length-i-s,o=this.data.filter(r=>{const l=(r["Status / Andamento"]||"").toUpperCase();return l.includes("ATENUAÇÃO")||l.includes("ATENUACAO")}).length;this.container.innerHTML=`
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📋 Chamados B2B</h2>
          <p class="module-subtitle">Atendimentos corporativos — ${this.data.length} registros</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="b2b-search" placeholder="Buscar cliente, protocolo..." value="${u(this.searchTerm)}">
            </div>
            <select id="b2b-filter-tecnico" class="search-input" style="padding-left: 12px; max-width: 150px; text-overflow: ellipsis;">
              <option value="">Técnico (Todos)</option>
              ${t.map(r=>`<option value="${u(r)}" ${this.filterTecnico===r?"selected":""}>${u(r)}</option>`).join("")}
            </select>
            <select id="b2b-filter-diagnostico" class="search-input" style="padding-left: 12px; max-width: 180px; text-overflow: ellipsis;">
              <option value="">Diagnóstico (Todos)</option>
              ${a.map(r=>`<option value="${u(r)}" ${this.filterDiagnostico===r?"selected":""}>${u(r)}</option>`).join("")}
            </select>
          </div>
          <div class="filters-scroll">
            ${this._renderFilterChips()}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${this.data.length}</span> Total</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${i}</span> Concluídos</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${n}</span> Pendentes</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--orange)">${o}</span> Atenuação</div>
      </div>

      <div class="cards-list" id="b2b-cards">
        ${this._renderCards()}
      </div>
    `,this._bindEvents()}_applyFilters(){this.filteredData=this.data.filter(e=>{const t=(e["Status / Andamento"]||"").toUpperCase();if(this.filterTecnico&&(e["Técnico / Responsável"]||"").trim()!==this.filterTecnico||this.filterDiagnostico&&(e["Diagnóstico / Tipo de Falha"]||"").trim()!==this.filterDiagnostico)return!1;let a=!1;if(this.filterStatus==="TODOS"?a=!0:this.filterStatus==="PENDENTES"?a=!t.includes("NORMALIZADO")&&!t.includes("CANCELADO"):this.filterStatus==="CONCLUÍDOS"?a=t.includes("NORMALIZADO"):a=t.includes(this.filterStatus.toUpperCase()),!this.searchTerm)return a;const i=this.searchTerm.toLowerCase(),s=[e["Razão Social / Cliente"],e.Protocolo,e.Contrato,e.Endereço,e["Diagnóstico / Tipo de Falha"],e["Técnico / Responsável"]].join(" ").toLowerCase();return a&&s.includes(i)})}_renderFilterChips(){return[{id:"PENDENTES",label:"Pendentes"},{id:"CONCLUÍDOS",label:"Concluídos"},{id:"TODOS",label:"Todos"},{id:"Agendamento",label:"Agendamento"}].map(e=>{const t=this.filterStatus===e.id?"active":"";let a=0;return e.id==="TODOS"?a=this.data.length:e.id==="PENDENTES"?a=this.data.filter(i=>{const s=(i["Status / Andamento"]||"").toUpperCase();return!s.includes("NORMALIZADO")&&!s.includes("CANCELADO")}).length:e.id==="CONCLUÍDOS"?a=this.data.filter(i=>(i["Status / Andamento"]||"").toUpperCase().includes("NORMALIZADO")).length:a=this.data.filter(i=>(i["Status / Andamento"]||"").toUpperCase().includes(e.id.toUpperCase())).length,`<button class="filter-chip ${t}" data-filter="${e.id}">${e.label} (${a})</button>`}).join("")}_renderCards(){return this.filteredData.length?this.filteredData.map((e,t)=>{const a=this._getStatusBadge(e["Status / Andamento"]||""),i=this._getDiagBadge(e["Diagnóstico / Tipo de Falha"]||""),s=e.Endereço||"",n=e["Número / Complemento"]||"",o=`https://www.google.com/maps/search/${encodeURIComponent(s+" "+n)}`;return`
        <div class="data-card" style="animation-delay: ${t*30}ms">
          <div class="data-card-header">
            <div class="data-card-title">${u(e["Razão Social / Cliente"]||"Sem nome")}</div>
            ${a}
          </div>
          <div class="data-card-meta">
            ${i}
            <span class="meta-tag">📝 Protocolo: ${u(e.Protocolo||"-")}</span>
            ${e["Dt. Abertura"]?`<span class="meta-tag">📅 ${u(e["Dt. Abertura"])}</span>`:""}
          </div>
          <div class="data-card-body">
            <div class="field">
              <span class="field-label">Endereço completo: </span>${u(s)}${n?", "+u(n):""}
            </div>
            <div class="field">
              <span class="field-label">Observações Gerais: </span>${u(e["Observações Gerais"]||"-")}
            </div>
            ${e["Técnico / Responsável"]?`<div class="field"><span class="field-label">Técnico: </span>${u(e["Técnico / Responsável"])}</div>`:""}
          </div>
          <div class="data-card-footer">
            <div class="data-card-actions">
              <a href="${o}" target="_blank" class="action-btn" title="Ver no Mapa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Maps
              </a>
              <button class="action-btn" onclick="navigator.clipboard.writeText('${u(e.Protocolo||"")}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copiar Prot.
              </button>
              ${A("b2b")?`<button class="action-btn action-btn-edit" data-idx="${t}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>`:""}
            </div>
          </div>
        </div>
      `}).join(""):`<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        <h3>Nenhum chamado encontrado</h3>
        <p>Ajuste os filtros ou a busca</p>
      </div>`}_getStatusBadge(e){const t=e.toUpperCase(),a=u(e)||"Sem status";return t.includes("NORMALIZADO")?`<span class="badge badge-normalizado">${a}</span>`:t.includes("PENDENTE")?`<span class="badge badge-pendente">${a}</span>`:t.includes("ATENUAÇÃO")||t.includes("ATENUACAO")?`<span class="badge badge-atenuacao">${a}</span>`:t.includes("AGENDAMENTO")?`<span class="badge badge-agendado">${a}</span>`:t.includes("DESIGNADO")?`<span class="badge badge-designado">${a}</span>`:t.includes("CANCELADO")?`<span class="badge badge-cancelado">${a}</span>`:`<span class="badge" style="background:var(--panel);color:var(--muted)">${a}</span>`}_getDiagBadge(e){const t=e.toUpperCase(),a=u(e)||"Sem diagnóstico";return t.includes("ROMPIMENTO")?`<span class="badge badge-rompimento">${a}</span>`:t.includes("QUALIDADE")||t.includes("ATENUAÇÃO")?`<span class="badge badge-qualidade">${a}</span>`:t.includes("RÁDIO")||t.includes("RADIO")?`<span class="badge badge-radio">${a}</span>`:t.includes("SW")||t.includes("HW")?`<span class="badge badge-swhw">${a}</span>`:`<span class="badge" style="background:var(--panel);color:var(--muted)">${a}</span>`}_getUniqueValues(e){const t=new Set;return this.data.forEach(a=>{const i=(a[e]||"").trim();i&&t.add(i)}),Array.from(t).sort()}_bindEvents(){const e=this.container.querySelector("#b2b-search");e&&e.addEventListener("input",i=>{this.searchTerm=i.target.value,this._applyFilters();const s=this.container.querySelector("#b2b-cards");s&&(s.innerHTML=this._renderCards())});const t=this.container.querySelector("#b2b-filter-tecnico");t&&t.addEventListener("change",i=>{this.filterTecnico=i.target.value,this._applyFilters();const s=this.container.querySelector("#b2b-cards");s&&(s.innerHTML=this._renderCards())});const a=this.container.querySelector("#b2b-filter-diagnostico");a&&a.addEventListener("change",i=>{this.filterDiagnostico=i.target.value,this._applyFilters();const s=this.container.querySelector("#b2b-cards");s&&(s.innerHTML=this._renderCards())}),this.container.querySelectorAll(".filter-chip[data-filter]").forEach(i=>{i.addEventListener("click",()=>{this.filterStatus=i.dataset.filter,this.render({chamadosB2B:this.data})})}),this.container.querySelectorAll(".action-btn-edit").forEach(i=>{i.addEventListener("click",()=>{const s=parseInt(i.dataset.idx),n=this.filteredData[s];n&&this._editCallback&&this._editCallback("b2b",n)})})}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">📋 Chamados B2B</h2></div></div>
      ${Array(5).fill('<div class="skeleton skeleton-card"></div>').join("")}
    `)}},mt=class{constructor(){this.container=null,this.data=[],this.filterCat="TODOS",this.ocultarNormalizados=!0,this.searchTerm="",this._editCallback=null}setEditCallback(e){this._editCallback=e}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.incidentes||[];const t=this.data.filter(n=>{const o=this.filterCat==="TODOS"||(n["Origem / Categoria"]||"").toUpperCase().includes(this.filterCat.toUpperCase()),r=(n.Status||"").toUpperCase(),l=this.ocultarNormalizados?!r.includes("NORMALIZADO")&&!r.includes("CONCLUÍDO"):!0;if(!this.searchTerm)return o&&l;const d=this.searchTerm.toLowerCase(),c=[n["Incidente / Problema"],n["Cidade(s) Afetada(s)"],n["Protocolo / Ticket"],n.Designação].join(" ").toLowerCase();return o&&l&&c.includes(d)}),a=this._countByField("Origem / Categoria");let i=0;const s={};this.data.forEach(n=>{const o=(n.Status||"").toUpperCase();!o.includes("NORMALIZADO")&&!o.includes("CONCLUÍDO")&&i++,o.includes("NORMALIZADO")?s.normalizado=(s.normalizado||0)+1:o.includes("PENDENTE")?s.pendente=(s.pendente||0)+1:s.outros=(s.outros||0)+1}),this.container.innerHTML=`
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">⚠️ Incidentes Múltiplos</h2>
          <p class="module-subtitle">Acompanhamento de falhas massivas e tarefas — ${i} abertos de ${this.data.length}</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="inc-search" placeholder="Buscar incidente..." value="${u(this.searchTerm)}">
            </div>
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-dim); cursor:pointer;">
              <input type="checkbox" id="inc-toggle-status" ${this.ocultarNormalizados?"checked":""}>
              Ocultar Normalizados
            </label>
          </div>
          <div class="filters-scroll">
            ${["TODOS","Backbone down","Telefonia","Rompi","Tarefa","Ocorrência"].map(n=>`<button class="filter-chip ${this.filterCat===n?"active":""}" data-filter="${n}">${n} (${n==="TODOS"?this.data.length:a[n]||0})</button>`).join("")}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${s.pendente||0}</span> Pendentes</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--violet)">${s.outros||0}</span> Em andamento</div>
      </div>

      <div class="cards-list">
        ${t.length===0?`
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <h3>Nenhum incidente encontrado</h3><p>Ajuste os filtros</p>
          </div>`:t.map((n,o)=>this._renderCard(n,o)).join("")}
      </div>
    `,this.container.querySelectorAll(".filter-chip[data-filter]").forEach(n=>{n.addEventListener("click",()=>{this.filterCat=n.dataset.filter,this.render(e)})}),this.container.querySelectorAll(".action-btn-edit").forEach(n=>{n.addEventListener("click",()=>{const o=parseInt(n.dataset.idx),r=this.data.filter(l=>{const d=this.filterCat==="TODOS"||(l["Origem / Categoria"]||"").toUpperCase().includes(this.filterCat.toUpperCase()),c=(l.Status||"").toUpperCase(),p=this.ocultarNormalizados?!c.includes("NORMALIZADO")&&!c.includes("CONCLUÍDO"):!0;return d&&p});r[o]&&this._editCallback&&this._editCallback("incidentes",r[o])})})}_renderCard(e,t){const a=this._getCatBadge(e["Origem / Categoria"]||""),i=this._getStatusBadge(e.Status||"");return`
      <div class="data-card" style="animation-delay: ${t*30}ms">
        <div class="data-card-header">
          <div class="data-card-title">${u(e["Título do Chamado / Trecho"]||"Sem título")}</div>
          ${i}
        </div>
        <div class="data-card-meta">
          ${a}
          <span class="meta-tag">📝 ${u(e["Task ID"]||"-")}</span>
          <span class="meta-tag">🔗 ${u(e.Incidente||"-")}</span>
        </div>
        <div class="data-card-body">
          ${e["Diagnóstico / Problema"]&&e["Diagnóstico / Problema"]!=="-"?`<div class="field"><span class="field-label">Diagnóstico: </span>${u(e["Diagnóstico / Problema"])}</div>`:""}
          <div class="field"><span class="field-label">Responsável: </span>${u(e["Responsável Técnico"]||"A Definir")}</div>
          ${e.Observações?`<div class="field"><span class="field-label">Obs: </span>${u(e.Observações)}</div>`:""}
        </div>
        <div class="data-card-footer">
          <div class="data-card-actions">
            ${A("incidentes")?`<button class="action-btn action-btn-edit" data-idx="${t}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>`:""}
          </div>
        </div>
      </div>
    `}_getCatBadge(e){const t=e.toUpperCase();return t.includes("BACKBONE")?'<span class="badge badge-backbone">Backbone</span>':t.includes("CAIXA")?'<span class="badge badge-caixa">Caixa</span>':t.includes("TELEFONIA")?'<span class="badge badge-telefonia">Telefonia</span>':t.includes("POP")?'<span class="badge badge-pop">POP</span>':'<span class="badge badge-tarefas">Tarefa</span>'}_getStatusBadge(e){const t=e.toUpperCase();return t.includes("NORMALIZADO")?'<span class="badge badge-normalizado">Normalizado</span>':t.includes("PENDENTE")?'<span class="badge badge-pendente">Pendente</span>':t.includes("DESIGNADO")?'<span class="badge badge-designado">Designado</span>':t.includes("VALIDAÇÃO")||t.includes("VALIDACAO")?'<span class="badge badge-validacao">Validação</span>':`<span class="badge" style="background:var(--panel);color:var(--muted)">${u(e)}</span>`}_countByField(e){const t={};return this.data.forEach(a=>{const i=(a[e]||"Outros").trim();t[i]=(t[i]||0)+1}),t}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">⚡ Incidentes</h2></div></div>
      ${Array(4).fill('<div class="skeleton skeleton-card"></div>').join("")}
    `)}},gt=class{constructor(){this.container=null,this.data=[],this.filterExec="ABERTOS",this.searchTerm="",this._editCallback=null}setEditCallback(e){this._editCallback=e}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.vistorias||[];const t=this.data.filter(s=>{const n=(s["Status Execução (Manual)"]||"Pendente").toUpperCase();let o=!1;if(this.filterExec==="TODOS"?o=!0:this.filterExec==="ABERTOS"?o=!n.includes("CONCLUÍDO")&&!n.includes("CONCLUIDO"):o=n.includes(this.filterExec.toUpperCase()),!this.searchTerm)return o;const r=this.searchTerm.toLowerCase(),l=[s["Nº Vistoria"],s.Cidade,s.Endereço,s["Técnico Responsável (Manual)"]].join(" ").toLowerCase();return o&&l.includes(r)}),a={Concluído:0,Pendente:0,"Não Realizado":0};this.data.forEach(s=>{const n=(s["Status Execução (Manual)"]||"Pendente").trim();n&&(a[n]=(a[n]||0)+1)});const i={};t.forEach(s=>{const n=s["Data Agendada"]||"Sem data";i[n]||(i[n]=[]),i[n].push(s)}),this.container.innerHTML=`
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">🔍 Vistorias Técnicas</h2>
          <p class="module-subtitle">Acompanhamento e emissão de laudos — ${this.data.length} vistorias</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="vistoria-search" placeholder="Buscar Nº, endereço..." value="${u(this.searchTerm)}">
            </div>
          </div>
          <div class="filters-scroll">
            ${["ABERTOS","TODOS","Concluído","Pendente","Não Realizado"].map(s=>{const n=this.filterExec===s?"active":"";let o=0;return s==="TODOS"?o=this.data.length:s==="ABERTOS"?o=this.data.filter(r=>{const l=(r["Status Execução (Manual)"]||"").toUpperCase();return!l.includes("CONCLUÍDO")&&!l.includes("CONCLUIDO")}).length:o=a[s]||0,`<button class="filter-chip ${n}" data-filter="${s}">${s} (${o})</button>`}).join("")}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${this.data.length}</span> Total</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${a.Concluído||0}</span> Concluídas</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${a.Pendente||a[""]||0}</span> Pendentes</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--coral)">${a["Não Realizado"]||0}</span> Não Realizadas</div>
      </div>

      ${Object.keys(i).length===0?`
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <h3>Nenhuma vistoria encontrada</h3><p>Ajuste os filtros</p>
        </div>`:Object.entries(i).map(([s,n])=>`
          <div class="date-group">
            <div class="date-group-header">
              <span class="date-group-label">📅 ${u(s)}</span>
              <span class="date-group-count">${n.length} vistoria${n.length>1?"s":""}</span>
            </div>
            <div class="cards-list">
              ${n.map((o,r)=>this._renderCard(o,r)).join("")}
            </div>
          </div>
        `).join("")}
    `,this.container.querySelectorAll(".filter-chip[data-filter]").forEach(s=>{s.addEventListener("click",()=>{this.filterExec=s.dataset.filter,this.render(e)})}),this.container.querySelectorAll(".action-btn-edit").forEach(s=>{s.addEventListener("click",()=>{const n=parseInt(s.dataset.idx),o=this.data.filter(r=>{const l=(r["Status Execução (Manual)"]||"Pendente").toUpperCase();return this.filterExec==="TODOS"?!0:this.filterExec==="ABERTOS"?!l.includes("CONCLUÍDO")&&!l.includes("CONCLUIDO"):l.includes(this.filterExec.toUpperCase())});o[n]&&this._editCallback&&this._editCallback("vistorias",o[n])})})}_renderCard(e,t){const a=(e["Tipo de Vistoria"]||"").toUpperCase().includes("CONECTOR")?'<span class="badge badge-conectorizado">Conectorizado</span>':'<span class="badge badge-mono">Mono</span>',i=e["Status Execução (Manual)"]||"",s=this._getExecBadge(i);return`
      <div class="data-card" style="animation-delay: ${t*30}ms">
        <div class="data-card-header">
          <div class="data-card-title">${u(e["Razão Social / Cliente"]||"Sem nome")}</div>
          ${s}
        </div>
        <div class="data-card-meta">
          ${a}
          <span class="meta-tag">🕐 ${u(e["Período / Horário"]||"HC")}</span>
          <span class="meta-tag">📄 ${u(e["Contrato / Protocolo"]||"-")}</span>
          <span class="meta-tag">📍 ${u(e["Localidade (Bairro/RJ)"]||"-")}</span>
        </div>
        <div class="data-card-body">
          <div class="field"><span class="field-label">Atendente: </span>${u(e.Atendente||"-")}</div>
          <div class="field"><span class="field-label">Status: </span>${u(e["Status da Vistoria"]||"-")}</div>
          ${e["ADM / Restrição"]&&e["ADM / Restrição"]!=="NÃO"?`<div class="field"><span class="field-label">ADM: </span>${u(e["ADM / Restrição"])}</div>`:""}
          <div class="field"><span class="field-label">Responsável: </span>${u(e["Responsável pela vistoria (Manual)"]||"A Definir")}</div>
          ${e["Observações / Contato de Acompanhamento"]&&e["Observações / Contato de Acompanhamento"]!=="-"?`<div class="field"><span class="field-label">Obs: </span>${u(e["Observações / Contato de Acompanhamento"]).substring(0,200)}${(e["Observações / Contato de Acompanhamento"]||"").length>200?"...":""}</div>`:""}
          ${e["Observação geral (Manual)"]?`<div class="field"><span class="field-label">Nota: </span>${u(e["Observação geral (Manual)"])}</div>`:""}
        </div>
        <div class="data-card-footer">
          <div class="data-card-actions">
            ${e.Endereço?`<a href="https://www.google.com/maps/search/${encodeURIComponent(e.Endereço+" "+(e.Cidade||"RJ"))}" target="_blank" class="action-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Maps
            </a>`:""}
            ${A("vistorias")?`<button class="action-btn action-btn-edit" data-idx="${t}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>`:""}
          </div>
        </div>
      </div>
    `}_getExecBadge(e){const t=(e||"").toUpperCase();return t.includes("CONCLUÍDO")||t.includes("CONCLUIDO")?'<span class="badge badge-concluido">Concluído</span>':t.includes("NÃO REALIZADO")||t.includes("NAO REALIZADO")?'<span class="badge badge-nao-realiz">Não Realizado</span>':t.includes("PARCIAL")?'<span class="badge badge-validacao">Parcial</span>':t.includes("PENDENTE")||!t?'<span class="badge badge-pendente">Pendente</span>':`<span class="badge" style="background:var(--panel);color:var(--muted)">${u(e)}</span>`}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">🔍 Vistorias RJ</h2></div></div>
      ${Array(5).fill('<div class="skeleton skeleton-card"></div>').join("")}
    `)}},bt=class{constructor(){this.container=null,this.data=[],this.filterExec="ABERTOS",this.searchTerm="",this._editCallback=null}setEditCallback(e){this._editCallback=e}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.infra||[];const t=this.data.filter(s=>{const n=(s["Status Execução (Manual)"]||"").toUpperCase();let o=!1;if(this.filterExec==="TODOS"?o=!0:this.filterExec==="ABERTOS"?o=!n.includes("CONCLUÍDO")&&!n.includes("CONCLUIDO"):o=n.includes(this.filterExec.toUpperCase()),!this.searchTerm)return o;const r=this.searchTerm.toLowerCase(),l=[s["Nº Vistoria Vinculada"],s["Tipo de Ocorrência"],s.Endereço,s["Técnico / Equipe"]].join(" ").toLowerCase();return o&&l.includes(r)}),a={Concluído:0,Parcial:0,Pendente:0};this.data.forEach(s=>{const n=(s["Status Execução (Manual)"]||"Pendente").trim();n&&(a[n]=(a[n]||0)+1)});const i={};t.forEach(s=>{const n=s["Data Agendada"]||"Sem data";i[n]||(i[n]=[]),i[n].push(s)}),this.container.innerHTML=`
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">🏗️ Infraestrutura</h2>
          <p class="module-subtitle">Obras e passagem de cabos — ${this.data.length} registros</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="infra-search" placeholder="Buscar Nº, endereço..." value="${u(this.searchTerm)}">
            </div>
          </div>
          <div class="filters-scroll">
            ${["ABERTOS","TODOS","Concluído","Parcial","Pendente"].map(s=>{const n=this.filterExec===s?"active":"";let o=0;return s==="TODOS"?o=this.data.length:s==="ABERTOS"?o=this.data.filter(r=>{const l=(r["Status Execução (Manual)"]||"").toUpperCase();return!l.includes("CONCLUÍDO")&&!l.includes("CONCLUIDO")}).length:o=a[s]||0,`<button class="filter-chip ${n}" data-filter="${s}">${s} (${o})</button>`}).join("")}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${this.data.length}</span> Total</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${a.Concluído||0}</span> Concluídas</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${a.Parcial||0}</span> Parciais</div>
      </div>

      ${Object.keys(i).length===0?`
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          <h3>Nenhuma atividade de infra</h3><p>Ajuste os filtros</p>
        </div>`:Object.entries(i).map(([s,n])=>`
          <div class="date-group">
            <div class="date-group-header">
              <span class="date-group-label">📅 ${u(s)}</span>
              <span class="date-group-count">${n.length} atividade${n.length>1?"s":""}</span>
            </div>
            <div class="cards-list">
              ${n.map((o,r)=>this._renderCard(o,r)).join("")}
            </div>
          </div>
        `).join("")}
    `,this.container.querySelectorAll(".filter-chip[data-filter]").forEach(s=>{s.addEventListener("click",()=>{this.filterExec=s.dataset.filter,this.render(e)})}),this.container.querySelectorAll(".action-btn-edit").forEach(s=>{s.addEventListener("click",()=>{const n=parseInt(s.dataset.idx),o=this.data.filter(r=>{const l=(r["Status Execução (Manual)"]||"").toUpperCase();return this.filterExec==="TODOS"?!0:this.filterExec==="ABERTOS"?!l.includes("CONCLUÍDO")&&!l.includes("CONCLUIDO"):l.includes(this.filterExec.toUpperCase())});o[n]&&this._editCallback&&this._editCallback("infra",o[n])})})}_renderCard(e,t){const a=(e["Tipo de Atividade"]||"").toUpperCase().includes("CONECTOR")?'<span class="badge badge-conectorizado">Conectorizado</span>':'<span class="badge badge-mono">Mono</span>',i=e["Status Execução (Manual)"]||"",s=this._getExecBadge(i),n=e["Materiais Necessários"]||"",o=n&&n!=="NÃO";return`
      <div class="data-card" style="animation-delay: ${t*30}ms">
        <div class="data-card-header">
          <div class="data-card-title">${u(e["Razão Social / Cliente"]||"Sem nome")}</div>
          ${s}
        </div>
        <div class="data-card-meta">
          ${a}
          <span class="meta-tag">🕐 ${u(e["Período / Horário"]||"HC")}</span>
          <span class="meta-tag">📄 ${u(e["Contrato / Protocolo"]||"-")}</span>
          <span class="meta-tag">📍 ${u(e["Localidade (Bairro/RJ)"]||"-")}</span>
          ${o?`<span class="meta-tag" style="color:var(--amber)">🔧 ${u(n)}</span>`:""}
        </div>
        <div class="data-card-body">
          <div class="field"><span class="field-label">Atendente: </span>${u(e.Atendente||"-")}</div>
          <div class="field"><span class="field-label">Detalhes: </span>${u(e["Detalhes Atendimento"]||"-")}</div>
          ${e["ADM / Restrição"]&&e["ADM / Restrição"]!=="NÃO"?`<div class="field"><span class="field-label">ADM: </span>${u(e["ADM / Restrição"])}</div>`:""}
          <div class="field"><span class="field-label">Responsável: </span>${u(e["Responsável pela infra (Manual)"]||"A Definir")}</div>
          ${e.Observações?`<div class="field"><span class="field-label">Obs: </span>${u(e.Observações).substring(0,200)}</div>`:""}
          ${e["Observação geral (Manual)"]?`<div class="field"><span class="field-label">Nota: </span>${u(e["Observação geral (Manual)"])}</div>`:""}
        </div>
        <div class="data-card-footer">
          <div class="data-card-actions">
            ${e.Endereço?`<a href="https://www.google.com/maps/search/${encodeURIComponent(e.Endereço+" "+(e["Localidade (Bairro/RJ)"]||"RJ"))}" target="_blank" class="action-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Maps
            </a>`:""}
            ${A("infra")?`<button class="action-btn action-btn-edit" data-idx="${t}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>`:""}
          </div>
        </div>
      </div>
    `}_getExecBadge(e){const t=(e||"").toUpperCase();return t.includes("CONCLUÍDO")||t.includes("CONCLUIDO")?'<span class="badge badge-concluido">Concluído</span>':t.includes("NÃO REALIZADO")||t.includes("NAO REALIZADO")?'<span class="badge badge-nao-realiz">Não Realizado</span>':t.includes("PARCIAL")?'<span class="badge badge-validacao">Parcial</span>':t.includes("PENDENTE")||!t?'<span class="badge badge-pendente">Pendente</span>':`<span class="badge" style="background:var(--panel);color:var(--muted)">${u(e)}</span>`}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">🏗️ Infraestrutura RJ</h2></div></div>
      ${Array(5).fill('<div class="skeleton skeleton-card"></div>').join("")}
    `)}},yt=class{constructor(){this.container=null,this.data=[]}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.pops||[];const t=this.data.reduce((o,r)=>o+(parseInt(r.Assinantes)||0),0),a=this.data.reduce((o,r)=>{const l=(r["Receita Mensal (R$)"]||"").replace("R$","").replace(/\./g,"").replace(",",".").trim();return o+(parseFloat(l)||0)},0),i=this.data.filter(o=>(o["Peso / Prioridade"]||"").includes("P1")),s=this.data.filter(o=>(o["Peso / Prioridade"]||"").includes("P2")),n=this.data.filter(o=>(o["Peso / Prioridade"]||"").includes("P3"));this.container.innerHTML=`
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📡 POPs & Preventivas</h2>
          <p class="module-subtitle">Estações ativas e cronograma de manutenção preventiva</p>
        </div>
      </div>

      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card sky">
          <div class="kpi-label">Total POPs</div>
          <div class="kpi-value">${this.data.length}</div>
        </div>
        <div class="kpi-card coral">
          <div class="kpi-label">POPs Críticos (P1)</div>
          <div class="kpi-value">${i.length}</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-label">Assinantes</div>
          <div class="kpi-value">${t.toLocaleString("pt-BR")}</div>
        </div>
        <div class="kpi-card teal">
          <div class="kpi-label">Receita Protegida</div>
          <div class="kpi-value" style="font-size:22px;">R$ ${a.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div>
        </div>
      </div>

      ${this._renderSection("🔴 Prioridade P1 — CRÍTICA",i)}
      ${this._renderSection("🟡 Prioridade P2 — ALTA",s)}
      ${this._renderSection("🟢 Prioridade P3 — PADRÃO",n)}
    `}_renderSection(e,t){return t.length?`
      <h3 style="font-size:14px; font-weight:700; margin: 20px 0 12px; color:var(--text);">${e}</h3>
      <div class="cards-grid" style="margin-bottom: 16px;">
        ${t.map((a,i)=>this._renderPOPCard(a,i)).join("")}
      </div>
    `:""}_renderPOPCard(e,t){const a=(e["Peso / Prioridade"]||"").toUpperCase(),i=a.includes("P1")?"badge-p1":a.includes("P2")?"badge-p2":"badge-p3",s=(e["Tecnologia Principal"]||"").toUpperCase().includes("FIBRA")?'<span class="badge badge-conectorizado">Fibra Óptica</span>':'<span class="badge badge-mono">Rádio / RF</span>',n=e["Endereço Completo"]||"",o=`https://www.google.com/maps/search/${encodeURIComponent(n)}`,r=e["Receita Mensal (R$)"]||"R$ 0,00";return`
      <div class="pop-card" style="animation: slideUp 0.4s var(--ease-out) ${t*50}ms both;">
        <div class="pop-card-header">
          <div>
            <span class="pop-sigla">${u(e.Sigla||"-")}</span>
            <div style="font-size:13px; font-weight:600; color:var(--text); margin-top:2px;">
              ${u(e["Nome do POP / Estação"]||"-")}
            </div>
            <div style="font-size:11px; color:var(--muted); margin-top:2px;">
              ${u(e["Região / Município"]||"-")}
            </div>
          </div>
          <span class="badge ${i}">${u(e["Peso / Prioridade"]||"-")}</span>
        </div>

        <div class="data-card-meta" style="margin-bottom:10px;">
          ${s}
          <span class="meta-tag">${u(e["Frequência Preventiva"]||"-")}</span>
          <span class="meta-tag" style="color:${e["Status Preventiva"]==="Em Dia"?"var(--green)":"var(--amber)"}">${u(e["Status Preventiva"]||"-")}</span>
        </div>

        <div class="pop-info">
          <div class="pop-stat">
            <span class="pop-stat-label">Assinantes</span>
            <span class="pop-stat-value">${u(e.Assinantes||"0")}</span>
          </div>
          <div class="pop-stat">
            <span class="pop-stat-label">Receita Mensal</span>
            <span class="pop-stat-value currency">${u(r)}</span>
          </div>
          <div class="pop-stat">
            <span class="pop-stat-label">Papel na Rede</span>
            <span class="pop-stat-value" style="font-size:11px;">${u(e["Papel na Rede / Hub"]||"-")}</span>
          </div>
          <div class="pop-stat">
            <span class="pop-stat-label">Checklist</span>
            <span class="pop-stat-value" style="font-size:10px; color:var(--muted);">${u((e["Checklist Principal de Campo"]||"-").substring(0,60))}</span>
          </div>
        </div>

        <div class="data-card-footer" style="margin-top:12px; padding-top:10px; border-top:1px solid var(--line-subtle);">
          <div style="font-size:10px; color:var(--muted);">${u((e["Contrato Locação / Observações"]||"").substring(0,80))}</div>
          <a href="${o}" target="_blank" class="action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Maps
          </a>
        </div>
      </div>
    `}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">📡 POPs & Preventivas</h2></div></div>
      <div class="kpi-grid">${Array(4).fill('<div class="skeleton skeleton-kpi"></div>').join("")}</div>
      <div class="cards-grid">${Array(6).fill('<div class="skeleton skeleton-card"></div>').join("")}</div>
    `)}},Ct=class{constructor(){this.container=null,this.data=[],this.filterCat="TODOS",this.searchTerm="",this._editCallback=null}setEditCallback(e){this._editCallback=e}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.estoque||[];const t=this.data.filter(s=>{const n=(s["Categoria / Tipo"]||"").toUpperCase(),o=this.filterCat==="TODOS"||n.includes(this.filterCat.toUpperCase());if(!this.searchTerm)return o;const r=this.searchTerm.toLowerCase(),l=[s["Nº de Série / Lote"],s["Marca / Fabricante"],s.Modelo,s["Localização Física"]].join(" ").toLowerCase();return o&&l.includes(r)}),a={normal:0,alerta:0,critico:0};let i=0;this.data.forEach(s=>{const n=parseFloat(s["Qtd. em Estoque"])||0;i+=n;const o=parseFloat(s["Estoque Mínimo"])||0,r=(s["Status do Equipamento"]||"").toUpperCase();r.includes("FALTA")||n===0?a.critico++:n<=o||r.includes("ALERTA")?a.alerta++:a.normal++}),this.container.innerHTML=`
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📦 Estoque VERO</h2>
          <p class="module-subtitle">Controle de equipamentos e sobressalentes — ${this.data.length} registros</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="estoque-search" placeholder="Buscar série, modelo..." value="${u(this.searchTerm)}">
            </div>
          </div>
          <div class="filters-scroll">
            ${["TODOS","ONU","Switch","Rádio","Módulo","Cabo"].map(s=>`<button class="filter-chip ${this.filterCat===s?"active":""}" data-filter="${s}">${s}</button>`).join("")}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${i}</span> Unidades Totais</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${a.normal}</span> OK</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${a.alerta}</span> Em Alerta</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--coral)">${a.critico}</span> Falta</div>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:120px;">Nº Série / Lote</th>
              <th>Modelo / Marca</th>
              <th>Categoria</th>
              <th style="text-align:right;">Qtd</th>
              <th style="width:100px;">Status</th>
              <th>Localização</th>
              ${A("estoque")?'<th style="width:60px;">Ação</th>':""}
            </tr>
          </thead>
          <tbody>
            ${t.length===0?`<tr><td colspan="${A("estoque")?"7":"6"}" style="text-align:center; padding: 40px;"><div class="empty-state"><h3>Nenhum material encontrado</h3><p>Ajuste os filtros ou a busca</p></div></td></tr>`:t.map((s,n)=>this._renderRow(s,n)).join("")}
          </tbody>
        </table>
      </div>
    `,this._bindEvents()}_renderRow(e,t){const a=parseFloat(e["Qtd. em Estoque"])||0,i=parseFloat(e["Estoque Mínimo"])||0,s=e["Status do Equipamento"]||"",n=s.toUpperCase();let o="badge-normalizado",r=s||"OK";n.includes("FALTA")||a===0?(o="badge-cancelado",r=s||"Em Falta"):a<=i||n.includes("ALERTA")?(o="badge-atenuacao",r=s||"Atenção"):n.includes("RESERVA")||n.includes("USO")?o="badge-designado":o="badge-normalizado";const l=[e["Marca / Fabricante"],e.Modelo].filter(Boolean).join(" - ");return`
      <tr>
        <td style="font-family:var(--font-mono); font-weight:600;">${u(e["Nº de Série / Lote"]||"-")}</td>
        <td style="font-weight:500; color:var(--text);">${u(l||"-")}</td>
        <td><span class="meta-tag">${u(e["Categoria / Tipo"]||"Outros")}</span></td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:700; color:var(--text);">
          ${a}
          <div style="font-size:9px; color:var(--muted); font-weight:normal;">Mín: ${i}</div>
        </td>
        <td><span class="badge ${o}">${u(r)}</span></td>
        <td style="color:var(--text-dim); font-size:11px;">${u(e["Localização Física"]||"-")}</td>
        ${A("estoque")?`<td>
          <button class="action-btn action-btn-edit" data-idx="${t}" style="min-height:32px; padding:4px 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </td>`:""}
      </tr>
    `}_bindEvents(){const e=this.container.querySelector("#estoque-search");e&&e.addEventListener("input",t=>{this.searchTerm=t.target.value,this.render({estoque:this.data})}),this.container.querySelectorAll(".filter-chip[data-filter]").forEach(t=>{t.addEventListener("click",()=>{this.filterCat=t.dataset.filter,this.render({estoque:this.data})})}),this.container.querySelectorAll(".action-btn-edit").forEach(t=>{t.addEventListener("click",()=>{const a=parseInt(t.dataset.idx),i=this.data.filter(s=>{const n=(s["Categoria / Tipo"]||"").toUpperCase(),o=this.filterCat==="TODOS"||n.includes(this.filterCat.toUpperCase());if(!this.searchTerm)return o;const r=this.searchTerm.toLowerCase(),l=[s["Nº de Série / Lote"],s["Marca / Fabricante"],s.Modelo,s["Localização Física"]].join(" ").toLowerCase();return o&&l.includes(r)});i[a]&&this._editCallback&&this._editCallback("estoque",i[a])})})}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">📦 Estoque VERO</h2></div></div>
      <div class="data-table-wrap">
        <div style="padding:20px;">
          ${Array(5).fill('<div class="skeleton skeleton-card" style="height:40px; margin-bottom:8px;"></div>').join("")}
        </div>
      </div>
    `)}},Et="modulepreload",At=function(e){return"/"+e},ie={},xt=function(t,a,i){let s=Promise.resolve();if(a&&a.length>0){let d=function(p){return Promise.all(p.map(h=>Promise.resolve(h).then(v=>({status:"fulfilled",value:v}),v=>({status:"rejected",reason:v}))))},c=function(p){return import.meta.resolve?import.meta.resolve(p):new URL(p,import.meta.url).href};const o=document.getElementsByTagName("link"),r=document.querySelector("meta[property=csp-nonce]"),l=r?.nonce||r?.getAttribute("nonce");s=d(a.map(p=>{if(p=At(p,i),p=c(p),p in ie)return;ie[p]=!0;const h=p.endsWith(".css");for(let g=o.length-1;g>=0;g--){const b=o[g];if(b.href===p&&(!h||b.rel==="stylesheet"))return}const v=document.createElement("link");if(v.rel=h?"stylesheet":Et,h||(v.as="script"),v.crossOrigin="",v.href=p,l&&v.setAttribute("nonce",l),document.head.appendChild(v),h)return new Promise((g,b)=>{v.addEventListener("load",g),v.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${p}`)))})}))}function n(o){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=o,window.dispatchEvent(r),!r.defaultPrevented)throw o}return s.then(o=>{for(const r of o||[])r.status==="rejected"&&n(r.reason);return t().catch(n)})},Ot=class{constructor(){this.currentModule="dashboard",this.modules={dashboard:new vt,b2b:new ft,incidentes:new mt,vistorias:new gt,infra:new bt,pops:new yt,estoque:new Ct},this.moduleTitles={dashboard:"Painel Operacional",b2b:"Chamados B2B",incidentes:"Incidentes",vistorias:"Vistorias RJ",infra:"Infraestrutura",pops:"POPs & Preventivas",estoque:"Estoque VERO"},this.data=null,this.isSyncing=!1}async init(){this._initModules(),this._bindNavigation(),this._bindSyncButton(),this._createFAB(),this._initPullToRefresh(),this._updateSyncUI("loading"),Object.values(this.modules).forEach(e=>{e.renderLoading&&e.renderLoading()}),this._setupAuth(),fe(e=>{this._updatePendingBadge(e)}),this._updatePendingBadge(ve()),Be(e=>{this.data=e;const t=H();t&&(ae(e.acessos,t.email),this._handleAuthStateChanged(t)),this._renderCurrentModule(),this._updateBadges(),this._updateSyncUI("success")});try{await k()}catch(e){console.error("Failed initial fetch:",e),this._updateSyncUI("error")}_e(12e4)}_initModules(){Object.keys(this.modules).forEach(e=>{const t=document.getElementById(`module-${e}`);t&&(this.modules[e].init(t),this.modules[e].setEditCallback&&this.modules[e].setEditCallback((a,i)=>{it(a,i,this.data?.apoioListas,s=>{this._renderCurrentModule(),V("Sincronizando com a planilha..."),w()})}))})}_bindNavigation(){const e=document.querySelectorAll(".nav-item, .mobile-nav-item");e.forEach(t=>{t.addEventListener("click",a=>{a.preventDefault(),e.forEach(o=>o.classList.remove("active"));const i=t.dataset.target;document.querySelectorAll(`[data-target="${i}"]`).forEach(o=>{o.classList.add("active")}),this.currentModule=i;const s=document.getElementById("header-page-title");s&&(s.textContent=this.moduleTitles[i]||"VERO Operações"),document.querySelectorAll(".module-view").forEach(o=>{o.classList.remove("active")});const n=document.getElementById(`module-${i}`);n&&n.classList.add("active"),this._renderCurrentModule(),this._updateFABVisibility()})})}_bindSyncButton(){const e=document.getElementById("btn-force-sync");e&&e.addEventListener("click",async()=>{if(!this.isSyncing){this.isSyncing=!0,this._updateSyncUI("loading");try{await k(!0),w()}catch(t){console.error("Sync failed:",t),this._updateSyncUI("error")}finally{this.isSyncing=!1}}})}_renderCurrentModule(){if(!this.data)return;const e=this.modules[this.currentModule];e&&e.render&&e.render(this.data)}_updateBadges(){if(!this.data)return;const e=document.getElementById("badge-b2b");if(e&&this.data.chamadosB2B){const a=this.data.chamadosB2B.filter(i=>{const s=(i["Status / Andamento"]||"").toUpperCase();return!s.includes("NORMALIZADO")&&!s.includes("CANCELADO")}).length;e.textContent=a,e.style.display=a>0?"inline-block":"none"}const t=document.getElementById("badge-incidentes");if(t&&this.data.incidentes){const a=this.data.incidentes.filter(i=>{const s=(i.Status||"").toUpperCase();return s.includes("PENDENTE")||s.includes("VALIDAÇÃO")||s.includes("VALIDACAO")}).length;t.textContent=a,t.style.display=a>0?"inline-block":"none"}}_updateSyncUI(e){const t=document.getElementById("sync-status"),a=document.getElementById("sync-text"),i=document.getElementById("btn-force-sync");!t||!a||!i||(t.className="sync-indicator",i.classList.remove("loading"),e==="loading"?(t.classList.add("loading"),a.textContent="Sincronizando...",i.classList.add("loading")):e==="success"?(a.textContent="Atualizado agora",setTimeout(()=>{this.isSyncing||(a.textContent="Sincronizado")},5e3)):e==="error"&&(t.classList.add("error"),a.textContent="Modo Offline"))}_updatePendingBadge(e){let t=document.getElementById("pending-badge");if(e>0){if(!t){t=document.createElement("div"),t.id="pending-badge",t.className="pending-sync-badge";const a=document.querySelector(".header-right");a&&a.prepend(t)}t.innerHTML=`
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27"/>
        </svg>
        ${e} pendente${e>1?"s":""}
      `,t.style.display="flex"}else t&&(t.style.display="none")}_setupAuth(){Ue(),He(h=>this._handleAuthStateChanged(h));const e=document.getElementById("nebula-login-btn"),t=document.getElementById("nebula-email"),a=document.getElementById("nebula-password"),i=document.getElementById("nebula-name"),s=document.getElementById("nebula-group-name"),n=document.getElementById("nebula-tab-login"),o=document.getElementById("nebula-tab-register"),r=document.getElementById("nebula-tab-marker"),l=document.getElementById("nebula-error");let d=!1;const c=h=>{d=h==="register",l.style.display="none",d?(n.style.opacity="0.5",n.classList.remove("active"),o.style.opacity="1",o.classList.add("active"),r.style.left="calc(50% + 4px)",s.style.display="flex",e.textContent="CREATE ACCOUNT"):(o.style.opacity="0.5",o.classList.remove("active"),n.style.opacity="1",n.classList.add("active"),r.style.left="4px",s.style.display="none",e.textContent="LOGIN")};n&&o&&(n.addEventListener("click",()=>c("login")),o.addEventListener("click",()=>c("register")));const p=async()=>{const h=t.value.trim(),v=a.value.trim();if(!(!h||!v)){if(!this.data||!this.data.acessos){x("Aguarde os dados carregarem...");return}if(d){const g=i.value.trim();if(!g){l.textContent="Preencha seu nome completo.",l.style.display="block";return}if(this.data.acessos.find(b=>(b.Email||"").trim().toLowerCase()===h.toLowerCase())){l.textContent="Este e-mail já está cadastrado.",l.style.display="block";return}e.disabled=!0,e.textContent="ENVIANDO...";try{const{enqueueWrite:b}=await xt(async()=>{const{enqueueWrite:T}=await Promise.resolve().then(()=>Xe);return{enqueueWrite:T}},void 0),Ce=this.data.acessos[0]||{Nome:"",Email:"",Perfil:"",Senha:""},X=Object.keys(Ce).filter(T=>T!=="_rowIndex"),Ee=X.map(T=>{const D=T.toLowerCase();return D.includes("nome")?g:D.includes("email")?h:D.includes("senha")?v:D.includes("perfil")?"PENDENTE":""});b("append",{sheetName:"Acessos",rowData:X.length>0?Ee:[g,h,"PENDENTE",v]}),q("Solicitação enviada! Aguarde a aprovação do administrador."),c("login"),a.value="",i.value=""}catch(b){console.error(b),x("Erro ao solicitar acesso.")}finally{e.disabled=!1,e.textContent="LOGIN"}}else qe(h,v,this.data.acessos)||(l.textContent="E-mail ou senha incorretos.",l.style.display="block")}};if(e){e.addEventListener("click",p);const h=v=>{v.key==="Enter"&&p()};t.addEventListener("keypress",h),a.addEventListener("keypress",h)}this._handleAuthStateChanged(H())}_handleAuthStateChanged(e){const t=document.getElementById("user-profile-container");if(t)if(e){this.data&&this.data.acessos&&ae(this.data.acessos,e.email),this._applyRBAC(e);const a=Je();t.innerHTML=`
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <img src="${e.picture}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--teal);">
          <div>
            <div style="font-size: 14px; font-weight: 600; color: var(--text);">${e.name}</div>
            <div style="font-size: 10px; color: var(--teal); background: var(--teal-dim); padding: 2px 10px; border-radius: 12px; margin-top: 4px; text-align: center; font-weight: 600;">${a}</div>
          </div>
          <button id="logout-btn" style="background: none; border: none; color: var(--coral); font-size: 12px; cursor: pointer; margin-top: 4px; padding: 4px;">Sair</button>
        </div>
      `,document.getElementById("logout-btn").addEventListener("click",()=>Fe());const i=document.getElementById("nebula-login-overlay");i&&i.classList.add("hidden")}else{t.innerHTML="",this._applyRBAC(null);const a=document.getElementById("nebula-login-overlay");a&&(a.classList.remove("hidden"),document.getElementById("nebula-error").style.display="none",document.getElementById("nebula-password").value="")}}_applyRBAC(e){const t=document.querySelectorAll(".nav-item, .mobile-nav-item");if(!e){t.forEach(i=>{i.style.display=i.dataset.target==="dashboard"?"flex":"none"});return}const a=re();if(t.forEach(i=>{const s=i.dataset.target;i.style.display=a.includes(s)?"flex":"none"}),!a.includes(this.currentModule)){const i=Ke();if(i){const s=Array.from(t).find(n=>n.dataset.target===i);s&&s.click()}}this._updateFABVisibility()}_createFAB(){const e=document.createElement("button");e.className="fab",e.id="fab-create",e.innerHTML=`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    `,e.style.display="none",e.addEventListener("click",()=>{this.data&&ct(this.currentModule,this.data.apoioListas,()=>{V("Sincronizando novo registro..."),w(),setTimeout(()=>k(),2e3)})}),document.body.appendChild(e)}_updateFABVisibility(){const e=document.getElementById("fab-create");if(!e)return;const t=oe(this.currentModule);e.style.display=t?"flex":"none"}_initPullToRefresh(){const e=document.querySelector(".app-content");if(!e)return;let t=0,a=!1,i=null;e.addEventListener("touchstart",s=>{e.scrollTop<=0&&(t=s.touches[0].clientY,a=!0)},{passive:!0}),e.addEventListener("touchmove",s=>{if(!a)return;const n=s.touches[0].clientY-t;n>0&&n<120&&(i||(i=document.createElement("div"),i.className="pull-refresh-indicator",i.innerHTML=`
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" style="width:20px;height:20px">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27"/>
            </svg>
            <span>Solte para atualizar</span>
          `,e.prepend(i)),i.style.opacity=Math.min(1,n/80),i.style.transform=`translateY(${n/2}px)`)},{passive:!0}),e.addEventListener("touchend",async()=>{if(!a||!i){a=!1;return}if(a=!1,parseFloat(i.style.transform.match(/translateY\((.+)px\)/)?.[1]||0)>40){i.innerHTML='<div class="btn-spinner"></div><span>Atualizando...</span>';try{await k(!0),w()}catch(s){console.error("Pull refresh failed:",s)}}i&&(i.remove(),i=null)})}};document.addEventListener("DOMContentLoaded",()=>{window.app=new Ot,window.app.init()});
