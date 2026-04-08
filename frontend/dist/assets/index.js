(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))l(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&l(o)}).observe(document,{childList:!0,subtree:!0});function a(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function l(s){if(s.ep)return;s.ep=!0;const i=a(s);fetch(s.href,i)}})();const t={dbPath:"",params:{existence_filter:"all",selected_subdirs:[],subdir_query:"",selected_prompts:[],sort_option:"created_desc",search_query:"",search_in:"filename_or_prompt",page:1,items_per_page:10},result:null,stats:null,allSubdirs:[],allPrompts:[],thumbnailSize:300,editingIndex:null};window.addEventListener("DOMContentLoaded",async()=>{L(),await _(),x()});let u={};async function _(){if(u=await window.go.main.App.GetConfig(),u.sidebar_width&&(document.getElementById("sidebar").style.width=u.sidebar_width+"px"),u.last_database_path){const n=u.last_database_path.split(/[\\/]/).pop(),e=document.getElementById("load-last-btn");e.innerHTML=`🔄 Load Last <span style="font-size:0.7rem; opacity:0.7; display:block; overflow:hidden; text-overflow:ellipsis;">(${n})</span>`,e.title=u.last_database_path}}async function h(){const n=document.getElementById("sidebar"),e=window.innerWidth,a=window.innerHeight,l=parseInt(n.style.width)||280;await window.go.main.App.SaveWindowState(e,a,l)}function L(){document.getElementById("app").innerHTML=`
    <div id="sidebar">
      <div class="sidebar-section-title">⚙️ Settings</div>
      <input type="text" id="db-path-input" placeholder="Path to .parquet file..." />
      <button id="browse-btn" class="full" style="margin-top: 6px;">📂 Browse</button>
      <button id="load-last-btn" class="full secondary" style="margin-top: 6px;">🔄 Load Last</button>
      <div id="db-status" style="margin-top: 6px;"></div>
      <hr class="divider" />
      <div class="sidebar-section-title">Statistics</div>
      <div id="stats-area"></div>
      <hr class="divider" />
      <div class="sidebar-section-title">Display</div>
      <label class="page-slider-label">Thumbnail Size</label>
      <input type="range" id="thumb-slider" min="150" max="500" step="50" value="300" />
      <label class="page-slider-label" style="margin-top: 8px; display:block;">Items per page</label>
      <select id="items-per-page">
        <option value="5">5</option>
        <option value="10" selected>10</option>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
      <hr class="divider" />
      <div class="sidebar-section-title">Filters</div>
      <label class="page-slider-label">Subdirectory Filter</label>
      <div id="subdir-multiselect" class="multi-select-container"></div>
      <input type="text" id="subdir-query" placeholder="Subdirectory query..." style="margin-top:6px;"/>
      <div style="margin-top:10px; font-size:0.86rem; color: var(--nord5);">
        <label><input type="radio" name="existence" value="all" checked> All</label><br>
        <label><input type="radio" name="existence" value="found"> Found Only</label><br>
        <label><input type="radio" name="existence" value="missing"> Missing Only</label>
      </div>
      <div id="prompt-filter-section" style="display:none; margin-top: 10px;">
        <label class="page-slider-label">Prompt Filter</label>
        <div id="prompt-multiselect" class="multi-select-container"></div>
      </div>
      <hr class="divider" />
      <div class="sidebar-section-title">Sorting</div>
      <select id="sort-option">
        <option value="name_asc">Image Name (A-Z)</option>
        <option value="name_desc">Image Name (Z-A)</option>
        <option value="prompt_asc">Prompt (A-Z)</option>
        <option value="prompt_desc">Prompt (Z-A)</option>
        <option value="created_desc" selected>Created (Newest First)</option>
        <option value="created_asc">Created (Oldest First)</option>
        <option value="modified_desc">Modified (Newest First)</option>
        <option value="modified_asc">Modified (Oldest First)</option>
      </select>
      <hr class="divider" />
      <div class="sidebar-section-title">Search</div>
      <select id="search-in" style="margin-bottom:6px;">
        <option value="filename_or_prompt">Filename OR Prompt</option>
        <option value="prompt">Prompt Only</option>
        <option value="filename">Filename Only</option>
        <option value="full_path">Full Path</option>
        <option value="all">All</option>
      </select>
      <input type="text" id="search-query" placeholder="Search..." />
    </div>
    <div id="resizer"></div>
    <div id="main">
      <div class="header-container">
        <img src="/logo.png" class="app-logo" alt="goParquet Logo" />
        <h1 class="page-title">goParquet</h1>
      </div>
      <p class="page-subtitle">Browse · Search · Edit · Export — AI prompt database viewer</p>
      <div id="gallery"></div>
      <div id="pagination"></div>
      <footer>goParquet &nbsp;·&nbsp; Wails &nbsp;·&nbsp; Parquet</footer>
    </div>
  `}function x(){const n=document.getElementById("db-path-input");n.addEventListener("keypress",i=>{i.key==="Enter"&&y(n.value)}),document.getElementById("browse-btn").addEventListener("click",async()=>{const i=await window.go.main.App.OpenFilePicker();i&&(n.value=i,await y(i))}),document.getElementById("load-last-btn").addEventListener("click",async()=>{const i=await window.go.main.App.GetLastDatabasePath();i?(n.value=i,await y(i)):alert("No last database found.")}),document.getElementById("thumb-slider").addEventListener("input",i=>{t.thumbnailSize=parseInt(i.target.value,10),g()});const e=()=>{t.params.page=1,m()};document.getElementById("items-per-page").addEventListener("change",i=>{t.params.items_per_page=parseInt(i.target.value,10),e()}),document.querySelectorAll('input[name="existence"]').forEach(i=>{i.addEventListener("change",o=>{t.params.existence_filter=o.target.value,e()})}),document.getElementById("subdir-query").addEventListener("input",v(i=>{t.params.subdir_query=i.target.value,e()},300)),document.getElementById("sort-option").addEventListener("change",i=>{t.params.sort_option=i.target.value,e()}),document.getElementById("search-in").addEventListener("change",i=>{t.params.search_in=i.target.value,e()}),document.getElementById("search-query").addEventListener("input",v(i=>{t.params.search_query=i.target.value,e()},300)),document.addEventListener("click",i=>{document.querySelectorAll(".multi-select-dropdown").forEach(o=>{o.parentElement.contains(i.target)||o.classList.remove("open")})});const a=document.getElementById("resizer"),l=document.getElementById("sidebar");let s=!1;a.addEventListener("mousedown",i=>{s=!0,a.classList.add("active"),document.body.style.cursor="col-resize",i.preventDefault()}),document.addEventListener("mousemove",i=>{if(!s)return;const o=i.clientX;o>=150&&o<=800&&(l.style.width=o+"px")}),document.addEventListener("mouseup",async()=>{s&&(s=!1,a.classList.remove("active"),document.body.style.cursor="default",await h())}),window.addEventListener("resize",v(async()=>{await h()},500))}function f(n,e){const a=document.getElementById("db-status");a.innerHTML=`<div class="banner ${n}">${e}</div>`}function $(n){f("info",'<div class="spinner"></div> Loading...')}async function y(n){$();const e=await window.go.main.App.LoadDatabase(n);if(e){f("error","❌ "+e);return}t.dbPath=n,f("success","✓ Valid database file"),await _(),await I(),await m()}async function I(){t.stats=await window.go.main.App.GetStats();const n=document.getElementById("stats-area");n.innerHTML=`
    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Total Entries</div><div class="metric-value">${t.stats.total_entries}</div></div>
      <div class="metric-card"><div class="metric-label">Images Found</div><div class="metric-value">${t.stats.images_found}</div></div>
      <div class="metric-card"><div class="metric-label">Images Missing</div><div class="metric-value">${t.stats.images_missing}</div></div>
      <div class="metric-card"><div class="metric-label">Unique Prompts</div><div class="metric-value">${t.stats.unique_prompts}</div></div>
    </div>
    <div class="caption">📅 Date range: ${t.stats.oldest_date||"?"} to ${t.stats.newest_date||"?"}</div>
    <div class="caption">💾 Database size: ${t.stats.file_size_str||"?"}</div>
  `}async function m(){t.result=await window.go.main.App.GetPage(t.params),t.allSubdirs=t.result.all_subdirs||[],t.allPrompts=t.result.all_prompts||[],w("subdir-multiselect",t.allSubdirs,t.params.selected_subdirs,"Subdirectories",e=>{t.params.selected_subdirs=e,t.params.page=1,m()});const n=document.getElementById("prompt-filter-section");t.stats&&t.stats.unique_prompts>1?(n.style.display="block",w("prompt-multiselect",t.allPrompts,t.params.selected_prompts,"Prompts",e=>{t.params.selected_prompts=e,t.params.page=1,m()})):n.style.display="none",await g(),B(),document.getElementById("main").scrollTo({top:0,behavior:"smooth"})}function w(n,e,a,l,s){const i=document.getElementById(n);let c=`
    <button class="multi-select-toggle">${a.length===0?`All ${l}`:`${a.length} selected`} ▼</button>
    <div class="multi-select-dropdown">
  `;e.forEach(r=>{const b=a.includes(r)?"checked":"";c+=`
      <label class="multi-select-option">
        <input type="checkbox" value="${r.replace(/"/g,"&quot;")}" ${b} />
        ${r}
      </label>
    `}),c+="</div>",i.innerHTML=c;const p=i.querySelector(".multi-select-toggle"),d=i.querySelector(".multi-select-dropdown");p.addEventListener("click",r=>{r.stopPropagation(),d.classList.toggle("open")}),d.addEventListener("change",()=>{const r=Array.from(d.querySelectorAll("input:checked")).map(b=>b.value);s(r)})}async function g(){const n=document.getElementById("gallery");if(n.innerHTML="",!t.result||!t.result.entries||t.result.entries.length===0){n.innerHTML='<div class="banner info">No entries found.</div>';return}for(let e=0;e<t.result.entries.length;e++){const a=t.result.entries[e],l=document.createElement("div");l.className="entry-card",n.appendChild(l);const s=document.createElement("div");s.className="img-col",s.innerHTML='<div class="spinner"></div>',l.appendChild(s);const i=document.createElement("div");l.appendChild(i);const o=a.image_path.split(/[\\/]/).pop();let c=`<div class="filename-box">🖼️ ${o}</div>`;const p=[];if(a.created_at){const d=new Date(a.created_at);isNaN(d)||p.push(`Created: ${d.toLocaleString()}`)}if(a.modified_at){const d=new Date(a.modified_at);isNaN(d)||p.push(`Modified: ${d.toLocaleString()}`)}p.length>0&&(c+=`<div class="timestamp-box">${p.join(" · ")}</div>`),c+=`<div class="image-meta-box last" id="meta-${e}">Loading meta...</div>`,c+=`<div class="prompt-label">Prompt: ${a.prompt||"N/A"}</div>`,t.editingIndex===e?c+=`
        <textarea class="edit-area" id="edit-area-${e}">${a.description}</textarea>
        <div class="edit-btn-row">
          <button class="primary" id="save-btn-${e}">💾 Save</button>
          <button id="cancel-btn-${e}">❌ Cancel</button>
          <div></div>
        </div>
      `:c+=`
        <div class="description-box">${S(a.description)}</div>
        <div class="action-row">
          <button id="edit-btn-${e}">✏️ Edit</button>
          <button id="copy-btn-${e}">📋 Copy</button>
          <button id="path-btn-${e}">📁 Path</button>
          <button id="txt-btn-${e}">💾 Text</button>
        </div>
      `,c+=`<div class="caption">📝 ${a.description?a.description.length:0} characters | Full path: ${a.image_path}</div>`,i.innerHTML=c,t.editingIndex===e?(document.getElementById(`save-btn-${e}`).addEventListener("click",async()=>{const d=document.getElementById(`edit-area-${e}`).value,r=await window.go.main.App.SaveDescription(a.image_path,d);if(r){alert(r);return}t.editingIndex=null,await m()}),document.getElementById(`cancel-btn-${e}`).addEventListener("click",()=>{t.editingIndex=null,g()})):(document.getElementById(`edit-btn-${e}`).addEventListener("click",()=>{t.editingIndex=e,g()}),document.getElementById(`copy-btn-${e}`).addEventListener("click",async d=>{await window.runtime.ClipboardSetText(a.description||""),E(d.target,"✓ Copied!")}),document.getElementById(`path-btn-${e}`).addEventListener("click",async d=>{await window.runtime.ClipboardSetText(a.image_path||""),E(d.target,"✓ Copied!")}),document.getElementById(`txt-btn-${e}`).addEventListener("click",async()=>{const d=await window.go.main.App.SaveTextFile(o+".txt",a.description||"");d&&alert(d)})),window.go.main.App.GetThumbnail(a.image_path,t.thumbnailSize).then(d=>{d?s.innerHTML=`<img src="${d}" style="width:${t.thumbnailSize}px" />`:s.innerHTML='<div class="banner error">Image Missing</div>'}),window.go.main.App.GetImageMeta(a.image_path).then(d=>{const r=document.getElementById(`meta-${e}`);d&&r&&(d.exists?d.width>0?r.innerHTML=`📐 ${d.width}x${d.height} (${d.megapixels.toFixed(1)} MP) · ⬛ Ratio: ${d.aspect_ratio} · 💾 ${d.file_size_kb.toFixed(1)} KB`:r.innerHTML=`💾 ${d.file_size_kb.toFixed(1)} KB (Not an image)`:r.innerHTML="File does not exist on disk")})}}function B(){const n=document.getElementById("pagination");if(!t.result||t.result.total_items===0){n.innerHTML="";return}const e=t.result.current_page,a=t.result.total_pages;n.innerHTML=`
    <div class="page-btn-row">
      <button id="pg-first" ${e<=1?"disabled":""}>⏮️ First</button>
      <button id="pg-prev" ${e<=1?"disabled":""}>◀️ Previous</button>
      <button id="pg-next" ${e>=a?"disabled":""}>Next ▶️</button>
      <button id="pg-last" ${e>=a?"disabled":""}>Last ⏭️</button>
    </div>
    <div class="page-slider-label">Page ${e} of ${a}</div>
    <input type="range" id="pg-slider" min="1" max="${a}" value="${e}" />
  `;const l=s=>{t.params.page=s,m()};document.getElementById("pg-first").addEventListener("click",()=>l(1)),document.getElementById("pg-prev").addEventListener("click",()=>l(e-1)),document.getElementById("pg-next").addEventListener("click",()=>l(e+1)),document.getElementById("pg-last").addEventListener("click",()=>l(a)),document.getElementById("pg-slider").addEventListener("input",v(s=>{l(parseInt(s.target.value,10))},200))}function E(n,e,a=2e3){const l=n.textContent;n.textContent=e,n.classList.add("success"),setTimeout(()=>{n.textContent=l,n.classList.remove("success")},a)}function S(n){return n?n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function v(n,e){let a;return function(...l){clearTimeout(a),a=setTimeout(()=>n.apply(this,l),e)}}
