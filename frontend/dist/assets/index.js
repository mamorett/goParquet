(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&r(l)}).observe(document,{childList:!0,subtree:!0});function n(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(s){if(s.ep)return;s.ep=!0;const a=n(s);fetch(s.href,a)}})();const t={dbPath:"",params:{existence_filter:"all",selected_subdirs:[],subdir_query:"",selected_prompts:[],sort_option:"created_desc",search_query:"",search_in:"filename_or_prompt",page:1,items_per_page:10},result:null,stats:null,allSubdirs:[],allPrompts:[],allOriginalSubdirs:[],selectedOldPrefix:"",oldPrefixQuery:"",thumbnailSize:300,editingIndex:null};window.addEventListener("DOMContentLoaded",async()=>{O(),await B(),T()});let g={};async function B(){try{if(g=await window.go.main.App.GetConfig(),g.sidebar_width){const r=document.getElementById("sidebar");r&&(r.style.width=g.sidebar_width+"px")}if(g.last_database_path){const r=g.last_database_path.split(/[\\/]/).pop(),s=document.getElementById("load-last-btn");s&&(s.innerHTML=`🔄 Load Last <span style="font-size:0.7rem; opacity:0.7; display:block; overflow:hidden; text-overflow:ellipsis;">(${r})</span>`,s.title=g.last_database_path)}const i=await window.go.main.App.GetPathOverride();t.selectedOldPrefix=i&&i.old||"";const e=document.getElementById("path-override-new");e&&i&&i.new&&(e.value=i.new);const n=document.getElementById("override-status");n&&i&&i.old&&i.new&&(n.innerHTML='<div class="banner success">✓ Override active</div>'),t.allOriginalSubdirs=await window.go.main.App.GetOriginalSubdirs(),f()}catch(i){console.error("Error in applyConfig:",i)}}function f(){const i=t.oldPrefixQuery.toLowerCase(),n=(t.allOriginalSubdirs||[]).filter(s=>s.toLowerCase().includes(i));document.getElementById("path-override-old-dropdown")&&P("path-override-old-dropdown",n,t.selectedOldPrefix,"Directory",s=>{t.selectedOldPrefix=s,f()})}function P(i,e,n,r,s){const a=document.getElementById(i),l=n||`Select ${r}`;let c=`
    <button class="multi-select-toggle" title="${l}">${l} ▼</button>
    <div class="multi-select-dropdown">
  `;e.forEach(o=>{c+=`
      <div class="single-select-option ${o===n?"selected":""}" data-value="${o.replace(/"/g,"&quot;")}">
        ${o}
      </div>
    `}),c+="</div>",a.innerHTML=c;const u=a.querySelector(".multi-select-toggle"),d=a.querySelector(".multi-select-dropdown");u.addEventListener("click",o=>{o.stopPropagation(),d.classList.toggle("open")}),d.querySelectorAll(".single-select-option").forEach(o=>{o.addEventListener("click",()=>{const p=o.getAttribute("data-value");s(p),d.classList.remove("open")})})}const b={};async function x(i){return i in b||(b[i]=await window.go.main.App.ResolveImagePath(i)),b[i]}async function L(){const i=t.selectedOldPrefix,e=document.getElementById("path-override-new").value.trim(),n=await window.go.main.App.SetPathOverride(i,e);if(n){document.getElementById("override-status").innerHTML=`<div class="banner error">${n}</div>`;return}const r=document.getElementById("override-status");i&&e?r.innerHTML='<div class="banner success">✓ Override active</div>':r.innerHTML="";for(const s in b)delete b[s];t.dbPath&&(await S(),await m())}async function _(){const i=document.getElementById("sidebar"),e=window.innerWidth,n=window.innerHeight,r=parseInt(i.style.width)||280;await window.go.main.App.SaveWindowState(e,n,r)}function O(){document.getElementById("app").innerHTML=`
    <div id="sidebar">
      <div class="sidebar-section-title">⚙️ Settings</div>
      <input type="text" id="db-path-input" placeholder="Path to .parquet file..." />
      <button id="browse-btn" class="full" style="margin-top: 6px;">📂 Browse</button>
      <button id="load-last-btn" class="full secondary" style="margin-top: 6px;">🔄 Load Last</button>
      <div id="db-status" style="margin-top: 6px;"></div>
      <div class="sidebar-section-title" style="margin-top:12px;">🗂️ Path Override</div>
      <label class="page-slider-label">Old prefix (in parquet)</label>
      <div id="path-override-old-dropdown" class="multi-select-container"></div>
      <input type="text" id="path-override-old-query" placeholder="Filter directories..." style="margin-top:4px;"/>
      <label class="page-slider-label" style="margin-top:4px;">New prefix (on disk)</label>
      <input type="text" id="path-override-new" placeholder="/new/path/prefix..." />
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:6px;">
        <button id="apply-override-btn" class="primary">Apply</button>
        <button id="clear-override-btn" class="secondary">Clear</button>
      </div>
      <div id="override-status" style="margin-top:4px;"></div>
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
  `}function T(){const i=document.getElementById("db-path-input");i.addEventListener("keypress",a=>{a.key==="Enter"&&w(i.value)}),document.getElementById("browse-btn").addEventListener("click",async()=>{const a=await window.go.main.App.OpenFilePicker();a&&(i.value=a,await w(a))}),document.getElementById("load-last-btn").addEventListener("click",async()=>{const a=await window.go.main.App.GetLastDatabasePath();a?(i.value=a,await w(a)):alert("No last database found.")}),document.getElementById("apply-override-btn").addEventListener("click",L),document.getElementById("clear-override-btn").addEventListener("click",async()=>{t.selectedOldPrefix="",t.oldPrefixQuery="",document.getElementById("path-override-old-query").value="",document.getElementById("path-override-new").value="",f(),await L()}),document.getElementById("path-override-old-query").addEventListener("input",a=>{t.oldPrefixQuery=a.target.value,f()}),document.getElementById("thumb-slider").addEventListener("input",a=>{t.thumbnailSize=parseInt(a.target.value,10),h()});const e=()=>{t.params.page=1,m()};document.getElementById("items-per-page").addEventListener("change",a=>{t.params.items_per_page=parseInt(a.target.value,10),e()}),document.querySelectorAll('input[name="existence"]').forEach(a=>{a.addEventListener("change",l=>{t.params.existence_filter=l.target.value,e()})}),document.getElementById("subdir-query").addEventListener("input",y(a=>{t.params.subdir_query=a.target.value,e()},300)),document.getElementById("sort-option").addEventListener("change",a=>{t.params.sort_option=a.target.value,e()}),document.getElementById("search-in").addEventListener("change",a=>{t.params.search_in=a.target.value,e()}),document.getElementById("search-query").addEventListener("input",y(a=>{t.params.search_query=a.target.value,t.params.page=1,m()},300)),document.getElementById("search-help").addEventListener("click",()=>{alert(`Search Query Syntax:
- word : Simple substring match
- word1 + word2 : BOTH must match (AND)
- word1 AND word2 : BOTH must match (AND)
- word1 OR word2 : EITHER must match (OR)
- -word or NOT word : EXCLUDE (NOT)
- "exact phrase" : Match entire phrase
- /regex/ : Regular expression match
- (expr) : Parentheses for grouping

Note: Operators AND, OR, NOT must be uppercase.
Mixed example: (cat OR dog) + fish`)}),document.addEventListener("click",a=>{document.querySelectorAll(".multi-select-dropdown").forEach(l=>{l.parentElement.contains(a.target)||l.classList.remove("open")})});const n=document.getElementById("resizer"),r=document.getElementById("sidebar");let s=!1;n.addEventListener("mousedown",a=>{s=!0,n.classList.add("active"),document.body.style.cursor="col-resize",a.preventDefault()}),document.addEventListener("mousemove",a=>{if(!s)return;const l=a.clientX;l>=150&&l<=800&&(r.style.width=l+"px")}),document.addEventListener("mouseup",async()=>{s&&(s=!1,n.classList.remove("active"),document.body.style.cursor="default",await _())}),window.addEventListener("resize",y(async()=>{await _()},500))}function E(i,e){const n=document.getElementById("db-status");n.innerHTML=`<div class="banner ${i}">${e}</div>`}function q(i){E("info",'<div class="spinner"></div> Loading...')}async function w(i){q();const e=await window.go.main.App.LoadDatabase(i);if(e){E("error","❌ "+e);return}t.dbPath=i,E("success","✓ Valid database file"),await B(),await S(),await m()}async function S(){t.stats=await window.go.main.App.GetStats();const i=document.getElementById("stats-area");i.innerHTML=`
    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Total Entries</div><div class="metric-value">${t.stats.total_entries}</div></div>
      <div class="metric-card"><div class="metric-label">Images Found</div><div class="metric-value">${t.stats.images_found}</div></div>
      <div class="metric-card"><div class="metric-label">Images Missing</div><div class="metric-value">${t.stats.images_missing}</div></div>
      <div class="metric-card"><div class="metric-label">Unique Prompts</div><div class="metric-value">${t.stats.unique_prompts}</div></div>
    </div>
    <div class="caption">📅 Date range: ${t.stats.oldest_date||"?"} to ${t.stats.newest_date||"?"}</div>
    <div class="caption">💾 Database size: ${t.stats.file_size_str||"?"}</div>
  `}async function m(){const i=document.getElementById("search-error"),e=document.getElementById("search-result-count");i.style.display="none",i.innerText="",e.innerText="",t.result=await window.go.main.App.GetPage(t.params),t.result.search_error?(i.innerText=t.result.search_error,i.style.display="block"):t.params.search_query.trim()!==""&&(e.innerText=`${t.result.total_items} result${t.result.total_items===1?"":"s"} found`),t.allSubdirs=t.result.all_subdirs||[],t.allPrompts=t.result.all_prompts||[],I("subdir-multiselect",t.allSubdirs,t.params.selected_subdirs,"Subdirectories",r=>{t.params.selected_subdirs=r,t.params.page=1,m()});const n=document.getElementById("prompt-filter-section");t.stats&&t.stats.unique_prompts>1?(n.style.display="block",I("prompt-multiselect",t.allPrompts,t.params.selected_prompts,"Prompts",r=>{t.params.selected_prompts=r,t.params.page=1,m()})):n.style.display="none",await h(),M(),document.getElementById("main").scrollTo({top:0,behavior:"smooth"})}function I(i,e,n,r,s){const a=document.getElementById(i);let c=`
    <button class="multi-select-toggle">${n.length===0?`All ${r}`:`${n.length} selected`} ▼</button>
    <div class="multi-select-dropdown">
  `;e.forEach(o=>{const p=n.includes(o)?"checked":"";c+=`
      <label class="multi-select-option">
        <input type="checkbox" value="${o.replace(/"/g,"&quot;")}" ${p} />
        ${o}
      </label>
    `}),c+="</div>",a.innerHTML=c;const u=a.querySelector(".multi-select-toggle"),d=a.querySelector(".multi-select-dropdown");u.addEventListener("click",o=>{o.stopPropagation(),d.classList.toggle("open")}),d.addEventListener("change",()=>{const o=Array.from(d.querySelectorAll("input:checked")).map(p=>p.value);s(o)})}async function h(){const i=document.getElementById("gallery");if(i.innerHTML="",!t.result||!t.result.entries||t.result.entries.length===0){i.innerHTML='<div class="banner info">No entries found.</div>';return}for(let e=0;e<t.result.entries.length;e++){const n=t.result.entries[e],r=document.createElement("div");r.className="entry-card",i.appendChild(r);const s=document.createElement("div");s.className="img-col",s.innerHTML='<div class="spinner"></div>',r.appendChild(s);const a=document.createElement("div");r.appendChild(a);const l=n.image_path.split(/[\\/]/).pop();let c=`<div class="filename-box">🖼️ ${v(l)}</div>`;const u=[];if(n.created_at){const d=new Date(n.created_at);isNaN(d)||u.push(`Created: ${d.toLocaleString()}`)}if(n.modified_at){const d=new Date(n.modified_at);isNaN(d)||u.push(`Modified: ${d.toLocaleString()}`)}u.length>0&&(c+=`<div class="timestamp-box">${u.join(" · ")}</div>`),c+=`<div class="image-meta-box last" id="meta-${e}">Loading meta...</div>`,n.prompt&&n.prompt.trim()!==""&&(c+=`<div class="prompt-label">Prompt: ${v(n.prompt)}</div>`),t.editingIndex===e?c+=`
        <textarea class="edit-area" id="edit-area-${e}">${v(n.description)}</textarea>
        <div class="edit-btn-row">
          <button class="primary" id="save-btn-${e}">💾 Save</button>
          <button id="cancel-btn-${e}">❌ Cancel</button>
          <div></div>
        </div>
      `:c+=`
        <div class="description-box">${v(n.description)}</div>
        <div class="action-row">
          <button id="edit-btn-${e}">✏️ Edit</button>
          <button id="copy-btn-${e}">📋 Copy</button>
          <button id="path-btn-${e}">📁 Path</button>
          <button id="txt-btn-${e}">💾 Text</button>
        </div>
      `,c+=`<div class="caption" id="path-caption-${e}">📝 ${n.description?n.description.length:0} characters | Full path: ${v(n.image_path)}</div>`,a.innerHTML=c,t.editingIndex===e?(document.getElementById(`save-btn-${e}`).addEventListener("click",async()=>{const d=document.getElementById(`edit-area-${e}`).value,o=await window.go.main.App.SaveDescription(n.image_path,d);if(o){alert(o);return}t.editingIndex=null,await m()}),document.getElementById(`cancel-btn-${e}`).addEventListener("click",()=>{t.editingIndex=null,h()})):(document.getElementById(`edit-btn-${e}`).addEventListener("click",()=>{t.editingIndex=e,h()}),document.getElementById(`copy-btn-${e}`).addEventListener("click",async d=>{await window.runtime.ClipboardSetText(n.description||""),$(d.target,"✓ Copied!")}),document.getElementById(`path-btn-${e}`).addEventListener("click",async d=>{const o=await x(n.image_path);await window.runtime.ClipboardSetText(o||""),$(d.target,"✓ Copied!")}),document.getElementById(`txt-btn-${e}`).addEventListener("click",async()=>{const d=await window.go.main.App.SaveTextFile(l+".txt",n.description||"");d&&alert(d)})),x(n.image_path).then(d=>{if(d!==n.image_path){const o=document.getElementById(`path-caption-${e}`);o&&(o.innerHTML=`📝 ${n.description?n.description.length:0} characters | Full path: ${v(n.image_path)}<br><span style="color:var(--nord14)">↳ Overridden to: ${v(d)}</span>`)}window.go.main.App.GetThumbnail(d,t.thumbnailSize).then(o=>{o?s.innerHTML=`<img src="${o}" style="width:${t.thumbnailSize}px" />`:s.innerHTML='<div class="banner error">Image Missing</div>'}),window.go.main.App.GetImageMeta(d).then(o=>{const p=document.getElementById(`meta-${e}`);o&&p&&(o.exists?o.width>0?p.innerHTML=`📐 ${o.width}x${o.height} (${o.megapixels.toFixed(1)} MP) · ⬛ Ratio: ${o.aspect_ratio} · 💾 ${o.file_size_kb.toFixed(1)} KB`:p.innerHTML=`💾 ${o.file_size_kb.toFixed(1)} KB (Not an image)`:p.innerHTML="File does not exist on disk")})})}}function M(){const i=document.getElementById("pagination");if(!t.result||t.result.total_items===0){i.innerHTML="";return}const e=t.result.current_page,n=t.result.total_pages;i.innerHTML=`
    <div class="page-btn-row">
      <button id="pg-first" ${e<=1?"disabled":""}>⏮️ First</button>
      <button id="pg-prev" ${e<=1?"disabled":""}>◀️ Previous</button>
      <button id="pg-next" ${e>=n?"disabled":""}>Next ▶️</button>
      <button id="pg-last" ${e>=n?"disabled":""}>Last ⏭️</button>
    </div>
    <div class="page-slider-label">Page ${e} of ${n}</div>
    <input type="range" id="pg-slider" min="1" max="${n}" value="${e}" />
  `;const r=s=>{t.params.page=s,m()};document.getElementById("pg-first").addEventListener("click",()=>r(1)),document.getElementById("pg-prev").addEventListener("click",()=>r(e-1)),document.getElementById("pg-next").addEventListener("click",()=>r(e+1)),document.getElementById("pg-last").addEventListener("click",()=>r(n)),document.getElementById("pg-slider").addEventListener("input",y(s=>{r(parseInt(s.target.value,10))},200))}function $(i,e,n=2e3){const r=i.textContent;i.textContent=e,i.classList.add("success"),setTimeout(()=>{i.textContent=r,i.classList.remove("success")},n)}function v(i){return i?i.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function y(i,e){let n;return function(...r){clearTimeout(n),n=setTimeout(()=>i.apply(this,r),e)}}
