(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&r(d)}).observe(document,{childList:!0,subtree:!0});function a(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(s){if(s.ep)return;s.ep=!0;const i=a(s);fetch(s.href,i)}})();const t={dbPath:"",params:{existence_filter:"all",selected_subdirs:[],subdir_query:"",selected_prompts:[],sort_option:"created_desc",search_query:"",search_in:"filename_or_prompt",page:1,items_per_page:10},result:null,stats:null,allSubdirs:[],allPrompts:[],thumbnailSize:300,editingIndex:null};window.addEventListener("DOMContentLoaded",async()=>{L(),await _(),I()});let m={};async function _(){if(m=await window.go.main.App.GetConfig(),m.sidebar_width&&(document.getElementById("sidebar").style.width=m.sidebar_width+"px"),m.last_database_path){const n=m.last_database_path.split(/[\\/]/).pop(),e=document.getElementById("load-last-btn");e.innerHTML=`🔄 Load Last <span style="font-size:0.7rem; opacity:0.7; display:block; overflow:hidden; text-overflow:ellipsis;">(${n})</span>`,e.title=m.last_database_path}}async function w(){const n=document.getElementById("sidebar"),e=window.innerWidth,a=window.innerHeight,r=parseInt(n.style.width)||280;await window.go.main.App.SaveWindowState(e,a,r)}function L(){document.getElementById("app").innerHTML=`
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
      <div style="margin-top:10px; font-size:0.90rem; color: var(--nord5);">
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
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span class="sidebar-section-title" style="margin-bottom:0;">Search</span>
        <span id="search-help" title="Click for help" style="cursor: pointer; opacity: 0.6; font-size: 14px;">ℹ️</span>
      </div>
      <select id="search-in" style="margin-bottom:6px;">
        <option value="filename_or_prompt">Filename OR Prompt</option>
        <option value="prompt">Prompt Only</option>
        <option value="filename">Filename Only</option>
        <option value="full_path">Full Path</option>
        <option value="all">All</option>
      </select>
      <input type="text" id="search-query" placeholder="Search... (+ AND OR NOT /regex/)" />
      <div id="search-result-count" class="caption" style="margin-top:4px; font-size:11px;"></div>
      <div id="search-error" class="banner error" style="display:none; margin-top:8px; font-size:12px; padding:6px;"></div>
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
  `}function I(){const n=document.getElementById("db-path-input");n.addEventListener("keypress",i=>{i.key==="Enter"&&h(n.value)}),document.getElementById("browse-btn").addEventListener("click",async()=>{const i=await window.go.main.App.OpenFilePicker();i&&(n.value=i,await h(i))}),document.getElementById("load-last-btn").addEventListener("click",async()=>{const i=await window.go.main.App.GetLastDatabasePath();i?(n.value=i,await h(i)):alert("No last database found.")}),document.getElementById("thumb-slider").addEventListener("input",i=>{t.thumbnailSize=parseInt(i.target.value,10),b()});const e=()=>{t.params.page=1,p()};document.getElementById("items-per-page").addEventListener("change",i=>{t.params.items_per_page=parseInt(i.target.value,10),e()}),document.querySelectorAll('input[name="existence"]').forEach(i=>{i.addEventListener("change",d=>{t.params.existence_filter=d.target.value,e()})}),document.getElementById("subdir-query").addEventListener("input",v(i=>{t.params.subdir_query=i.target.value,e()},300)),document.getElementById("sort-option").addEventListener("change",i=>{t.params.sort_option=i.target.value,e()}),document.getElementById("search-in").addEventListener("change",i=>{t.params.search_in=i.target.value,e()}),document.getElementById("search-query").addEventListener("input",v(i=>{t.params.search_query=i.target.value,t.params.page=1,p()},300)),document.getElementById("search-help").addEventListener("click",()=>{alert(`Search Query Syntax:
- word : Simple substring match
- word1 + word2 : BOTH must match (AND)
- word1 AND word2 : BOTH must match (AND)
- word1 OR word2 : EITHER must match (OR)
- -word or NOT word : EXCLUDE (NOT)
- "exact phrase" : Match entire phrase
- /regex/ : Regular expression match
- (expr) : Parentheses for grouping

Note: Operators AND, OR, NOT must be uppercase.
Mixed example: (cat OR dog) + fish`)}),document.addEventListener("click",i=>{document.querySelectorAll(".multi-select-dropdown").forEach(d=>{d.parentElement.contains(i.target)||d.classList.remove("open")})});const a=document.getElementById("resizer"),r=document.getElementById("sidebar");let s=!1;a.addEventListener("mousedown",i=>{s=!0,a.classList.add("active"),document.body.style.cursor="col-resize",i.preventDefault()}),document.addEventListener("mousemove",i=>{if(!s)return;const d=i.clientX;d>=150&&d<=800&&(r.style.width=d+"px")}),document.addEventListener("mouseup",async()=>{s&&(s=!1,a.classList.remove("active"),document.body.style.cursor="default",await w())}),window.addEventListener("resize",v(async()=>{await w()},500))}function f(n,e){const a=document.getElementById("db-status");a.innerHTML=`<div class="banner ${n}">${e}</div>`}function $(n){f("info",'<div class="spinner"></div> Loading...')}async function h(n){$();const e=await window.go.main.App.LoadDatabase(n);if(e){f("error","❌ "+e);return}t.dbPath=n,f("success","✓ Valid database file"),await _(),await B(),await p()}async function B(){t.stats=await window.go.main.App.GetStats();const n=document.getElementById("stats-area");n.innerHTML=`
    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Total Entries</div><div class="metric-value">${t.stats.total_entries}</div></div>
      <div class="metric-card"><div class="metric-label">Images Found</div><div class="metric-value">${t.stats.images_found}</div></div>
      <div class="metric-card"><div class="metric-label">Images Missing</div><div class="metric-value">${t.stats.images_missing}</div></div>
      <div class="metric-card"><div class="metric-label">Unique Prompts</div><div class="metric-value">${t.stats.unique_prompts}</div></div>
    </div>
    <div class="caption">📅 Date range: ${t.stats.oldest_date||"?"} to ${t.stats.newest_date||"?"}</div>
    <div class="caption">💾 Database size: ${t.stats.file_size_str||"?"}</div>
  `}async function p(){const n=document.getElementById("search-error"),e=document.getElementById("search-result-count");n.style.display="none",n.innerText="",e.innerText="",t.result=await window.go.main.App.GetPage(t.params),t.result.search_error?(n.innerText=t.result.search_error,n.style.display="block"):t.params.search_query.trim()!==""&&(e.innerText=`${t.result.total_items} result${t.result.total_items===1?"":"s"} found`),t.allSubdirs=t.result.all_subdirs||[],t.allPrompts=t.result.all_prompts||[],E("subdir-multiselect",t.allSubdirs,t.params.selected_subdirs,"Subdirectories",r=>{t.params.selected_subdirs=r,t.params.page=1,p()});const a=document.getElementById("prompt-filter-section");t.stats&&t.stats.unique_prompts>1?(a.style.display="block",E("prompt-multiselect",t.allPrompts,t.params.selected_prompts,"Prompts",r=>{t.params.selected_prompts=r,t.params.page=1,p()})):a.style.display="none",await b(),S(),document.getElementById("main").scrollTo({top:0,behavior:"smooth"})}function E(n,e,a,r,s){const i=document.getElementById(n);let c=`
    <button class="multi-select-toggle">${a.length===0?`All ${r}`:`${a.length} selected`} ▼</button>
    <div class="multi-select-dropdown">
  `;e.forEach(l=>{const y=a.includes(l)?"checked":"";c+=`
      <label class="multi-select-option">
        <input type="checkbox" value="${l.replace(/"/g,"&quot;")}" ${y} />
        ${l}
      </label>
    `}),c+="</div>",i.innerHTML=c;const u=i.querySelector(".multi-select-toggle"),o=i.querySelector(".multi-select-dropdown");u.addEventListener("click",l=>{l.stopPropagation(),o.classList.toggle("open")}),o.addEventListener("change",()=>{const l=Array.from(o.querySelectorAll("input:checked")).map(y=>y.value);s(l)})}async function b(){const n=document.getElementById("gallery");if(n.innerHTML="",!t.result||!t.result.entries||t.result.entries.length===0){n.innerHTML='<div class="banner info">No entries found.</div>';return}for(let e=0;e<t.result.entries.length;e++){const a=t.result.entries[e],r=document.createElement("div");r.className="entry-card",n.appendChild(r);const s=document.createElement("div");s.className="img-col",s.innerHTML='<div class="spinner"></div>',r.appendChild(s);const i=document.createElement("div");r.appendChild(i);const d=a.image_path.split(/[\\/]/).pop();let c=`<div class="filename-box">🖼️ ${g(d)}</div>`;const u=[];if(a.created_at){const o=new Date(a.created_at);isNaN(o)||u.push(`Created: ${o.toLocaleString()}`)}if(a.modified_at){const o=new Date(a.modified_at);isNaN(o)||u.push(`Modified: ${o.toLocaleString()}`)}u.length>0&&(c+=`<div class="timestamp-box">${u.join(" · ")}</div>`),c+=`<div class="image-meta-box last" id="meta-${e}">Loading meta...</div>`,a.prompt&&a.prompt.trim()!==""&&(c+=`<div class="prompt-label">Prompt: ${g(a.prompt)}</div>`),t.editingIndex===e?c+=`
        <textarea class="edit-area" id="edit-area-${e}">${g(a.description)}</textarea>
        <div class="edit-btn-row">
          <button class="primary" id="save-btn-${e}">💾 Save</button>
          <button id="cancel-btn-${e}">❌ Cancel</button>
          <div></div>
        </div>
      `:c+=`
        <div class="description-box">${g(a.description)}</div>
        <div class="action-row">
          <button id="edit-btn-${e}">✏️ Edit</button>
          <button id="copy-btn-${e}">📋 Copy</button>
          <button id="path-btn-${e}">📁 Path</button>
          <button id="txt-btn-${e}">💾 Text</button>
        </div>
      `,c+=`<div class="caption">📝 ${a.description?a.description.length:0} characters | Full path: ${g(a.image_path)}</div>`,i.innerHTML=c,t.editingIndex===e?(document.getElementById(`save-btn-${e}`).addEventListener("click",async()=>{const o=document.getElementById(`edit-area-${e}`).value,l=await window.go.main.App.SaveDescription(a.image_path,o);if(l){alert(l);return}t.editingIndex=null,await p()}),document.getElementById(`cancel-btn-${e}`).addEventListener("click",()=>{t.editingIndex=null,b()})):(document.getElementById(`edit-btn-${e}`).addEventListener("click",()=>{t.editingIndex=e,b()}),document.getElementById(`copy-btn-${e}`).addEventListener("click",async o=>{await window.runtime.ClipboardSetText(a.description||""),x(o.target,"✓ Copied!")}),document.getElementById(`path-btn-${e}`).addEventListener("click",async o=>{await window.runtime.ClipboardSetText(a.image_path||""),x(o.target,"✓ Copied!")}),document.getElementById(`txt-btn-${e}`).addEventListener("click",async()=>{const o=await window.go.main.App.SaveTextFile(d+".txt",a.description||"");o&&alert(o)})),window.go.main.App.GetThumbnail(a.image_path,t.thumbnailSize).then(o=>{o?s.innerHTML=`<img src="${o}" style="width:${t.thumbnailSize}px" />`:s.innerHTML='<div class="banner error">Image Missing</div>'}),window.go.main.App.GetImageMeta(a.image_path).then(o=>{const l=document.getElementById(`meta-${e}`);o&&l&&(o.exists?o.width>0?l.innerHTML=`📐 ${o.width}x${o.height} (${o.megapixels.toFixed(1)} MP) · ⬛ Ratio: ${o.aspect_ratio} · 💾 ${o.file_size_kb.toFixed(1)} KB`:l.innerHTML=`💾 ${o.file_size_kb.toFixed(1)} KB (Not an image)`:l.innerHTML="File does not exist on disk")})}}function S(){const n=document.getElementById("pagination");if(!t.result||t.result.total_items===0){n.innerHTML="";return}const e=t.result.current_page,a=t.result.total_pages;n.innerHTML=`
    <div class="page-btn-row">
      <button id="pg-first" ${e<=1?"disabled":""}>⏮️ First</button>
      <button id="pg-prev" ${e<=1?"disabled":""}>◀️ Previous</button>
      <button id="pg-next" ${e>=a?"disabled":""}>Next ▶️</button>
      <button id="pg-last" ${e>=a?"disabled":""}>Last ⏭️</button>
    </div>
    <div class="page-slider-label">Page ${e} of ${a}</div>
    <input type="range" id="pg-slider" min="1" max="${a}" value="${e}" />
  `;const r=s=>{t.params.page=s,p()};document.getElementById("pg-first").addEventListener("click",()=>r(1)),document.getElementById("pg-prev").addEventListener("click",()=>r(e-1)),document.getElementById("pg-next").addEventListener("click",()=>r(e+1)),document.getElementById("pg-last").addEventListener("click",()=>r(a)),document.getElementById("pg-slider").addEventListener("input",v(s=>{r(parseInt(s.target.value,10))},200))}function x(n,e,a=2e3){const r=n.textContent;n.textContent=e,n.classList.add("success"),setTimeout(()=>{n.textContent=r,n.classList.remove("success")},a)}function g(n){return n?n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function v(n,e){let a;return function(...r){clearTimeout(a),a=setTimeout(()=>n.apply(this,r),e)}}
