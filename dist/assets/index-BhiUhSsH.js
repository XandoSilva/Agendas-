var W=Object.defineProperty,xe=(e,t)=>{let a={};for(var s in e)W(a,s,{get:e[s],enumerable:!0});return t||W(a,Symbol.toStringTag,{value:"Module"}),a};(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function a(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=a(i);fetch(i.href,n)}})();var Se="https://docs.google.com/spreadsheets/d/e/2PACX-1vQW2W-bMXbTD8M-HcIVsXNuodovb-wBPEQ677zxaNMjyYOr3fax9ZkTapHAPukpHfABbwQ_ywiVb1gt/pub?output=csv",A={VISAO_GERAL:{gid:"113587035",name:"📊 Visão Geral",key:"visao_geral"},APOIO_LISTAS:{gid:"1236509559",name:"⚙️ Apoio & Listas",key:"apoio_listas"},CHAMADOS_B2B:{gid:"2005931044",name:"Chamados B2B",key:"chamados_b2b"},INCIDENTES:{gid:"1386014215",name:"Incidentes",key:"incidentes"},VISTORIAS_RJ:{gid:"1475053554",name:"Vistorias RJ",key:"vistorias_rj"},INFRA_RJ:{gid:"170808402",name:"Infra RJ",key:"infra_rj"},POPS:{gid:"705477249",name:"POPs & Preventivas",key:"pops"},DADOS_ACESSO:{gid:"384155401",name:"Dados de acesso",key:"dados_acesso"},LOGISTICA:{gid:"1088075983",name:"Logística Reversa",key:"logistica"},ESTOQUE:{gid:"738843736",name:"Estoque Disponível",key:"estoque"},ACESSOS:{gid:"1550019024",name:"Acessos",key:"acessos"}},ee="vero_cache_",we="vero_ts_",M=[],_=null,Oe=null;function Ie(e){const t=[];let a=[],s="",i=!1;for(let n=0;n<e.length;n++){const o=e[n],r=e[n+1];i?o==='"'&&r==='"'?(s+='"',n++):o==='"'?i=!1:s+=o:o==='"'?i=!0:o===","?(a.push(s.trim()),s=""):o===`
`?(a.push(s.trim()),a.some(l=>l!=="")&&t.push(a),a=[],s=""):o==="\r"||(s+=o)}return a.push(s.trim()),a.some(n=>n!=="")&&t.push(a),t}function $(e,t=0){if(e.length<=t+1)return[];const a=e[t].map(i=>i.replace(/\n/g," ").replace(/\s+/g," ").trim()),s=[];for(let i=t+1;i<e.length;i++){const n=e[i];if(n.length<2||(n[0]||"").toUpperCase().includes("TOTAL"))continue;const o={_rowIndex:i+1};for(let r=0;r<a.length;r++)o[a[r]]=n[r]||"";s.push(o)}return s}async function E(e){const t=`${Se}&gid=${e.gid}`;try{const a=await fetch(t);if(!a.ok)throw new Error(`HTTP ${a.status}`);const s=Ie(await a.text());try{localStorage.setItem(ee+e.key,JSON.stringify(s)),localStorage.setItem(we+e.key,Date.now().toString())}catch{console.warn("Cache overflow, cleaning old data")}return s}catch(a){console.error(`Erro ao buscar aba "${e.name}":`,a);const s=localStorage.getItem(ee+e.key);return s?(console.log(`Usando cache local para "${e.name}"`),JSON.parse(s)):[]}}async function $e(){const e=await E(A.CHAMADOS_B2B),t=e.findIndex(a=>(a[0]||"").includes("Dt. Abertura"));return t===-1?[]:$(e,t)}async function Le(){const e=await E(A.INCIDENTES),t=e.findIndex(a=>(a[0]||"").includes("Origem"));return t===-1?[]:$(e,t)}async function Te(){const e=await E(A.VISTORIAS_RJ),t=e.findIndex(a=>(a[0]||"").includes("Data Agendada"));return t===-1?[]:$(e,t)}async function De(){const e=await E(A.INFRA_RJ),t=e.findIndex(a=>(a[0]||"").includes("Data Agendada"));return t===-1?[]:$(e,t)}async function Ne(){const e=await E(A.POPS),t=e.findIndex(a=>(a[0]||"").includes("Sigla"));return t===-1?[]:$(e,t)}async function ke(){const e=await E(A.ESTOQUE),t=e.findIndex(a=>(a[0]||"").includes("Categoria"));return t===-1?[]:$(e,t)}async function Re(){const e=await E(A.APOIO_LISTAS);if(e.length<2)return{};const t=e[0],a={};return t.forEach((s,i)=>{if(s){a[s]=[];for(let n=1;n<e.length;n++)e[n][i]&&a[s].push(e[n][i])}}),a}async function Me(){const e=await E(A.ACESSOS),t=e.findIndex(a=>a.some(s=>typeof s=="string"&&s.toLowerCase().replace("-","").includes("email")));return t===-1?(console.warn('[Sheets] Aba Acessos não encontrada ou sem header "Email"'),[]):$(e,t)}async function _e(){const e=await E(A.VISAO_GERAL),t={},a=e.findIndex(l=>(l[0]||"").includes("TOTAL B2B"));if(a>=0&&e[a+1]){e[a];const l=e[a+1];t.totalB2B=parseInt(l[0])||0,t.totalIncidentes=parseInt(l[2])||0,t.totalVistorias=parseInt(l[4])||0,t.totalInfra=parseInt(l[6])||0}const s=e.findIndex(l=>(l[0]||"").includes("B2B NORMALIZADOS"));if(s>=0&&e[s+1]){const l=e[s+1];t.b2bNormalizados=parseInt(l[0])||0,t.incidentesConcluidos=parseInt(l[2])||0,t.vistoriasConcluidas=parseInt(l[4])||0,t.infraConcluidas=parseInt(l[6])||0}const i=e.findIndex(l=>(l[0]||"").includes("Técnico / Responsável")),n=[];if(i>=0)for(let l=i+1;l<e.length;l++){const d=e[l];!d[0]||d[0].includes("TOTAL")||n.push({tecnico:d[0],b2bAtrib:parseInt(d[1])||0,b2bConcl:parseInt(d[2])||0,incAtrib:parseInt(d[3])||0,incConcl:parseInt(d[4])||0,vistAtrib:parseInt(d[5])||0,vistConcl:parseInt(d[6])||0,infraAtrib:parseInt(d[7])||0,infraConcl:parseInt(d[8])||0,totalAtrib:parseInt(d[9])||0,totalConcl:parseInt(d[10])||0,eficacia:d[11]||"0%"})}const o=e.findIndex(l=>(l[0]||"").includes("Período:")),r={};return o>=0&&(r.periodo=e[o][1]||"GERAL",r.tecnico=e[o][3]||"TODOS",r.dtInicio=e[o][5]||"",r.dtFim=e[o][7]||""),{kpis:t,produtividade:n,filtros:r}}async function k(){const e=Date.now(),[t,a,s,i,n,o,r,l,d]=await Promise.all([_e(),$e(),Le(),Te(),De(),Ne(),ke(),Re(),Me()]);Oe=new Date;const c=Date.now()-e;console.log(`[Sheets] Todos os dados carregados em ${c}ms (${d.length} perfis de acesso)`);const p={visaoGeral:t,chamadosB2B:a,incidentes:s,vistorias:i,infra:n,pops:o,estoque:r,apoioListas:l,acessos:d};return M.forEach(h=>h(p)),p}function Pe(e=12e4){Be(),_=setInterval(()=>{k().catch(t=>console.error("[Sheets] Auto-refresh failed:",t))},e)}function Be(){_&&(clearInterval(_),_=null)}function Ue(e){return M.push(e),()=>{M=M.filter(t=>t!==e)}}function u(e){return e==null?"":String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}var D=null,oe=[];function qe(){const e=localStorage.getItem("vero_user");e&&(D=JSON.parse(e),Q())}function Fe(e,t,a){if(!a||a.length===0)return!1;const s=e.trim().toLowerCase(),i=a.find(n=>(n.Email||"").trim().toLowerCase()===s);return i&&i.Senha&&i.Senha.toString()===t?(D={email:i.Email,name:i.Nome||s.split("@")[0],picture:`https://ui-avatars.com/api/?name=${encodeURIComponent(i.Nome||s)}&background=14b8a6&color=fff`,role:i.Perfil||"VISUALIZADOR"},localStorage.setItem("vero_user",JSON.stringify(D)),Q(),!0):!1}function He(){D=null,localStorage.removeItem("vero_user"),Q()}function V(){return D}function ze(e){oe.push(e)}function Q(){oe.forEach(e=>e(D))}var te={ADMIN:{dashboard:{view:!0,edit:!1},b2b:{view:!0,edit:!0,create:!0},incidentes:{view:!0,edit:!0,create:!0},vistorias:{view:!0,edit:!0,create:!0},infra:{view:!0,edit:!0,create:!0},pops:{view:!0,edit:!0,create:!0},estoque:{view:!0,edit:!0,create:!0}},"TÉCNICO CAMPO":{dashboard:{view:!1,edit:!1},b2b:{view:!1,edit:!1,create:!1},incidentes:{view:!0,edit:!0,create:!1},vistorias:{view:!0,edit:!0,create:!1},infra:{view:!0,edit:!0,create:!1},pops:{view:!1,edit:!1,create:!1},estoque:{view:!0,edit:!1,create:!1}},"TECNICO CAMPO":null,"TÉCNICO B2B":{dashboard:{view:!1,edit:!1},b2b:{view:!0,edit:!0,create:!1},incidentes:{view:!0,edit:!0,create:!1},vistorias:{view:!1,edit:!1,create:!1},infra:{view:!1,edit:!1,create:!1},pops:{view:!1,edit:!1,create:!1},estoque:{view:!1,edit:!1,create:!1}},"TECNICO B2B":null,INFRA:{dashboard:{view:!1,edit:!1},b2b:{view:!1,edit:!1,create:!1},incidentes:{view:!0,edit:!0,create:!1},vistorias:{view:!1,edit:!1,create:!1},infra:{view:!0,edit:!0,create:!0},pops:{view:!0,edit:!0,create:!1},estoque:{view:!1,edit:!1,create:!1}},INFRAESTRUTURA:null,LOGÍSTICA:{dashboard:{view:!1,edit:!1},b2b:{view:!1,edit:!1,create:!1},incidentes:{view:!1,edit:!1,create:!1},vistorias:{view:!1,edit:!1,create:!1},infra:{view:!1,edit:!1,create:!1},pops:{view:!1,edit:!1,create:!1},estoque:{view:!0,edit:!0,create:!0}},LOGISTICA:null,VISUALIZADOR:{dashboard:{view:!0,edit:!1},b2b:{view:!0,edit:!1,create:!1},incidentes:{view:!0,edit:!1,create:!1},vistorias:{view:!0,edit:!1,create:!1},infra:{view:!0,edit:!1,create:!1},pops:{view:!0,edit:!1,create:!1},estoque:{view:!0,edit:!1,create:!1}}},Ve={b2b:["Status / Andamento","Técnico / Responsável","Observações Gerais","Dt. Finalizado"],incidentes:["Status","Responsável Técnico","Observações"],vistorias:["Responsável pela vistoria (Manual)","Status Execução (Manual)","Observação geral (Manual)"],infra:["Responsável pela infra (Manual)","Status Execução (Manual)","Observação geral (Manual)"],pops:["Status","Observações"],estoque:["Quantidade","Status Equipamento","Observações"]},je={"TECNICO CAMPO":"TÉCNICO CAMPO","TECNICO B2B":"TÉCNICO B2B",INFRAESTRUTURA:"INFRA",LOGISTICA:"LOGÍSTICA"};function Ge(e){if(!e)return"VISUALIZADOR";const t=e.toUpperCase().trim();return je[t]||t}var O="VISUALIZADOR",Je=null,ae=null;function se(e,t){if(ae=e||[],Je=t,!t){O="VISUALIZADOR";return}const a=ae.find(s=>s.Email&&s.Email.toLowerCase().trim()===t.toLowerCase().trim());a&&a.Perfil?O=Ge(a.Perfil):O="VISUALIZADOR",console.log(`[RBAC] User ${t} → Role: ${O}`)}function Ze(){return O}function Ke(e){const t=Y(e);return t?t.view:!1}function x(e){const t=Y(e);return t?t.edit:!1}function re(e){const t=Y(e);return t?t.create:!1}function Qe(e,t){return x(e)?O==="ADMIN"?!0:(Ve[e]||[]).includes(t):!1}function le(){return["dashboard","b2b","incidentes","vistorias","infra","pops","estoque"].filter(e=>Ke(e))}function Ye(){const e=le();return e.length>0?e[0]:null}function Y(e){const t=te[O];return t?t[e]||null:te.VISUALIZADOR[e]||null}var Xe=xe({WEBHOOK_URL:()=>de,appendRow:()=>pe,batchUpdate:()=>ue,enqueueWrite:()=>L,getPendingCount:()=>fe,onQueueChange:()=>me,processQueue:()=>I,updateCell:()=>ce,uploadPhoto:()=>he}),de="https://script.google.com/macros/s/AKfycbz-q0Ngl4KZAvnocvxcbRigshjGx5pYSSY6a9qMXscibifFnaxnmv8gSKcHTNaKsIvJ/exec",y=[],z=!1,P=[];function We(){if(!V())throw new Error("AUTH_REQUIRED")}async function U(e){We();const t=await fetch(de,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`Erro HTTP no Webhook: ${t.status}`);const a=await t.json();if(a.error)throw new Error(`Erro do servidor: ${a.error}`);return a.data}async function ce(e,t,a,s){return U({action:"updateCell",sheetName:e,row:t,col:a,value:s})}async function ue(e){return U({action:"batchUpdate",updates:e})}async function pe(e,t){return U({action:"appendRow",sheetName:e,rowData:t})}function et(e,t=1200,a=.7){return new Promise((s,i)=>{const n=new FileReader;n.onload=o=>{const r=new Image;r.onload=()=>{const l=document.createElement("canvas");let d=r.width,c=r.height;d>t&&(c=Math.round(c*t/d),d=t),l.width=d,l.height=c,l.getContext("2d").drawImage(r,0,0,d,c),l.toDataURL("image/jpeg",a),s(l.toDataURL("image/jpeg",a))},r.onerror=i,r.src=o.target.result},n.onerror=i,n.readAsDataURL(e)})}async function he(e,t="evidencia"){const a=await et(e);return U({action:"uploadPhoto",filename:`${t}_${new Date().toISOString().replace(/[:.]/g,"-")}.jpg`,mimeType:"image/jpeg",base64Data:a})}var ve="vero_write_queue";function q(){try{const e=localStorage.getItem(ve);y=e?JSON.parse(e):[]}catch{y=[]}}function j(){localStorage.setItem(ve,JSON.stringify(y)),ge()}function L(e,t){q(),y.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),type:e,payload:t,createdAt:new Date().toISOString(),retries:0}),j(),I()}async function I(){if(!(z||y.length===0)&&navigator.onLine){for(z=!0,q();y.length>0;){const e=y[0];try{e.type==="update"?await ce(e.payload.sheetName,e.payload.row,e.payload.col,e.payload.value):e.type==="batch"?await ue(e.payload.updates):e.type==="append"&&await pe(e.payload.sheetName,e.payload.rowData),y.shift(),j()}catch(t){console.error("[Write Queue] Failed:",t),e.retries++,(e.retries>=5||t.message==="AUTH_REQUIRED")&&(console.error("[Write Queue] Error blocking queue, discarding or waiting:",e),t.message!=="AUTH_REQUIRED"&&(y.shift(),j()));break}}z=!1,ge()}}function fe(){return q(),y.length}function me(e){return P.push(e),()=>{P=P.filter(t=>t!==e)}}function ge(){P.forEach(e=>e(y.length))}window.addEventListener("online",()=>{console.log("[Write Queue] Back online, processing queue..."),I()});q();var w=null,tt=0;function at(){return w||(w=document.createElement("div"),w.className="toast-container",w.id="toast-container",document.body.appendChild(w),w)}function F(e,t="info",a=3500){const s=at(),i=`toast-${++tt}`,n={success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',warning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',sync:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27"/></svg>'},o=document.createElement("div");return o.className=`toast toast-${t}`,o.id=i,o.innerHTML=`
    <div class="toast-icon">${n[t]||n.info}</div>
    <div class="toast-message">${e}</div>
    <button class="toast-close" aria-label="Fechar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `,o.querySelector(".toast-close").addEventListener("click",()=>ie(i)),s.appendChild(o),requestAnimationFrame(()=>{o.classList.add("toast-show")}),a>0&&setTimeout(()=>ie(i),a),i}function ie(e){const t=document.getElementById(e);t&&(t.classList.remove("toast-show"),t.classList.add("toast-hide"),setTimeout(()=>t.remove(),300))}function H(e,t){return F(e,"success",t)}function S(e,t){return F(e,"error",t||5e3)}function be(e,t){return F(e,"warning",t)}function G(e,t){return F(e,"info",t)}function ye(e="evidencia",t=null){const a=document.createElement("div");a.className="photo-capture",a.innerHTML=`
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
  `;const s=a.querySelector(".photo-capture-input"),i=a.querySelector(".photo-capture-gallery"),n=a.querySelector(".photo-capture-uploading");return a.querySelector(".photo-capture-btn").addEventListener("click",()=>s.click()),s.addEventListener("change",async o=>{const r=o.target.files[0];if(!r)return;const l=new FileReader;l.onload=d=>{const c=document.createElement("div");c.className="photo-thumb photo-thumb-uploading",c.innerHTML=`
        <img src="${d.target.result}" alt="Preview">
        <div class="photo-thumb-overlay">
          <div class="photo-upload-spinner-sm"></div>
        </div>
      `,i.appendChild(c),n.style.display="flex",he(r,e).then(p=>{c.classList.remove("photo-thumb-uploading"),c.querySelector(".photo-thumb-overlay").innerHTML=`
            <svg viewBox="0 0 24 24" fill="none" stroke="#4ADE80" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          `,c.dataset.url=p.url,c.dataset.viewUrl=p.viewUrl,c.addEventListener("click",()=>{st(p.url,p.viewUrl)}),t&&t(p),H("Foto enviada com sucesso!")}).catch(p=>{console.error("Photo upload failed:",p),c.classList.add("photo-thumb-error"),c.querySelector(".photo-thumb-overlay").innerHTML=`
            <svg viewBox="0 0 24 24" fill="none" stroke="#FB7185" stroke-width="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          `,S("Falha no upload da foto. Verifique sua conexão.")}).finally(()=>{n.style.display="none",s.value=""})},l.readAsDataURL(r)}),a}function Ce(e){const t=e.querySelectorAll(".photo-thumb[data-url]");return Array.from(t).map(a=>({url:a.dataset.url,viewUrl:a.dataset.viewUrl}))}function st(e,t){const a=document.createElement("div");a.className="gallery-viewer",a.innerHTML=`
    <div class="gallery-viewer-backdrop"></div>
    <div class="gallery-viewer-content">
      <img src="${e}" alt="Evidência">
      <div class="gallery-viewer-actions">
        ${t?`<a href="${t}" target="_blank" class="gallery-viewer-btn">Abrir no Drive</a>`:""}
        <button class="gallery-viewer-btn gallery-viewer-close">Fechar</button>
      </div>
    </div>
  `,a.querySelector(".gallery-viewer-backdrop").addEventListener("click",()=>a.remove()),a.querySelector(".gallery-viewer-close").addEventListener("click",()=>a.remove()),document.body.appendChild(a),requestAnimationFrame(()=>a.classList.add("gallery-viewer-show"))}var it={b2b:{sheetName:"Chamados B2B",keyColumn:"B",keyField:"Protocolo",fields:[{name:"Status / Andamento",col:8,type:"select",options:"Status Chamados"},{name:"Técnico / Responsável",col:7,type:"select",options:"Técnicos"},{name:"Observações Gerais",col:10,type:"textarea"},{name:"Dt. Finalizado",col:9,type:"text",placeholder:"dd/mm/yyyy HH:mm:ss"}],headerOffset:4},incidentes:{sheetName:"Incidentes",keyColumn:"B",keyField:"Task ID",fields:[{name:"Status",col:6,type:"select",options:"Status Chamados"},{name:"Responsável Técnico",col:5,type:"select",options:"Técnicos"},{name:"Observações",col:8,type:"textarea"},{name:"Data Finalizado",col:7,type:"text",placeholder:"dd/mm/yyyy"}],headerOffset:4},vistorias:{sheetName:"Vistorias RJ",keyColumn:"E",keyField:"Contrato / Protocolo",fields:[{name:"Responsável pela vistoria (Manual)",col:11,type:"select",options:"Técnicos"},{name:"Status Execução (Manual)",col:12,type:"select",options:"Status Execução"},{name:"Observação geral (Manual)",col:13,type:"textarea"}],headerOffset:4,compositeKey:e=>`${e["Data Agendada"]||""}|${e["Contrato / Protocolo"]||""}`},infra:{sheetName:"Infra RJ",keyColumn:"E",keyField:"Contrato / Protocolo",fields:[{name:"Responsável pela infra (Manual)",col:13,type:"select",options:"Técnicos"},{name:"Status Execução (Manual)",col:14,type:"select",options:"Status Execução"},{name:"Observação geral (Manual)",col:15,type:"textarea"}],headerOffset:5,compositeKey:e=>`${e["Data Agendada"]||""}|${e["Contrato / Protocolo"]||""}`}},f=null,J=null,Z=null;function nt(e,t,a,s=null){const i=it[e];if(!i){S("Módulo não suportado para edição");return}J=a||{},Z=s,ot(e,i,t)}function T(){f&&(f.classList.remove("edit-modal-show"),setTimeout(()=>{f.remove(),f=null},300))}function ot(e,t,a){f&&f.remove(),f=document.createElement("div"),f.className="edit-modal",f.id="edit-modal";const s=a["Razão Social / Cliente"]||a["Título do Chamado / Trecho"]||"Registro";f.innerHTML=`
    <div class="edit-modal-backdrop"></div>
    <div class="edit-modal-sheet">
      <div class="edit-modal-drag-handle"></div>
      <div class="edit-modal-header">
        <div>
          <h3 class="edit-modal-title">Editar Registro</h3>
          <p class="edit-modal-subtitle">${u(s)}</p>
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
  `;const i=f.querySelector("#edit-fields");t.fields.forEach(l=>{const d=Qe(e,l.name),c=a[l.name]||"";i.appendChild(rt(l,c,d))});const n=f.querySelector("#edit-photos"),o=a[t.keyField]||"unknown",r=ye(`${e.toUpperCase()}_${o}`);n.appendChild(r),f.querySelector(".edit-modal-backdrop").addEventListener("click",T),f.querySelector(".edit-modal-close").addEventListener("click",T),f.querySelector(".edit-modal-cancel").addEventListener("click",T),f.querySelector("#edit-save-btn").addEventListener("click",()=>{lt(e,t,a,n)}),dt(f.querySelector(".edit-modal-sheet")),document.body.appendChild(f),requestAnimationFrame(()=>f.classList.add("edit-modal-show"))}function rt(e,t,a){const s=document.createElement("div");s.className="edit-field";const i=document.createElement("label");i.className="edit-field-label",i.textContent=e.name,s.appendChild(i);let n;if(e.type==="select"){n=document.createElement("select"),n.className="edit-field-input",n.disabled=!a;const o=e.options,r=J&&J[o]||[],l=document.createElement("option");if(l.value="",l.textContent="— Selecionar —",n.appendChild(l),r.forEach(d=>{const c=document.createElement("option");c.value=d,c.textContent=d,d.trim().toUpperCase()===t.trim().toUpperCase()&&(c.selected=!0),n.appendChild(c)}),t&&!r.some(d=>d.trim().toUpperCase()===t.trim().toUpperCase())){const d=document.createElement("option");d.value=t,d.textContent=t,d.selected=!0,n.appendChild(d)}}else e.type==="textarea"?(n=document.createElement("textarea"),n.className="edit-field-input edit-field-textarea",n.rows=3,n.value=t,n.disabled=!a):(n=document.createElement("input"),n.type="text",n.className="edit-field-input",n.value=t,n.placeholder=e.placeholder||"",n.disabled=!a);return n.dataset.fieldName=e.name,n.dataset.col=e.col,a||s.classList.add("edit-field-readonly"),s.appendChild(n),s}async function lt(e,t,a,s){const i=f.querySelector("#edit-save-btn");i.disabled=!0,i.innerHTML='<div class="btn-spinner"></div> Salvando...';try{const n=f.querySelectorAll(".edit-field-input:not(:disabled)"),o=[];let r=a._rowIndex;if(!r){S("Registro não encontrado na planilha. O dado pode ter sido movido."),i.disabled=!1,i.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg> Salvar Alterações';return}n.forEach(d=>{const c=parseInt(d.dataset.col),p=d.dataset.fieldName,h=d.value;h!==(a[p]||"")&&o.push({sheetName:t.sheetName,row:r,col:c,value:h})});const l=Ce(s);if(l.length>0){const d=l.map(p=>p.viewUrl||p.url).join(`
`),c=n[n.length-1];if(c){const p=c.value,h=p?`${p}
📷 Fotos: ${d}`:`📷 Fotos: ${d}`;c.value=h;const v=parseInt(c.dataset.col),g=o.findIndex(b=>b.col===v);g>=0?o[g].value=h:o.push({sheetName:t.sheetName,row:r,col:v,value:h})}}if(o.length===0){G("Nenhuma alteração detectada"),T();return}L("batch",{updates:o}),H(`${o.length} campo${o.length>1?"s":""} atualizado${o.length>1?"s":""}`),o.forEach(d=>{const c=Array.from(n).find(p=>parseInt(p.dataset.col)===d.col)?.dataset.fieldName;c&&(a[c]=d.value)}),Z&&Z(a),T()}catch(n){console.error("[EditModal] Save failed:",n),n.message==="AUTH_REQUIRED"?S("Sessão expirada. Faça login novamente."):S("Erro ao salvar. A alteração foi enfileirada para retry.")}finally{i.disabled=!1,i.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg> Salvar Alterações'}}function dt(e){let t=0,a=0,s=!1;const i=e.querySelector(".edit-modal-drag-handle");i&&(i.addEventListener("touchstart",n=>{t=n.touches[0].clientY,s=!0,e.style.transition="none"},{passive:!0}),i.addEventListener("touchmove",n=>{if(!s)return;a=n.touches[0].clientY;const o=Math.max(0,a-t);e.style.transform=`translateY(${o}px)`},{passive:!0}),i.addEventListener("touchend",()=>{s&&(s=!1,e.style.transition="",a-t>120?T():e.style.transform="")}))}var ct={b2b:{sheetName:"Chamados B2B",title:"Novo Chamado B2B",icon:"📋",fields:[{name:"Dt. Abertura",type:"datetime-local",required:!0,default:()=>new Date().toISOString().slice(0,16)},{name:"Protocolo",type:"text",required:!0,placeholder:"Nº do protocolo"},{name:"Contrato",type:"text",placeholder:"Nº do contrato"},{name:"Razão Social / Cliente",type:"text",required:!0,placeholder:"Nome do cliente"},{name:"Endereço",type:"text",required:!0,placeholder:"Rua, número"},{name:"Número / Complemento",type:"text",placeholder:"Complemento"},{name:"Diagnóstico / Tipo de Falha",type:"select",options:"Diagnóstico / Falha",required:!0},{name:"Técnico / Responsável",type:"select",options:"Técnicos"},{name:"Status / Andamento",type:"select",options:"Status Chamados",default:()=>"Pendente"},{name:"Observações Gerais",type:"textarea",placeholder:"Detalhes do chamado"}]},incidentes:{sheetName:"Incidentes",title:"Novo Incidente",icon:"⚡",fields:[{name:"Origem / Categoria",type:"select",options:"Categoria Incidente",required:!0},{name:"Task ID",type:"text",placeholder:"TAS000000XXXXX"},{name:"Incidente",type:"text",placeholder:"INC000000XXXXX"},{name:"Título do Chamado / Trecho",type:"text",required:!0,placeholder:"Descrição do incidente"},{name:"Diagnóstico / Problema",type:"text",placeholder:"Diagnóstico"},{name:"Responsável Técnico",type:"select",options:"Técnicos"},{name:"Status",type:"select",options:"Status Chamados",default:()=>"Pendente"},{name:"Observações",type:"textarea"}]},vistorias:{sheetName:"Vistorias RJ",title:"Nova Vistoria",icon:"🔍",fields:[{name:"Data Agendada",type:"date",required:!0,default:()=>new Date().toISOString().slice(0,10)},{name:"Aba Ref.",type:"text",default:()=>{const e=new Date;return`${String(e.getDate()).padStart(2,"0")}-${String(e.getMonth()+1).padStart(2,"0")}`}},{name:"Atendente",type:"text",placeholder:"Nome do atendente"},{name:"Tipo de Vistoria",type:"select",staticOptions:["MONO","CONECTORIZADO","CONECTORIZADA"]},{name:"Contrato / Protocolo",type:"text",required:!0,placeholder:"Nº contrato"},{name:"Razão Social / Cliente",type:"text",required:!0,placeholder:"Nome do cliente"},{name:"Período / Horário",type:"text",placeholder:"HC, 08:00, etc.",default:()=>"HC"},{name:"Status da Vistoria",type:"select",staticOptions:["AGENDADO","AGUARDANDO CONFIRMAÇÃO"],default:()=>"AGENDADO"},{name:"Localidade (Bairro/RJ)",type:"text",placeholder:"RJ - BAIRRO"},{name:"ADM / Restrição",type:"select",staticOptions:["NÃO","TERJ","SIGMA"],default:()=>"NÃO"},{name:"Observações / Contato de Acompanhamento",type:"textarea",placeholder:"Quem acompanhará, contatos, OS..."},{name:"Responsável pela vistoria (Manual)",type:"select",options:"Técnicos"},{name:"Status Execução (Manual)",type:"select",options:"Status Execução",default:()=>"Pendente"},{name:"Observação geral (Manual)",type:"textarea"}]},infra:{sheetName:"Infra RJ",title:"Nova Atividade de Infra",icon:"🏗️",fields:[{name:"Data Agendada",type:"date",required:!0,default:()=>new Date().toISOString().slice(0,10)},{name:"Aba Ref.",type:"text",default:()=>{const e=new Date;return`${String(e.getDate()).padStart(2,"0")}-${String(e.getMonth()+1).padStart(2,"0")}`}},{name:"Atendente",type:"text",placeholder:"Nome do atendente"},{name:"Tipo de Atividade",type:"select",staticOptions:["MONO","CONECTORIZADO"]},{name:"Contrato / Protocolo",type:"text",required:!0},{name:"Razão Social / Cliente",type:"text",required:!0},{name:"Período / Horário",type:"text",default:()=>"HC"},{name:"Status da Atividade",type:"select",staticOptions:["AGENDADO","AGUARDANDO CONFIRMAÇÃO"],default:()=>"AGENDADO"},{name:"Localidade (Bairro/RJ)",type:"text",placeholder:"RJ - BAIRRO"},{name:"ADM / Restrição",type:"select",staticOptions:["NÃO","TERJ","SIGMA"],default:()=>"NÃO"},{name:"Materiais Necessários",type:"text",placeholder:"NÃO, ALÇAPÃO, GESSO...",default:()=>"NÃO"},{name:"Detalhes Atendimento",type:"select",staticOptions:["COMPLETO","PARCIAL"],default:()=>"COMPLETO"},{name:"Observações",type:"textarea"},{name:"Responsável pela infra (Manual)",type:"select",options:"Técnicos"},{name:"Status Execução (Manual)",type:"select",options:"Status Execução",default:()=>"Pendente"},{name:"Observação geral (Manual)",type:"textarea"}]}},m=null,K=null;function ut(e,t,a=null){if(!re(e)){be("Você não tem permissão para criar registros neste módulo.");return}const s=ct[e];if(!s){S("Módulo não suportado para criação");return}K=t||{},pt(e,s,a)}function B(){m&&(m.classList.remove("edit-modal-show"),setTimeout(()=>{m.remove(),m=null},300))}function pt(e,t,a){m&&m.remove(),m=document.createElement("div"),m.className="edit-modal",m.innerHTML=`
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
  `;const s=m.querySelector("#create-fields");t.fields.forEach(o=>{s.appendChild(ht(o))});const i=m.querySelector("#create-photos"),n=ye(`NOVO_${e.toUpperCase()}`);i.appendChild(n),m.querySelector(".edit-modal-backdrop").addEventListener("click",B),m.querySelector(".edit-modal-close").addEventListener("click",B),m.querySelector(".edit-modal-cancel").addEventListener("click",B),m.querySelector("#create-save-btn").addEventListener("click",()=>{vt(e,t,i,a)}),document.body.appendChild(m),requestAnimationFrame(()=>m.classList.add("edit-modal-show"))}function ht(e){const t=document.createElement("div");t.className="edit-field";const a=document.createElement("label");a.className="edit-field-label",a.textContent=e.name+(e.required?" *":""),t.appendChild(a);let s;const i=e.default?e.default():"";if(e.type==="select"){s=document.createElement("select"),s.className="edit-field-input";const n=document.createElement("option");n.value="",n.textContent="— Selecionar —",s.appendChild(n);let o=[];e.staticOptions?o=e.staticOptions:e.options&&K[e.options]&&(o=K[e.options]),o.forEach(r=>{const l=document.createElement("option");l.value=r,l.textContent=r,r===i&&(l.selected=!0),s.appendChild(l)})}else e.type==="textarea"?(s=document.createElement("textarea"),s.className="edit-field-input edit-field-textarea",s.rows=3,s.value=i,e.placeholder&&(s.placeholder=e.placeholder)):(s=document.createElement("input"),s.type=e.type||"text",s.className="edit-field-input",s.value=i,e.placeholder&&(s.placeholder=e.placeholder));return s.dataset.fieldName=e.name,s.dataset.required=e.required?"true":"false",t.appendChild(s),t}function vt(e,t,a,s){const i=m.querySelector("#create-save-btn"),n=m.querySelectorAll("#create-fields .edit-field-input");let o=!1;if(n.forEach(d=>{d.classList.remove("edit-field-error"),d.dataset.required==="true"&&!d.value.trim()&&(d.classList.add("edit-field-error"),o=!0)}),o){be("Preencha todos os campos obrigatórios (*)");return}const r=t.fields.map(d=>{const c=m.querySelector(`[data-field-name="${d.name}"]`);let p=c?c.value:"";if(d.type==="date"&&p){const h=p.split("-");p=`${h[2]}/${h[1]}/${h[0]}`}return d.type==="datetime-local"&&p&&(p=new Date(p).toLocaleString("pt-BR")),p}),l=Ce(a);if(l.length>0){const d=r.length-1,c=l.map(p=>p.viewUrl||p.url).join(" | ");r[d]=r[d]?`${r[d]} | 📷 ${c}`:`📷 ${c}`}i.disabled=!0,i.innerHTML='<div class="btn-spinner"></div> Criando...',L("append",{sheetName:t.sheetName,rowData:r}),H("Registro criado com sucesso!"),s&&s(r),B()}var ft=class{constructor(){this.container=null,this.data=null,this.filterPeriod="GERAL"}init(e){this.container=e}render(e){if(!this.container)return;this.data=e;const{kpis:t,produtividade:a}=this._calculateDynamicStats(e,this.filterPeriod);this.container.innerHTML=`
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
        ${this._renderCountKPI("Técnicos Ativos",a.filter(s=>s.totalAtrib>0).length,"cyan")}
      </div>

      <h3 style="font-size:15px; font-weight:700; margin-bottom:14px; color:var(--text);">
        📈 Produtividade Individual
      </h3>
      ${this._renderProdTable(a)}
    `,this._bindEvents()}_bindEvents(){const e=this.container.querySelector("#dashboard-period");e&&e.addEventListener("change",t=>{this.filterPeriod=t.target.value,this.render(this.data)})}_parseDate(e){if(!e||typeof e!="string")return null;const t=e.match(/(\d{2})\/(\d{2})\/(\d{4})/);return t?new Date(t[3],parseInt(t[2])-1,t[1]):null}_isDateInPeriod(e,t){if(t==="GERAL")return!0;const a=this._parseDate(e);if(!a)return!1;const s=new Date;s.setHours(0,0,0,0);const i=a.getTime();if(t==="HOJE")return i===s.getTime();if(t==="SEMANA"){const n=new Date(s);return n.setDate(s.getDate()-7),a>=n&&a<=s}return t==="MES"?a.getMonth()===s.getMonth()&&a.getFullYear()===s.getFullYear():!0}_calculateDynamicStats(e,t){const a={totalB2B:0,b2bNormalizados:0,totalIncidentes:0,incidentesConcluidos:0,totalVistorias:0,vistoriasConcluidas:0,totalInfra:0,infraConcluidas:0},s={},i=o=>{const r=(o||"").trim();return!r||r==="-"||r.toUpperCase()==="A DEFINIR"||r.toUpperCase()==="SEM ATUAÇÃO"?null:(s[r]||(s[r]={tecnico:r,b2bAtrib:0,b2bConcl:0,incAtrib:0,incConcl:0,vistAtrib:0,vistConcl:0,infraAtrib:0,infraConcl:0,totalAtrib:0,totalConcl:0,eficacia:"0%"}),s[r])};(e.chamadosB2B||[]).forEach(o=>{const r=this._isDateInPeriod(o["Dt. Abertura"],t),l=this._isDateInPeriod(o["Dt. Finalizado"]||o["Dt. Finalizado / Previsão"],t)&&(o["Agendamento / Acesso"]||"").toUpperCase().includes("NORMALIZADO"),d=r||l,c=i(o["Técnico / Responsável"]);d&&(a.totalB2B++,c&&(c.b2bAtrib++,c.totalAtrib++)),l&&(a.b2bNormalizados++,c&&(c.b2bConcl++,c.totalConcl++))}),(e.incidentes||[]).forEach(o=>{const r=(o.Status||"").toUpperCase().includes("NORMALIZADO"),l=r&&this._isDateInPeriod(o["Data Finalizado"],t),d=!r&&t==="GERAL"||l,c=i(o["Responsável Técnico"]);d&&(a.totalIncidentes++,c&&(c.incAtrib++,c.totalAtrib++)),l&&(a.incidentesConcluidos++,c&&(c.incConcl++,c.totalConcl++))}),(e.vistorias||[]).forEach(o=>{const r=this._isDateInPeriod(o["Data Agendada"],t),l=((o["Status da Vistoria"]||"").toUpperCase().includes("CONCLUÍD")||(o["Status da Vistoria"]||"").toUpperCase().includes("REALIZAD")||(o["Status Execução (Manual)"]||"").toUpperCase().includes("NORMALIZADO"))&&r,d=r,c=i(o["Responsável pela vistoria (Manual)"]||o.Atendente);d&&(a.totalVistorias++,c&&(c.vistAtrib++,c.totalAtrib++)),l&&(a.vistoriasConcluidas++,c&&(c.vistConcl++,c.totalConcl++))}),(e.infra||[]).forEach(o=>{const r=this._isDateInPeriod(o["Data Agendada"],t),l=((o["Status Execução (Manual)"]||"").toUpperCase().includes("NORMALIZADO")||(o["Status Execução (Manual)"]||"").toUpperCase().includes("CONCLUÍDO"))&&r,d=r,c=i(o["Responsável pela infra (Manual)"]||o.Atendente);d&&(a.totalInfra++,c&&(c.infraAtrib++,c.totalAtrib++)),l&&(a.infraConcluidas++,c&&(c.infraConcl++,c.totalConcl++))});const n=Object.values(s).map(o=>(o.eficacia=(o.totalAtrib>0?Math.round(o.totalConcl/o.totalAtrib*100):0)+"%",o));return n.sort((o,r)=>parseInt(r.eficacia)-parseInt(o.eficacia)),{kpis:a,produtividade:n}}_renderKPI(e,t,a,s){t=t||0,a=a||0;const i=t-a,n=t>0?Math.round(a/t*100):0;return`
      <div class="kpi-card ${s}">
        <div class="kpi-label">${e}</div>
        <div class="kpi-value">${t}</div>
        <div class="kpi-sub">
          <span class="done">${a}</span> concluídos | <span class="pending">${i}</span> pendentes
          <span style="margin-left:auto; font-family:var(--font-mono); font-weight:600;">${n}%</span>
        </div>
        <div class="progress-bar" style="margin-top:10px;">
          <div class="progress-bar-fill ${s}" style="width:${n}%"></div>
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
          <tbody>${e.map(t=>{const a=t.eficacia.replace(",",".").replace("%",""),s=parseFloat(a)||0,i=s>=80?"high":s>=50?"mid":"low",n=s>=80?"green":s>=50?"amber":"coral";return`
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
            <span class="prod-table-rate ${i}">${u(t.eficacia)}</span>
            <div class="progress-bar" style="margin-top:4px; width:80px;">
              <div class="progress-bar-fill ${n}" style="width:${s}%"></div>
            </div>
          </td>
        </tr>
      `}).join("")}</tbody>
        </table>
      </div>
    `:'<div class="empty-state"><h3>Sem dados de produtividade</h3></div>'}_calcRate(e){const t=this._sumField(e,"totalAtrib"),a=this._sumField(e,"totalConcl");return t>0?Math.round(a/t*100):0}_sumField(e,t){return e.reduce((a,s)=>a+(s[t]||0),0)}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="kpi-grid">
        ${Array(4).fill('<div class="skeleton skeleton-kpi"></div>').join("")}
      </div>
      ${Array(3).fill('<div class="skeleton skeleton-card"></div>').join("")}
    `)}},mt=class{constructor(){this.container=null,this.data=[],this.filteredData=[],this.filterStatus="PENDENTES",this.filterTecnico="",this.filterDiagnostico="",this.searchTerm="",this._editCallback=null}setEditCallback(e){this._editCallback=e}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.chamadosB2B||[],this._applyFilters();const t=this._getUniqueValues("Técnico / Responsável"),a=this._getUniqueValues("Diagnóstico / Tipo de Falha"),s=this.data.filter(r=>(r["Agendamento / Acesso"]||"").toUpperCase().includes("NORMALIZADO")).length,i=this.data.filter(r=>(r["Agendamento / Acesso"]||"").toUpperCase().includes("CANCELADO")).length,n=this.data.length-s-i,o=this.data.filter(r=>{const l=(r["Agendamento / Acesso"]||"").toUpperCase();return l.includes("ATENUAÇÃO")||l.includes("ATENUACAO")}).length;this.container.innerHTML=`
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
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${s}</span> Concluídos</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${n}</span> Pendentes</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--orange)">${o}</span> Atenuação</div>
      </div>

      <div class="cards-list" id="b2b-cards">
        ${this._renderCards()}
      </div>
    `,this._bindEvents()}_applyFilters(){this.filteredData=this.data.filter(e=>{const t=(e["Agendamento / Acesso"]||"").toUpperCase();if(this.filterTecnico&&(e["Técnico / Responsável"]||"").trim()!==this.filterTecnico||this.filterDiagnostico&&(e["Diagnóstico / Tipo de Falha"]||"").trim()!==this.filterDiagnostico)return!1;let a=!1;if(this.filterStatus==="TODOS"?a=!0:this.filterStatus==="PENDENTES"?a=!t.includes("NORMALIZADO")&&!t.includes("CANCELADO"):this.filterStatus==="CONCLUÍDOS"?a=t.includes("NORMALIZADO"):a=t.includes(this.filterStatus.toUpperCase()),!this.searchTerm)return a;const s=this.searchTerm.toLowerCase(),i=[e["Razão Social / Cliente"],e.Protocolo,e.Contrato,e.Endereço,e["Diagnóstico / Tipo de Falha"],e["Técnico / Responsável"]].join(" ").toLowerCase();return a&&i.includes(s)})}_renderFilterChips(){return[{id:"PENDENTES",label:"Pendentes"},{id:"CONCLUÍDOS",label:"Concluídos"},{id:"TODOS",label:"Todos"},{id:"Agendamento",label:"Agendamento"}].map(e=>{const t=this.filterStatus===e.id?"active":"";let a=0;return e.id==="TODOS"?a=this.data.length:e.id==="PENDENTES"?a=this.data.filter(s=>{const i=(s["Agendamento / Acesso"]||"").toUpperCase();return!i.includes("NORMALIZADO")&&!i.includes("CANCELADO")}).length:e.id==="CONCLUÍDOS"?a=this.data.filter(s=>(s["Agendamento / Acesso"]||"").toUpperCase().includes("NORMALIZADO")).length:a=this.data.filter(s=>(s["Agendamento / Acesso"]||"").toUpperCase().includes(e.id.toUpperCase())).length,`<button class="filter-chip ${t}" data-filter="${e.id}">${e.label} (${a})</button>`}).join("")}_renderCards(){return this.filteredData.length?this.filteredData.map((e,t)=>{const a=this._getStatusBadge(e["Agendamento / Acesso"]||""),s=this._getDiagBadge(e["Diagnóstico / Tipo de Falha"]||""),i=e.Endereço||"",n=e["Número / Complemento"]||"",o=`https://www.google.com/maps/search/${encodeURIComponent(i+" "+n)}`;return`
        <div class="data-card" style="animation-delay: ${t*30}ms">
          <div class="data-card-header">
            <div class="data-card-title">${u(e["Razão Social / Cliente"]||"Sem nome")}</div>
            ${a}
          </div>
          <div class="data-card-meta">
            ${s}
            <span class="meta-tag">📝 Protocolo: ${u(e.Protocolo||"-")}</span>
            ${e["Dt. Abertura"]?`<span class="meta-tag">📅 ${u(e["Dt. Abertura"])}</span>`:""}
          </div>
          <div class="data-card-body">
            <div class="field">
              <span class="field-label">Endereço completo: </span>${u(i)}${n?", "+u(n):""}
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
              ${x("b2b")?`<button class="action-btn action-btn-edit" data-idx="${t}">
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
      </div>`}_getStatusBadge(e){const t=e.toUpperCase(),a=u(e)||"Sem status";return t.includes("NORMALIZADO")?`<span class="badge badge-normalizado">${a}</span>`:t.includes("PENDENTE")?`<span class="badge badge-pendente">${a}</span>`:t.includes("ATENUAÇÃO")||t.includes("ATENUACAO")?`<span class="badge badge-atenuacao">${a}</span>`:t.includes("AGENDAMENTO")?`<span class="badge badge-agendado">${a}</span>`:t.includes("DESIGNADO")?`<span class="badge badge-designado">${a}</span>`:t.includes("CANCELADO")?`<span class="badge badge-cancelado">${a}</span>`:`<span class="badge" style="background:var(--panel);color:var(--muted)">${a}</span>`}_getDiagBadge(e){const t=e.toUpperCase(),a=u(e)||"Sem diagnóstico";return t.includes("ROMPIMENTO")?`<span class="badge badge-rompimento">${a}</span>`:t.includes("QUALIDADE")||t.includes("ATENUAÇÃO")?`<span class="badge badge-qualidade">${a}</span>`:t.includes("RÁDIO")||t.includes("RADIO")?`<span class="badge badge-radio">${a}</span>`:t.includes("SW")||t.includes("HW")?`<span class="badge badge-swhw">${a}</span>`:`<span class="badge" style="background:var(--panel);color:var(--muted)">${a}</span>`}_getUniqueValues(e){const t=new Set;return this.data.forEach(a=>{const s=(a[e]||"").trim();s&&t.add(s)}),Array.from(t).sort()}_bindEvents(){const e=this.container.querySelector("#b2b-search");e&&e.addEventListener("input",s=>{this.searchTerm=s.target.value,this._applyFilters();const i=this.container.querySelector("#b2b-cards");i&&(i.innerHTML=this._renderCards())});const t=this.container.querySelector("#b2b-filter-tecnico");t&&t.addEventListener("change",s=>{this.filterTecnico=s.target.value,this._applyFilters();const i=this.container.querySelector("#b2b-cards");i&&(i.innerHTML=this._renderCards())});const a=this.container.querySelector("#b2b-filter-diagnostico");a&&a.addEventListener("change",s=>{this.filterDiagnostico=s.target.value,this._applyFilters();const i=this.container.querySelector("#b2b-cards");i&&(i.innerHTML=this._renderCards())}),this.container.querySelectorAll(".filter-chip[data-filter]").forEach(s=>{s.addEventListener("click",()=>{this.filterStatus=s.dataset.filter,this.render({chamadosB2B:this.data})})}),this.container.querySelectorAll(".action-btn-edit").forEach(s=>{s.addEventListener("click",()=>{const i=parseInt(s.dataset.idx),n=this.filteredData[i];n&&this._editCallback&&this._editCallback("b2b",n)})})}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">📋 Chamados B2B</h2></div></div>
      ${Array(5).fill('<div class="skeleton skeleton-card"></div>').join("")}
    `)}},gt=class{constructor(){this.container=null,this.data=[],this.filteredData=[],this.filterStatus="PENDENTES",this.filterCategoria="",this.filterResponsavel="",this.searchTerm="",this._editCallback=null}setEditCallback(e){this._editCallback=e}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.incidentes||[],this._applyFilters();const t=this._getUniqueValues("Origem / Categoria"),a=this._getUniqueValues("Responsável Técnico"),s=this.data.filter(n=>{const o=(n.Status||"").toUpperCase();return o.includes("NORMALIZADO")||o.includes("CONCLUÍDO")}).length,i=this.data.length-s;this.container.innerHTML=`
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">⚠️ Incidentes Múltiplos</h2>
          <p class="module-subtitle">Acompanhamento de falhas massivas e tarefas — ${this.data.length} registros</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="inc-search" placeholder="Buscar incidente..." value="${u(this.searchTerm)}">
            </div>
            <select id="inc-filter-categoria" class="search-input" style="padding-left: 12px; max-width: 150px; text-overflow: ellipsis;">
              <option value="">Categoria (Todas)</option>
              ${t.map(n=>`<option value="${u(n)}" ${this.filterCategoria===n?"selected":""}>${u(n)}</option>`).join("")}
            </select>
            <select id="inc-filter-responsavel" class="search-input" style="padding-left: 12px; max-width: 180px; text-overflow: ellipsis;">
              <option value="">Responsável (Todos)</option>
              ${a.map(n=>`<option value="${u(n)}" ${this.filterResponsavel===n?"selected":""}>${u(n)}</option>`).join("")}
            </select>
          </div>
          <div class="filters-scroll">
            ${this._renderFilterChips()}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${this.data.length}</span> Total</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${s}</span> Concluídos</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${i}</span> Pendentes</div>
      </div>

      <div class="cards-list" id="inc-cards">
        ${this._renderCards()}
      </div>
    `,this._bindEvents()}_applyFilters(){this.filteredData=this.data.filter(e=>{const t=(e.Status||"").toUpperCase();if(this.filterCategoria&&(e["Origem / Categoria"]||"").trim()!==this.filterCategoria||this.filterResponsavel&&(e["Responsável Técnico"]||"").trim()!==this.filterResponsavel)return!1;let a=!1;if(this.filterStatus==="TODOS"?a=!0:this.filterStatus==="PENDENTES"?a=!t.includes("NORMALIZADO")&&!t.includes("CONCLUÍDO"):this.filterStatus==="CONCLUÍDOS"?a=t.includes("NORMALIZADO")||t.includes("CONCLUÍDO"):a=t.includes(this.filterStatus.toUpperCase()),!this.searchTerm)return a;const s=this.searchTerm.toLowerCase(),i=[e["Incidente / Problema"],e["Cidade(s) Afetada(s)"],e["Protocolo / Ticket"],e.Designação,e["Título do Chamado / Trecho"],e["Diagnóstico / Problema"]].join(" ").toLowerCase();return a&&i.includes(s)})}_renderFilterChips(){return[{id:"PENDENTES",label:"Pendentes"},{id:"CONCLUÍDOS",label:"Concluídos"},{id:"TODOS",label:"Todos"},{id:"DESIGNADO",label:"Designado"},{id:"VALIDAÇÃO",label:"Validação"}].map(e=>{const t=this.filterStatus===e.id?"active":"";let a=0;return e.id==="TODOS"?a=this.data.length:e.id==="PENDENTES"?a=this.data.filter(s=>{const i=(s.Status||"").toUpperCase();return!i.includes("NORMALIZADO")&&!i.includes("CONCLUÍDO")}).length:e.id==="CONCLUÍDOS"?a=this.data.filter(s=>{const i=(s.Status||"").toUpperCase();return i.includes("NORMALIZADO")||i.includes("CONCLUÍDO")}).length:e.id==="VALIDAÇÃO"?a=this.data.filter(s=>{const i=(s.Status||"").toUpperCase();return i.includes("VALIDAÇÃO")||i.includes("VALIDACAO")}).length:a=this.data.filter(s=>(s.Status||"").toUpperCase().includes(e.id.toUpperCase())).length,`<button class="filter-chip ${t}" data-filter="${e.id}">${e.label} (${a})</button>`}).join("")}_renderCards(){return this.filteredData.length?this.filteredData.map((e,t)=>{const a=this._getCatBadge(e["Origem / Categoria"]||""),s=this._getStatusBadge(e.Status||"");return`
        <div class="data-card" style="animation-delay: ${t*30}ms">
          <div class="data-card-header">
            <div class="data-card-title">${u(e["Título do Chamado / Trecho"]||"Sem título")}</div>
            ${s}
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
              ${x("incidentes")?`<button class="action-btn action-btn-edit" data-idx="${t}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>`:""}
            </div>
          </div>
        </div>
      `}).join(""):`<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        <h3>Nenhum incidente encontrado</h3>
        <p>Ajuste os filtros ou a busca</p>
      </div>`}_getUniqueValues(e){const t=new Set;return this.data.forEach(a=>{const s=(a[e]||"").trim();s&&t.add(s)}),Array.from(t).sort()}_getCatBadge(e){const t=e.toUpperCase();return t.includes("BACKBONE")?'<span class="badge badge-backbone">Backbone</span>':t.includes("CAIXA")?'<span class="badge badge-caixa">Caixa</span>':t.includes("TELEFONIA")?'<span class="badge badge-telefonia">Telefonia</span>':t.includes("POP")?'<span class="badge badge-pop">POP</span>':'<span class="badge badge-tarefas">Tarefa</span>'}_getStatusBadge(e){const t=e.toUpperCase();return t.includes("NORMALIZADO")||t.includes("CONCLUÍDO")?'<span class="badge badge-normalizado">Normalizado</span>':t.includes("PENDENTE")?'<span class="badge badge-pendente">Pendente</span>':t.includes("DESIGNADO")?'<span class="badge badge-designado">Designado</span>':t.includes("VALIDAÇÃO")||t.includes("VALIDACAO")?'<span class="badge badge-validacao">Validação</span>':`<span class="badge" style="background:var(--panel);color:var(--muted)">${u(e)||"Sem status"}</span>`}_bindEvents(){const e=this.container.querySelector("#inc-search");e&&e.addEventListener("input",s=>{this.searchTerm=s.target.value,this._applyFilters();const i=this.container.querySelector("#inc-cards");i&&(i.innerHTML=this._renderCards())});const t=this.container.querySelector("#inc-filter-categoria");t&&t.addEventListener("change",s=>{this.filterCategoria=s.target.value,this.render({incidentes:this.data})});const a=this.container.querySelector("#inc-filter-responsavel");a&&a.addEventListener("change",s=>{this.filterResponsavel=s.target.value,this.render({incidentes:this.data})}),this.container.querySelectorAll(".filter-chip[data-filter]").forEach(s=>{s.addEventListener("click",()=>{this.filterStatus=s.dataset.filter,this.render({incidentes:this.data})})}),this.container.querySelectorAll(".action-btn-edit").forEach(s=>{s.addEventListener("click",()=>{const i=parseInt(s.dataset.idx),n=this.filteredData[i];n&&this._editCallback&&this._editCallback("incidentes",n)})})}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">⚡ Incidentes</h2></div></div>
      ${Array(4).fill('<div class="skeleton skeleton-card"></div>').join("")}
    `)}},bt=class{constructor(){this.container=null,this.data=[],this.filterExec="ABERTOS",this.searchTerm="",this._editCallback=null}setEditCallback(e){this._editCallback=e}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.vistorias||[];const t=this.data.filter(i=>{const n=(i["Status Execução (Manual)"]||"Pendente").toUpperCase();let o=!1;if(this.filterExec==="TODOS"?o=!0:this.filterExec==="ABERTOS"?o=!n.includes("CONCLUÍDO")&&!n.includes("CONCLUIDO"):o=n.includes(this.filterExec.toUpperCase()),!this.searchTerm)return o;const r=this.searchTerm.toLowerCase(),l=[i["Nº Vistoria"],i.Cidade,i.Endereço,i["Técnico Responsável (Manual)"]].join(" ").toLowerCase();return o&&l.includes(r)}),a={Concluído:0,Pendente:0,"Não Realizado":0};this.data.forEach(i=>{const n=(i["Status Execução (Manual)"]||"Pendente").trim();n&&(a[n]=(a[n]||0)+1)});const s={};t.forEach(i=>{const n=i["Data Agendada"]||"Sem data";s[n]||(s[n]=[]),s[n].push(i)}),this.container.innerHTML=`
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
            ${["ABERTOS","TODOS","Concluído","Pendente","Não Realizado"].map(i=>{const n=this.filterExec===i?"active":"";let o=0;return i==="TODOS"?o=this.data.length:i==="ABERTOS"?o=this.data.filter(r=>{const l=(r["Status Execução (Manual)"]||"").toUpperCase();return!l.includes("CONCLUÍDO")&&!l.includes("CONCLUIDO")}).length:o=a[i]||0,`<button class="filter-chip ${n}" data-filter="${i}">${i} (${o})</button>`}).join("")}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${this.data.length}</span> Total</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${a.Concluído||0}</span> Concluídas</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${a.Pendente||a[""]||0}</span> Pendentes</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--coral)">${a["Não Realizado"]||0}</span> Não Realizadas</div>
      </div>

      ${Object.keys(s).length===0?`
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <h3>Nenhuma vistoria encontrada</h3><p>Ajuste os filtros</p>
        </div>`:Object.entries(s).map(([i,n])=>`
          <div class="date-group">
            <div class="date-group-header">
              <span class="date-group-label">📅 ${u(i)}</span>
              <span class="date-group-count">${n.length} vistoria${n.length>1?"s":""}</span>
            </div>
            <div class="cards-list">
              ${n.map((o,r)=>this._renderCard(o,r)).join("")}
            </div>
          </div>
        `).join("")}
    `,this.container.querySelectorAll(".filter-chip[data-filter]").forEach(i=>{i.addEventListener("click",()=>{this.filterExec=i.dataset.filter,this.render(e)})}),this.container.querySelectorAll(".action-btn-edit").forEach(i=>{i.addEventListener("click",()=>{const n=parseInt(i.dataset.idx),o=this.data.filter(r=>{const l=(r["Status Execução (Manual)"]||"Pendente").toUpperCase();return this.filterExec==="TODOS"?!0:this.filterExec==="ABERTOS"?!l.includes("CONCLUÍDO")&&!l.includes("CONCLUIDO"):l.includes(this.filterExec.toUpperCase())});o[n]&&this._editCallback&&this._editCallback("vistorias",o[n])})})}_renderCard(e,t){const a=(e["Tipo de Vistoria"]||"").toUpperCase().includes("CONECTOR")?'<span class="badge badge-conectorizado">Conectorizado</span>':'<span class="badge badge-mono">Mono</span>',s=e["Status Execução (Manual)"]||"",i=this._getExecBadge(s);return`
      <div class="data-card" style="animation-delay: ${t*30}ms">
        <div class="data-card-header">
          <div class="data-card-title">${u(e["Razão Social / Cliente"]||"Sem nome")}</div>
          ${i}
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
            ${x("vistorias")?`<button class="action-btn action-btn-edit" data-idx="${t}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>`:""}
          </div>
        </div>
      </div>
    `}_getExecBadge(e){const t=(e||"").toUpperCase();return t.includes("CONCLUÍDO")||t.includes("CONCLUIDO")?'<span class="badge badge-concluido">Concluído</span>':t.includes("NÃO REALIZADO")||t.includes("NAO REALIZADO")?'<span class="badge badge-nao-realiz">Não Realizado</span>':t.includes("PARCIAL")?'<span class="badge badge-validacao">Parcial</span>':t.includes("PENDENTE")||!t?'<span class="badge badge-pendente">Pendente</span>':`<span class="badge" style="background:var(--panel);color:var(--muted)">${u(e)}</span>`}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">🔍 Vistorias RJ</h2></div></div>
      ${Array(5).fill('<div class="skeleton skeleton-card"></div>').join("")}
    `)}},yt=class{constructor(){this.container=null,this.data=[],this.filterExec="ABERTOS",this.searchTerm="",this._editCallback=null}setEditCallback(e){this._editCallback=e}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.infra||[];const t=this.data.filter(i=>{const n=(i["Status Execução (Manual)"]||"").toUpperCase();let o=!1;if(this.filterExec==="TODOS"?o=!0:this.filterExec==="ABERTOS"?o=!n.includes("CONCLUÍDO")&&!n.includes("CONCLUIDO"):o=n.includes(this.filterExec.toUpperCase()),!this.searchTerm)return o;const r=this.searchTerm.toLowerCase(),l=[i["Nº Vistoria Vinculada"],i["Tipo de Ocorrência"],i.Endereço,i["Técnico / Equipe"]].join(" ").toLowerCase();return o&&l.includes(r)}),a={Concluído:0,Parcial:0,Pendente:0};this.data.forEach(i=>{const n=(i["Status Execução (Manual)"]||"Pendente").trim();n&&(a[n]=(a[n]||0)+1)});const s={};t.forEach(i=>{const n=i["Data Agendada"]||"Sem data";s[n]||(s[n]=[]),s[n].push(i)}),this.container.innerHTML=`
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
            ${["ABERTOS","TODOS","Concluído","Parcial","Pendente"].map(i=>{const n=this.filterExec===i?"active":"";let o=0;return i==="TODOS"?o=this.data.length:i==="ABERTOS"?o=this.data.filter(r=>{const l=(r["Status Execução (Manual)"]||"").toUpperCase();return!l.includes("CONCLUÍDO")&&!l.includes("CONCLUIDO")}).length:o=a[i]||0,`<button class="filter-chip ${n}" data-filter="${i}">${i} (${o})</button>`}).join("")}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${this.data.length}</span> Total</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${a.Concluído||0}</span> Concluídas</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${a.Parcial||0}</span> Parciais</div>
      </div>

      ${Object.keys(s).length===0?`
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          <h3>Nenhuma atividade de infra</h3><p>Ajuste os filtros</p>
        </div>`:Object.entries(s).map(([i,n])=>`
          <div class="date-group">
            <div class="date-group-header">
              <span class="date-group-label">📅 ${u(i)}</span>
              <span class="date-group-count">${n.length} atividade${n.length>1?"s":""}</span>
            </div>
            <div class="cards-list">
              ${n.map((o,r)=>this._renderCard(o,r)).join("")}
            </div>
          </div>
        `).join("")}
    `,this.container.querySelectorAll(".filter-chip[data-filter]").forEach(i=>{i.addEventListener("click",()=>{this.filterExec=i.dataset.filter,this.render(e)})}),this.container.querySelectorAll(".action-btn-edit").forEach(i=>{i.addEventListener("click",()=>{const n=parseInt(i.dataset.idx),o=this.data.filter(r=>{const l=(r["Status Execução (Manual)"]||"").toUpperCase();return this.filterExec==="TODOS"?!0:this.filterExec==="ABERTOS"?!l.includes("CONCLUÍDO")&&!l.includes("CONCLUIDO"):l.includes(this.filterExec.toUpperCase())});o[n]&&this._editCallback&&this._editCallback("infra",o[n])})})}_renderCard(e,t){const a=(e["Tipo de Atividade"]||"").toUpperCase().includes("CONECTOR")?'<span class="badge badge-conectorizado">Conectorizado</span>':'<span class="badge badge-mono">Mono</span>',s=e["Status Execução (Manual)"]||"",i=this._getExecBadge(s),n=e["Materiais Necessários"]||"",o=n&&n!=="NÃO";return`
      <div class="data-card" style="animation-delay: ${t*30}ms">
        <div class="data-card-header">
          <div class="data-card-title">${u(e["Razão Social / Cliente"]||"Sem nome")}</div>
          ${i}
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
            ${x("infra")?`<button class="action-btn action-btn-edit" data-idx="${t}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>`:""}
          </div>
        </div>
      </div>
    `}_getExecBadge(e){const t=(e||"").toUpperCase();return t.includes("CONCLUÍDO")||t.includes("CONCLUIDO")?'<span class="badge badge-concluido">Concluído</span>':t.includes("NÃO REALIZADO")||t.includes("NAO REALIZADO")?'<span class="badge badge-nao-realiz">Não Realizado</span>':t.includes("PARCIAL")?'<span class="badge badge-validacao">Parcial</span>':t.includes("PENDENTE")||!t?'<span class="badge badge-pendente">Pendente</span>':`<span class="badge" style="background:var(--panel);color:var(--muted)">${u(e)}</span>`}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">🏗️ Infraestrutura RJ</h2></div></div>
      ${Array(5).fill('<div class="skeleton skeleton-card"></div>').join("")}
    `)}},Ct=class{constructor(){this.container=null,this.data=[]}init(e){this.container=e}render(e){if(!this.container)return;this.data=e.pops||[];const t=this.data.reduce((o,r)=>o+(parseInt(r.Assinantes)||0),0),a=this.data.reduce((o,r)=>{const l=(r["Receita Mensal (R$)"]||"").replace("R$","").replace(/\./g,"").replace(",",".").trim();return o+(parseFloat(l)||0)},0),s=this.data.filter(o=>(o["Peso / Prioridade"]||"").includes("P1")),i=this.data.filter(o=>(o["Peso / Prioridade"]||"").includes("P2")),n=this.data.filter(o=>(o["Peso / Prioridade"]||"").includes("P3"));this.container.innerHTML=`
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
          <div class="kpi-value">${s.length}</div>
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

      ${this._renderSection("🔴 Prioridade P1 — CRÍTICA",s)}
      ${this._renderSection("🟡 Prioridade P2 — ALTA",i)}
      ${this._renderSection("🟢 Prioridade P3 — PADRÃO",n)}
    `}_renderSection(e,t){return t.length?`
      <h3 style="font-size:14px; font-weight:700; margin: 20px 0 12px; color:var(--text);">${e}</h3>
      <div class="cards-grid" style="margin-bottom: 16px;">
        ${t.map((a,s)=>this._renderPOPCard(a,s)).join("")}
      </div>
    `:""}_renderPOPCard(e,t){const a=(e["Peso / Prioridade"]||"").toUpperCase(),s=a.includes("P1")?"badge-p1":a.includes("P2")?"badge-p2":"badge-p3",i=(e["Tecnologia Principal"]||"").toUpperCase().includes("FIBRA")?'<span class="badge badge-conectorizado">Fibra Óptica</span>':'<span class="badge badge-mono">Rádio / RF</span>',n=e["Endereço Completo"]||"",o=`https://www.google.com/maps/search/${encodeURIComponent(n)}`,r=e["Receita Mensal (R$)"]||"R$ 0,00";return`
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
          <span class="badge ${s}">${u(e["Peso / Prioridade"]||"-")}</span>
        </div>

        <div class="data-card-meta" style="margin-bottom:10px;">
          ${i}
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
    `)}},C=class{static getApiKey(){return localStorage.getItem("VERO_GEMINI_KEY")||""}static setApiKey(e){localStorage.setItem("VERO_GEMINI_KEY",e.trim())}static hasApiKey(){return!!this.getApiKey()}static async analyzeImage(e,t,a){const s=this.getApiKey();if(!s)throw new Error("Chave de API do Gemini não configurada.");const i=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${s}`,n={contents:[{parts:[{text:a},{inlineData:{mimeType:t,data:e}}]}],generationConfig:{responseMimeType:"application/json"}};try{const o=await fetch(i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)});if(!o.ok){const l=await o.json().catch(()=>({}));throw new Error(l?.error?.message||`Erro HTTP ${o.status}`)}const r=(await o.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(!r)throw new Error("A IA não retornou nenhum texto útil.");try{return JSON.parse(r)}catch{return console.warn("Retorno da IA não é um JSON válido:",r),r}}catch(o){throw console.error("[VisionAPI] Error:",o),o}}static async fileToBase64(e){return new Promise((t,a)=>{const s=new FileReader;s.onload=()=>{const i=s.result,n=i.indexOf(",");if(n===-1){a(new Error("Erro ao ler o arquivo."));return}t({base64:i.substring(n+1),mimeType:e.type})},s.onerror=i=>a(i),s.readAsDataURL(e)})}},At=class{constructor(){this.container=null,this.data=[],this.allData=null,this.filterCat="TODOS",this.searchTerm="",this._editCallback=null}setEditCallback(e){this._editCallback=e}init(e){this.container=e}render(e){if(!this.container)return;this.allData=e,this.data=e.estoque||[];const t=this.data.filter(i=>{const n=(i["Categoria / Tipo"]||"").toUpperCase(),o=this.filterCat==="TODOS"||n.includes(this.filterCat.toUpperCase());if(!this.searchTerm)return o;const r=this.searchTerm.toLowerCase(),l=[i["Nº de Série / Lote"],i["Marca / Fabricante"],i.Modelo,i["Localização Física"]].join(" ").toLowerCase();return o&&l.includes(r)}),a={normal:0,alerta:0,critico:0};let s=0;this.data.forEach(i=>{const n=parseFloat(i["Qtd. em Estoque"])||0;s+=n;const o=parseFloat(i["Estoque Mínimo"])||0,r=(i["Status do Equipamento"]||"").toUpperCase();r.includes("FALTA")||n===0?a.critico++:n<=o||r.includes("ALERTA")?a.alerta++:a.normal++}),this.container.innerHTML=`
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📦 Estoque VERO</h2>
          <p class="module-subtitle">Controle de equipamentos e sobressalentes — ${this.data.length} registros</p>
          <div class="module-actions" style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn" id="btn-ai-scan" style="background:var(--primary);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px; margin-right:6px;">
                <path d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4zM12 12v.01M16 16v.01M16 20v.01M20 16v.01M12 16v.01M12 20v.01M20 12v.01"/>
              </svg>
              Leitor IA
            </button>
            <button class="btn" id="btn-substitute" style="background:var(--purple);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px; margin-right:6px;">
                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
              </svg>
              Substituição em Campo
            </button>
            <button class="btn btn-icon" id="btn-ai-settings" title="Configurar IA" style="background:transparent; border:1px solid var(--border); color:var(--text);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="estoque-search" placeholder="Buscar série, modelo..." value="${u(this.searchTerm)}">
            </div>
          </div>
          <div class="filters-scroll">
            ${["TODOS","ONU","Switch","Rádio","Módulo","Cabo"].map(i=>`<button class="filter-chip ${this.filterCat===i?"active":""}" data-filter="${i}">${i}</button>`).join("")}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${s}</span> Unidades Totais</div>
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
              ${x("estoque")?'<th style="width:60px;">Ação</th>':""}
            </tr>
          </thead>
          <tbody>
            ${t.length===0?`<tr><td colspan="${x("estoque")?"7":"6"}" style="text-align:center; padding: 40px;"><div class="empty-state"><h3>Nenhum material encontrado</h3><p>Ajuste os filtros ou a busca</p></div></td></tr>`:t.map((i,n)=>this._renderRow(i,n)).join("")}
          </tbody>
        </table>
      </div>
    `,this._bindEvents()}_renderRow(e,t){const a=parseFloat(e["Qtd. em Estoque"])||0,s=parseFloat(e["Estoque Mínimo"])||0,i=e["Status do Equipamento"]||"",n=i.toUpperCase();let o="badge-normalizado",r=i||"OK";n.includes("FALTA")||a===0?(o="badge-cancelado",r=i||"Em Falta"):a<=s||n.includes("ALERTA")?(o="badge-atenuacao",r=i||"Atenção"):n.includes("RESERVA")||n.includes("USO")||n.includes("REVERSA")?o="badge-designado":o="badge-normalizado";const l=[e["Marca / Fabricante"],e.Modelo].filter(Boolean).join(" - ");return`
      <tr>
        <td style="font-family:var(--font-mono); font-weight:600;">${u(e["Nº de Série / Lote"]||"-")}</td>
        <td style="font-weight:500; color:var(--text);">${u(l||"-")}</td>
        <td><span class="meta-tag">${u(e["Categoria / Tipo"]||"Outros")}</span></td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:700; color:var(--text);">
          ${a}
          <div style="font-size:9px; color:var(--muted); font-weight:normal;">Mín: ${s}</div>
        </td>
        <td><span class="badge ${o}">${u(r)}</span></td>
        <td style="color:var(--text-dim); font-size:11px;">${u(e["Localização Física"]||"-")}</td>
        ${x("estoque")?`<td>
          <button class="action-btn action-btn-edit" data-idx="${t}" style="min-height:32px; padding:4px 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </td>`:""}
      </tr>
    `}_bindEvents(){const e=this.container.querySelector("#estoque-search");e&&e.addEventListener("input",i=>{this.searchTerm=i.target.value,this.render(this.allData)}),this.container.querySelectorAll(".filter-chip[data-filter]").forEach(i=>{i.addEventListener("click",()=>{this.filterCat=i.dataset.filter,this.render(this.allData)})}),this.container.querySelectorAll(".action-btn-edit").forEach(i=>{i.addEventListener("click",()=>{const n=parseInt(i.dataset.idx),o=this.data.filter(r=>{const l=(r["Categoria / Tipo"]||"").toUpperCase(),d=this.filterCat==="TODOS"||l.includes(this.filterCat.toUpperCase());if(!this.searchTerm)return d;const c=this.searchTerm.toLowerCase(),p=[r["Nº de Série / Lote"],r["Marca / Fabricante"],r.Modelo,r["Localização Física"]].join(" ").toLowerCase();return d&&p.includes(c)});o[n]&&this._editCallback&&this._editCallback("estoque",o[n])})});const t=this.container.querySelector("#btn-ai-settings");t&&t.addEventListener("click",()=>{const i=C.getApiKey(),n=prompt("Insira a chave da API do Google Gemini (AI Studio):",i);n!==null&&(C.setApiKey(n),alert("Chave de API salva com sucesso!"))});const a=this.container.querySelector("#btn-ai-scan");a&&a.addEventListener("click",()=>this._handleAIScan());const s=this.container.querySelector("#btn-substitute");s&&s.addEventListener("click",()=>this._handleSubstitute())}async _handleAIScan(){if(!C.hasApiKey()){alert("Configure a chave da API do Gemini primeiro (ícone de engrenagem).");return}const e=await this._promptCamera();if(!e)return;const t=this._showLoading("Analisando imagem com IA...");try{const{base64:a,mimeType:s}=await C.fileToBase64(e),i=await C.analyzeImage(a,s,'Analise a imagem desta etiqueta de equipamento e retorne um JSON estrito, sem markdown, contendo as chaves: "marca", "modelo", "serial", "categoria". Se não identificar algo, deixe vazio.');document.body.removeChild(t),alert(`Resultados da IA:nMarca: ${i.marca}nModelo: ${i.modelo}nS/N: ${i.serial}nCategoria: ${i.categoria}`)}catch(a){document.body.removeChild(t),alert("Erro na IA: "+a.message)}}async _handleSubstitute(){if(!C.hasApiKey()){alert("Configure a chave da API do Gemini primeiro (ícone de engrenagem).");return}const e=`
      <div class="modal-overlay" id="substitute-modal">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h3>Substituição em Campo</h3>
            <button class="close-btn" onclick="document.body.removeChild(document.getElementById('substitute-modal'))">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p><strong>1. Equipamento Retirado (Defeituoso)</strong></p>
            <div id="sub-retirado-data" style="margin-bottom:8px; font-size:13px; color:var(--text-dim);">Aguardando foto...</div>
            <button class="btn btn-outline" id="btn-foto-retirado" style="width:100%; margin-bottom: 24px;">📸 Tirar Foto da Etiqueta</button>

            <p><strong>2. Equipamento Novo (Instalado)</strong></p>
            <div id="sub-novo-data" style="margin-bottom:8px; font-size:13px; color:var(--text-dim);">Aguardando foto...</div>
            <button class="btn btn-outline" id="btn-foto-novo" style="width:100%; margin-bottom: 24px;">📸 Tirar Foto da Etiqueta</button>

            <p><strong>3. Chamado Relacionado</strong></p>
            <select id="sub-chamado-select" class="form-input" style="width:100%; margin-bottom: 24px;">
              <option value="">Selecione um chamado aberto...</option>
              ${this._getOpenTicketsOptions()}
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="document.body.removeChild(document.getElementById('substitute-modal'))">Cancelar</button>
            <button class="btn btn-primary" id="btn-sub-confirm" disabled>Confirmar Substituição</button>
          </div>
        </div>
      </div>
    `;document.body.insertAdjacentHTML("beforeend",e);const t=document.getElementById("substitute-modal");let a=null,s=null;t.querySelector("#btn-foto-retirado").addEventListener("click",async()=>{const i=await this._promptCamera();if(!i)return;const n=this._showLoading("Analisando equipamento retirado...");try{const{base64:o,mimeType:r}=await C.fileToBase64(i);a=await C.analyzeImage(o,r,'Analise a etiqueta e retorne JSON: {"marca":"", "modelo":"", "serial":"", "categoria":""}'),document.body.removeChild(n),t.querySelector("#sub-retirado-data").innerHTML=`
          <strong style="color:var(--text);">S/N: ${a.serial||"?"}</strong> - ${a.marca} ${a.modelo} <span class="badge badge-cancelado" style="font-size:10px;">Defeito</span>
        `,this._checkSubReady(t,a,s)}catch(o){document.body.removeChild(n),alert(o.message)}}),t.querySelector("#btn-foto-novo").addEventListener("click",async()=>{const i=await this._promptCamera();if(!i)return;const n=this._showLoading("Analisando equipamento novo...");try{const{base64:o,mimeType:r}=await C.fileToBase64(i);s=await C.analyzeImage(o,r,'Analise a etiqueta e retorne JSON: {"marca":"", "modelo":"", "serial":"", "categoria":""}'),document.body.removeChild(n),t.querySelector("#sub-novo-data").innerHTML=`
          <strong style="color:var(--text);">S/N: ${s.serial||"?"}</strong> - ${s.marca} ${s.modelo} <span class="badge badge-normalizado" style="font-size:10px;">Novo</span>
        `,this._checkSubReady(t,a,s)}catch(o){document.body.removeChild(n),alert(o.message)}}),t.querySelector("#btn-sub-confirm").addEventListener("click",()=>{const i=t.querySelector("#sub-chamado-select"),n=i.value,o=i.options[i.selectedIndex].text;this._commitSubstitution(a,s,n,o),document.body.removeChild(t)})}_checkSubReady(e,t,a){const s=e.querySelector("#btn-sub-confirm");t&&a?s.removeAttribute("disabled"):s.setAttribute("disabled","true")}_commitSubstitution(e,t,a,s){let i=null,n=null;if(a){const l=a.split("|");l.length===3&&(n=parseInt(l[1],10),i=l[2])}const o=[e.categoria||"Outros",e.marca||"",e.modelo||"",e.serial||"S/N Desconhecido",1,1,"Defeituoso",`Retirado em Campo (${s})`,new Date().toLocaleDateString("pt-BR"),s||"Sem chamado"];L("append",{sheetName:"Logística Reversa",rowData:o});const r=[t.categoria||"Outros",t.marca||"",t.modelo||"",t.serial||"S/N Desconhecido",1,1,"Em Uso",`Instalado (${s})`,new Date().toLocaleDateString("pt-BR"),"Instalado via Substituição em Campo"];if(L("append",{sheetName:"Estoque Disponível",rowData:r}),i&&n){const l=`n[SISTEMA] Substituição em Campo: Retirado (${e.marca} ${e.serial||"S/N Desconhecido"}) -> Instalado (${t.marca} ${t.serial||"S/N Desconhecido"})`;L("update",{sheetName:i,row:n,col:i==="Chamados B2B"?11:9,value:l})}alert("Substituição registrada! A fila offline enviará os dados em breve.")}_getOpenTicketsOptions(){let e="";return(this.allData?.chamadosB2B||[]).filter(t=>{const a=(t["Agendamento / Acesso"]||"").toUpperCase();return!a.includes("CONCLUÍDO")&&!a.includes("CANCELADO")}).forEach(t=>{e+=`<option value="B2B|${t._rowIndex}|Chamados B2B">[B2B] ${t["Cliente / Empresa"]} - ${t["Agendamento / Acesso"]}</option>`}),(this.allData?.incidentes||[]).filter(t=>{const a=(t.Status||"").toUpperCase();return!a.includes("CONCLUÍDO")&&!a.includes("CANCELADO")&&!a.includes("FINALIZADO")}).forEach(t=>{e+=`<option value="INC|${t._rowIndex}|Incidentes">[INC] ${t.Origem} - ${t["Ativo Relacionado"]}</option>`}),e}_promptCamera(){return new Promise(e=>{const t=document.createElement("input");t.type="file",t.accept="image/*",t.capture="environment",t.onchange=a=>{e(a.target.files[0]||null)},t.click()})}_showLoading(e){const t=document.createElement("div");return t.className="modal-overlay",t.innerHTML=`
      <div class="modal-content" style="text-align:center; padding: 40px; background:var(--bg-card);">
        <div class="spinner" style="margin: 0 auto 16px;"></div>
        <p style="color:var(--text); font-weight:500;">${e}</p>
      </div>
    `,document.body.appendChild(t),t}renderLoading(){this.container&&(this.container.innerHTML=`
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">📦 Estoque VERO</h2></div></div>
      <div class="data-table-wrap">
        <div style="padding:20px;">
          ${Array(5).fill('<div class="skeleton skeleton-card" style="height:40px; margin-bottom:8px;"></div>').join("")}
        </div>
      </div>
    `)}},Et="modulepreload",xt=function(e){return"/"+e},ne={},St=function(t,a,s){let i=Promise.resolve();if(a&&a.length>0){let d=function(p){return Promise.all(p.map(h=>Promise.resolve(h).then(v=>({status:"fulfilled",value:v}),v=>({status:"rejected",reason:v}))))},c=function(p){return import.meta.resolve?import.meta.resolve(p):new URL(p,import.meta.url).href};const o=document.getElementsByTagName("link"),r=document.querySelector("meta[property=csp-nonce]"),l=r?.nonce||r?.getAttribute("nonce");i=d(a.map(p=>{if(p=xt(p,s),p=c(p),p in ne)return;ne[p]=!0;const h=p.endsWith(".css");for(let g=o.length-1;g>=0;g--){const b=o[g];if(b.href===p&&(!h||b.rel==="stylesheet"))return}const v=document.createElement("link");if(v.rel=h?"stylesheet":Et,h||(v.as="script"),v.crossOrigin="",v.href=p,l&&v.setAttribute("nonce",l),document.head.appendChild(v),h)return new Promise((g,b)=>{v.addEventListener("load",g),v.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${p}`)))})}))}function n(o){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=o,window.dispatchEvent(r),!r.defaultPrevented)throw o}return i.then(o=>{for(const r of o||[])r.status==="rejected"&&n(r.reason);return t().catch(n)})},wt=class{constructor(){this.currentModule="dashboard",this.modules={dashboard:new ft,b2b:new mt,incidentes:new gt,vistorias:new bt,infra:new yt,pops:new Ct,estoque:new At},this.moduleTitles={dashboard:"Painel Operacional",b2b:"Chamados B2B",incidentes:"Incidentes",vistorias:"Vistorias RJ",infra:"Infraestrutura",pops:"POPs & Preventivas",estoque:"Estoque VERO"},this.data=null,this.isSyncing=!1}async init(){this._initModules(),this._bindNavigation(),this._bindSyncButton(),this._createFAB(),this._initPullToRefresh(),this._updateSyncUI("loading"),Object.values(this.modules).forEach(e=>{e.renderLoading&&e.renderLoading()}),this._setupAuth(),me(e=>{this._updatePendingBadge(e)}),this._updatePendingBadge(fe()),Ue(e=>{this.data=e;const t=V();t&&(se(e.acessos,t.email),this._handleAuthStateChanged(t)),this._renderCurrentModule(),this._updateBadges(),this._updateSyncUI("success")});try{await k()}catch(e){console.error("Failed initial fetch:",e),this._updateSyncUI("error")}Pe(12e4)}_initModules(){Object.keys(this.modules).forEach(e=>{const t=document.getElementById(`module-${e}`);t&&(this.modules[e].init(t),this.modules[e].setEditCallback&&this.modules[e].setEditCallback((a,s)=>{nt(a,s,this.data?.apoioListas,i=>{this._renderCurrentModule(),G("Sincronizando com a planilha..."),I()})}))})}_bindNavigation(){const e=document.querySelectorAll(".nav-item, .mobile-nav-item");e.forEach(t=>{t.addEventListener("click",a=>{a.preventDefault(),e.forEach(o=>o.classList.remove("active"));const s=t.dataset.target;document.querySelectorAll(`[data-target="${s}"]`).forEach(o=>{o.classList.add("active")}),this.currentModule=s;const i=document.getElementById("header-page-title");i&&(i.textContent=this.moduleTitles[s]||"VERO Operações"),document.querySelectorAll(".module-view").forEach(o=>{o.classList.remove("active")});const n=document.getElementById(`module-${s}`);n&&n.classList.add("active"),this._renderCurrentModule(),this._updateFABVisibility()})})}_bindSyncButton(){const e=document.getElementById("btn-force-sync");e&&e.addEventListener("click",async()=>{if(!this.isSyncing){this.isSyncing=!0,this._updateSyncUI("loading");try{await k(!0),I()}catch(t){console.error("Sync failed:",t),this._updateSyncUI("error")}finally{this.isSyncing=!1}}})}_renderCurrentModule(){if(!this.data)return;const e=this.modules[this.currentModule];e&&e.render&&e.render(this.data)}_updateBadges(){if(!this.data)return;const e=document.getElementById("badge-b2b");if(e&&this.data.chamadosB2B){const a=this.data.chamadosB2B.filter(s=>{const i=(s["Agendamento / Acesso"]||"").toUpperCase();return!i.includes("NORMALIZADO")&&!i.includes("CANCELADO")}).length;e.textContent=a,e.style.display=a>0?"inline-block":"none"}const t=document.getElementById("badge-incidentes");if(t&&this.data.incidentes){const a=this.data.incidentes.filter(s=>{const i=(s.Status||"").toUpperCase();return i.includes("PENDENTE")||i.includes("VALIDAÇÃO")||i.includes("VALIDACAO")}).length;t.textContent=a,t.style.display=a>0?"inline-block":"none"}}_updateSyncUI(e){const t=document.getElementById("sync-status"),a=document.getElementById("sync-text"),s=document.getElementById("btn-force-sync");!t||!a||!s||(t.className="sync-indicator",s.classList.remove("loading"),e==="loading"?(t.classList.add("loading"),a.textContent="Sincronizando...",s.classList.add("loading")):e==="success"?(a.textContent="Atualizado agora",setTimeout(()=>{this.isSyncing||(a.textContent="Sincronizado")},5e3)):e==="error"&&(t.classList.add("error"),a.textContent="Modo Offline"))}_updatePendingBadge(e){let t=document.getElementById("pending-badge");if(e>0){if(!t){t=document.createElement("div"),t.id="pending-badge",t.className="pending-sync-badge";const a=document.querySelector(".header-right");a&&a.prepend(t)}t.innerHTML=`
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27"/>
        </svg>
        ${e} pendente${e>1?"s":""}
      `,t.style.display="flex"}else t&&(t.style.display="none")}_setupAuth(){qe(),ze(h=>this._handleAuthStateChanged(h));const e=document.getElementById("nebula-login-btn"),t=document.getElementById("nebula-email"),a=document.getElementById("nebula-password"),s=document.getElementById("nebula-name"),i=document.getElementById("nebula-group-name"),n=document.getElementById("nebula-tab-login"),o=document.getElementById("nebula-tab-register"),r=document.getElementById("nebula-tab-marker"),l=document.getElementById("nebula-error");let d=!1;const c=h=>{d=h==="register",l.style.display="none",d?(n.style.opacity="0.5",n.classList.remove("active"),o.style.opacity="1",o.classList.add("active"),r.style.left="calc(50% + 4px)",i.style.display="flex",e.textContent="CREATE ACCOUNT"):(o.style.opacity="0.5",o.classList.remove("active"),n.style.opacity="1",n.classList.add("active"),r.style.left="4px",i.style.display="none",e.textContent="LOGIN")};n&&o&&(n.addEventListener("click",()=>c("login")),o.addEventListener("click",()=>c("register")));const p=async()=>{const h=t.value.trim(),v=a.value.trim();if(!(!h||!v)){if(!this.data||!this.data.acessos){S("Aguarde os dados carregarem...");return}if(d){const g=s.value.trim();if(!g){l.textContent="Preencha seu nome completo.",l.style.display="block";return}if(this.data.acessos.find(b=>(b.Email||"").trim().toLowerCase()===h.toLowerCase())){l.textContent="Este e-mail já está cadastrado.",l.style.display="block";return}e.disabled=!0,e.textContent="ENVIANDO...";try{const{enqueueWrite:b}=await St(async()=>{const{enqueueWrite:N}=await Promise.resolve().then(()=>Xe);return{enqueueWrite:N}},void 0),Ae=this.data.acessos[0]||{Nome:"",Email:"",Perfil:"",Senha:""},X=Object.keys(Ae).filter(N=>N!=="_rowIndex"),Ee=X.map(N=>{const R=N.toLowerCase();return R.includes("nome")?g:R.includes("email")?h:R.includes("senha")?v:R.includes("perfil")?"PENDENTE":""});b("append",{sheetName:"Acessos",rowData:X.length>0?Ee:[g,h,"PENDENTE",v]}),H("Solicitação enviada! Aguarde a aprovação do administrador."),c("login"),a.value="",s.value=""}catch(b){console.error(b),S("Erro ao solicitar acesso.")}finally{e.disabled=!1,e.textContent="LOGIN"}}else Fe(h,v,this.data.acessos)||(l.textContent="E-mail ou senha incorretos.",l.style.display="block")}};if(e){e.addEventListener("click",p);const h=v=>{v.key==="Enter"&&p()};t.addEventListener("keypress",h),a.addEventListener("keypress",h)}this._handleAuthStateChanged(V())}_handleAuthStateChanged(e){const t=document.getElementById("user-profile-container");if(t)if(e){this.data&&this.data.acessos&&se(this.data.acessos,e.email),this._applyRBAC(e);const a=Ze();t.innerHTML=`
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <img src="${e.picture}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--teal);">
          <div>
            <div style="font-size: 14px; font-weight: 600; color: var(--text);">${e.name}</div>
            <div style="font-size: 10px; color: var(--teal); background: var(--teal-dim); padding: 2px 10px; border-radius: 12px; margin-top: 4px; text-align: center; font-weight: 600;">${a}</div>
          </div>
          <button id="logout-btn" style="background: none; border: none; color: var(--coral); font-size: 12px; cursor: pointer; margin-top: 4px; padding: 4px;">Sair</button>
        </div>
      `,document.getElementById("logout-btn").addEventListener("click",()=>He());const s=document.getElementById("nebula-login-overlay");s&&s.classList.add("hidden")}else{t.innerHTML="",this._applyRBAC(null);const a=document.getElementById("nebula-login-overlay");a&&(a.classList.remove("hidden"),document.getElementById("nebula-error").style.display="none",document.getElementById("nebula-password").value="")}}_applyRBAC(e){const t=document.querySelectorAll(".nav-item, .mobile-nav-item");if(!e){t.forEach(s=>{s.style.display=s.dataset.target==="dashboard"?"flex":"none"});return}const a=le();if(t.forEach(s=>{const i=s.dataset.target;s.style.display=a.includes(i)?"flex":"none"}),!a.includes(this.currentModule)){const s=Ye();if(s){const i=Array.from(t).find(n=>n.dataset.target===s);i&&i.click()}}this._updateFABVisibility()}_createFAB(){const e=document.createElement("button");e.className="fab",e.id="fab-create",e.innerHTML=`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    `,e.style.display="none",e.addEventListener("click",()=>{this.data&&ut(this.currentModule,this.data.apoioListas,()=>{G("Sincronizando novo registro..."),I(),setTimeout(()=>k(),2e3)})}),document.body.appendChild(e)}_updateFABVisibility(){const e=document.getElementById("fab-create");if(!e)return;const t=re(this.currentModule);e.style.display=t?"flex":"none"}_initPullToRefresh(){const e=document.querySelector(".app-content");if(!e)return;let t=0,a=!1,s=null;e.addEventListener("touchstart",i=>{e.scrollTop<=0&&(t=i.touches[0].clientY,a=!0)},{passive:!0}),e.addEventListener("touchmove",i=>{if(!a)return;const n=i.touches[0].clientY-t;n>0&&n<120&&(s||(s=document.createElement("div"),s.className="pull-refresh-indicator",s.innerHTML=`
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" style="width:20px;height:20px">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27"/>
            </svg>
            <span>Solte para atualizar</span>
          `,e.prepend(s)),s.style.opacity=Math.min(1,n/80),s.style.transform=`translateY(${n/2}px)`)},{passive:!0}),e.addEventListener("touchend",async()=>{if(!a||!s){a=!1;return}if(a=!1,parseFloat(s.style.transform.match(/translateY\((.+)px\)/)?.[1]||0)>40){s.innerHTML='<div class="btn-spinner"></div><span>Atualizando...</span>';try{await k(!0),I()}catch(i){console.error("Pull refresh failed:",i)}}s&&(s.remove(),s=null)})}};document.addEventListener("DOMContentLoaded",()=>{window.app=new wt,window.app.init()});
