(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))d(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&d(r)}).observe(document,{childList:!0,subtree:!0});function n(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function d(s){if(s.ep)return;s.ep=!0;const i=n(s);fetch(s.href,i)}})();const t={dbPath:"",params:{existence_filter:"all",selected_subdirs:[],subdir_query:"",selected_prompts:[],sort_option:"created_desc",search_query:"",search_in:"filename_or_prompt",page:1,items_per_page:10},result:null,stats:null,allSubdirs:[],allPrompts:[],thumbnailSize:300,editingIndex:null};window.addEventListener("DOMContentLoaded",()=>{E(),_()});function E(){document.getElementById("app").innerHTML=`
    <div id="sidebar">
      <div class="sidebar-section-title">⚙️ Settings</div>
      <input type="text" id="db-path-input" placeholder="Path to .parquet file..." />
      <button id="browse-btn" class="full" style="margin-top: 6px;">📂 Browse</button>
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
      <h1 class="page-title">🖼️ Image Gallery Viewer</h1>
      <p class="page-subtitle">Browse · Search · Edit · Export — AI prompt database viewer</p>
      <div id="gallery"></div>
      <div id="pagination"></div>
      <footer>Image Gallery Viewer &nbsp;·&nbsp; Wails &nbsp;·&nbsp; Parquet</footer>
    </div>
  `}function _(){const a=document.getElementById("db-path-input");a.addEventListener("keypress",i=>{i.key==="Enter"&&y(a.value)}),document.getElementById("browse-btn").addEventListener("click",async()=>{const i=await window.go.main.App.OpenFilePicker();i&&(a.value=i,await y(i))}),document.getElementById("thumb-slider").addEventListener("input",i=>{t.thumbnailSize=parseInt(i.target.value,10),m()});const e=()=>{t.params.page=1,u()};document.getElementById("items-per-page").addEventListener("change",i=>{t.params.items_per_page=parseInt(i.target.value,10),e()}),document.querySelectorAll('input[name="existence"]').forEach(i=>{i.addEventListener("change",r=>{t.params.existence_filter=r.target.value,e()})}),document.getElementById("subdir-query").addEventListener("input",b(i=>{t.params.subdir_query=i.target.value,e()},300)),document.getElementById("sort-option").addEventListener("change",i=>{t.params.sort_option=i.target.value,e()}),document.getElementById("search-in").addEventListener("change",i=>{t.params.search_in=i.target.value,e()}),document.getElementById("search-query").addEventListener("input",b(i=>{t.params.search_query=i.target.value,e()},300)),document.addEventListener("click",i=>{document.querySelectorAll(".multi-select-dropdown").forEach(r=>{r.parentElement.contains(i.target)||r.classList.remove("open")})});const n=document.getElementById("resizer"),d=document.getElementById("sidebar");let s=!1;n.addEventListener("mousedown",i=>{s=!0,n.classList.add("active"),document.body.style.cursor="col-resize",i.preventDefault()}),document.addEventListener("mousemove",i=>{if(!s)return;const r=i.clientX;r>=150&&r<=800&&(d.style.width=r+"px")}),document.addEventListener("mouseup",()=>{s&&(s=!1,n.classList.remove("active"),document.body.style.cursor="default")})}function g(a,e){const n=document.getElementById("db-status");n.innerHTML=`<div class="banner ${a}">${e}</div>`}function w(a){g("info",'<div class="spinner"></div> Loading...')}async function y(a){w();const e=await window.go.main.App.LoadDatabase(a);if(e){g("error","❌ "+e);return}t.dbPath=a,g("success","✓ Valid database file"),await L(),await u()}async function L(){t.stats=await window.go.main.App.GetStats();const a=document.getElementById("stats-area");a.innerHTML=`
    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Total Entries</div><div class="metric-value">${t.stats.total_entries}</div></div>
      <div class="metric-card"><div class="metric-label">Images Found</div><div class="metric-value">${t.stats.images_found}</div></div>
      <div class="metric-card"><div class="metric-label">Images Missing</div><div class="metric-value">${t.stats.images_missing}</div></div>
      <div class="metric-card"><div class="metric-label">Unique Prompts</div><div class="metric-value">${t.stats.unique_prompts}</div></div>
    </div>
    <div class="caption">📅 Date range: ${t.stats.oldest_date||"?"} to ${t.stats.newest_date||"?"}</div>
    <div class="caption">💾 Database size: ${t.stats.file_size_str||"?"}</div>
  `}async function u(){t.result=await window.go.main.App.GetPage(t.params),t.allSubdirs=t.result.all_subdirs||[],t.allPrompts=t.result.all_prompts||[],f("subdir-multiselect",t.allSubdirs,t.params.selected_subdirs,"Subdirectories",e=>{t.params.selected_subdirs=e,t.params.page=1,u()});const a=document.getElementById("prompt-filter-section");t.stats&&t.stats.unique_prompts>1?(a.style.display="block",f("prompt-multiselect",t.allPrompts,t.params.selected_prompts,"Prompts",e=>{t.params.selected_prompts=e,t.params.page=1,u()})):a.style.display="none",await m(),x(),document.getElementById("main").scrollTo({top:0,behavior:"smooth"})}function f(a,e,n,d,s){const i=document.getElementById(a);let c=`
    <button class="multi-select-toggle">${n.length===0?`All ${d}`:`${n.length} selected`} ▼</button>
    <div class="multi-select-dropdown">
  `;e.forEach(o=>{const v=n.includes(o)?"checked":"";c+=`
      <label class="multi-select-option">
        <input type="checkbox" value="${o.replace(/"/g,"&quot;")}" ${v} />
        ${o}
      </label>
    `}),c+="</div>",i.innerHTML=c;const p=i.querySelector(".multi-select-toggle"),l=i.querySelector(".multi-select-dropdown");p.addEventListener("click",o=>{o.stopPropagation(),l.classList.toggle("open")}),l.addEventListener("change",()=>{const o=Array.from(l.querySelectorAll("input:checked")).map(v=>v.value);s(o)})}async function m(){const a=document.getElementById("gallery");if(a.innerHTML="",!t.result||!t.result.entries||t.result.entries.length===0){a.innerHTML='<div class="banner info">No entries found.</div>';return}for(let e=0;e<t.result.entries.length;e++){const n=t.result.entries[e],d=document.createElement("div");d.className="entry-card",a.appendChild(d);const s=document.createElement("div");s.className="img-col",s.innerHTML='<div class="spinner"></div>',d.appendChild(s);const i=document.createElement("div");d.appendChild(i);const r=n.image_path.split(/[\\/]/).pop();let c=`<div class="filename-box">🖼️ ${r}</div>`;const p=[];n.created_at&&p.push(`Created: ${new Date(n.created_at).toLocaleString()}`),n.modified_at&&p.push(`Modified: ${new Date(n.modified_at).toLocaleString()}`),p.length>0&&(c+=`<div class="timestamp-box">${p.join(" · ")}</div>`),c+=`<div class="image-meta-box last" id="meta-${e}">Loading meta...</div>`,c+=`<div class="prompt-label">Prompt: ${n.prompt||"N/A"}</div>`,t.editingIndex===e?c+=`
        <textarea class="edit-area" id="edit-area-${e}">${n.description}</textarea>
        <div class="edit-btn-row">
          <button class="primary" id="save-btn-${e}">💾 Save</button>
          <button id="cancel-btn-${e}">❌ Cancel</button>
          <div></div>
        </div>
      `:c+=`
        <div class="description-box">${$(n.description)}</div>
        <div class="action-row">
          <button id="edit-btn-${e}">✏️ Edit</button>
          <button id="copy-btn-${e}">📋 Copy</button>
          <button id="path-btn-${e}">📁 Path</button>
          <button id="txt-btn-${e}">💾 Text</button>
        </div>
      `,c+=`<div class="caption">📝 ${n.description?n.description.length:0} characters | Full path: ${n.image_path}</div>`,i.innerHTML=c,t.editingIndex===e?(document.getElementById(`save-btn-${e}`).addEventListener("click",async()=>{const l=document.getElementById(`edit-area-${e}`).value,o=await window.go.main.App.SaveDescription(n.image_path,l);if(o){alert(o);return}t.editingIndex=null,await u()}),document.getElementById(`cancel-btn-${e}`).addEventListener("click",()=>{t.editingIndex=null,m()})):(document.getElementById(`edit-btn-${e}`).addEventListener("click",()=>{t.editingIndex=e,m()}),document.getElementById(`copy-btn-${e}`).addEventListener("click",async l=>{await window.runtime.ClipboardSetText(n.description||""),h(l.target,"✓ Copied!")}),document.getElementById(`path-btn-${e}`).addEventListener("click",async l=>{await window.runtime.ClipboardSetText(n.image_path||""),h(l.target,"✓ Copied!")}),document.getElementById(`txt-btn-${e}`).addEventListener("click",async()=>{const l=await window.go.main.App.SaveTextFile(r+".txt",n.description||"");l&&alert(l)})),window.go.main.App.GetThumbnail(n.image_path,t.thumbnailSize).then(l=>{l?s.innerHTML=`<img src="${l}" style="width:${t.thumbnailSize}px" />`:s.innerHTML='<div class="banner error">Image Missing</div>'}),window.go.main.App.GetImageMeta(n.image_path).then(l=>{const o=document.getElementById(`meta-${e}`);l&&o&&(l.exists?l.width>0?o.innerHTML=`📐 ${l.width}x${l.height} (${l.megapixels.toFixed(1)} MP) · ⬛ Ratio: ${l.aspect_ratio} · 💾 ${l.file_size_kb.toFixed(1)} KB`:o.innerHTML=`💾 ${l.file_size_kb.toFixed(1)} KB (Not an image)`:o.innerHTML="File does not exist on disk")})}}function x(){const a=document.getElementById("pagination");if(!t.result||t.result.total_items===0){a.innerHTML="";return}const e=t.result.current_page,n=t.result.total_pages;a.innerHTML=`
    <div class="page-btn-row">
      <button id="pg-first" ${e<=1?"disabled":""}>⏮️ First</button>
      <button id="pg-prev" ${e<=1?"disabled":""}>◀️ Previous</button>
      <button id="pg-next" ${e>=n?"disabled":""}>Next ▶️</button>
      <button id="pg-last" ${e>=n?"disabled":""}>Last ⏭️</button>
    </div>
    <div class="page-slider-label">Page ${e} of ${n}</div>
    <input type="range" id="pg-slider" min="1" max="${n}" value="${e}" />
  `;const d=s=>{t.params.page=s,u()};document.getElementById("pg-first").addEventListener("click",()=>d(1)),document.getElementById("pg-prev").addEventListener("click",()=>d(e-1)),document.getElementById("pg-next").addEventListener("click",()=>d(e+1)),document.getElementById("pg-last").addEventListener("click",()=>d(n)),document.getElementById("pg-slider").addEventListener("input",b(s=>{d(parseInt(s.target.value,10))},200))}function h(a,e,n=2e3){const d=a.textContent;a.textContent=e,a.classList.add("success"),setTimeout(()=>{a.textContent=d,a.classList.remove("success")},n)}function $(a){return a?a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function b(a,e){let n;return function(...d){clearTimeout(n),n=setTimeout(()=>a.apply(this,d),e)}}
