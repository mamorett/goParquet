const state = {
  dbPath: '',
  params: {
    existence_filter: 'all',
    selected_subdirs: [],
    subdir_query: '',
    selected_prompts: [],
    sort_option: 'created_desc',
    search_query: '',
    search_in: 'filename_or_prompt',
    page: 1,
    items_per_page: 10,
  },
  result: null,
  stats: null,
  allSubdirs: [],
  allPrompts: [],
  thumbnailSize: 300,
  editingIndex: null,
};

window.addEventListener('DOMContentLoaded', () => {
  renderLayout();
  bindSidebarEvents();
});

function renderLayout() {
  document.getElementById('app').innerHTML = `
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
      <div class="header-container">
        <img src="/logo.png" class="app-logo" alt="goParquet Logo" />
        <h1 class="page-title">goParquet</h1>
      </div>
      <p class="page-subtitle">Browse · Search · Edit · Export — AI prompt database viewer</p>
      <div id="gallery"></div>
      <div id="pagination"></div>
      <footer>goParquet &nbsp;·&nbsp; Wails &nbsp;·&nbsp; Parquet</footer>
    </div>
  `;
}

function bindSidebarEvents() {
  const dbInput = document.getElementById('db-path-input');
  dbInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadDatabase(dbInput.value);
  });
  document.getElementById('browse-btn').addEventListener('click', async () => {
    const path = await window.go.main.App.OpenFilePicker();
    if (path) {
      dbInput.value = path;
      await loadDatabase(path);
    }
  });

  document.getElementById('thumb-slider').addEventListener('input', (e) => {
    state.thumbnailSize = parseInt(e.target.value, 10);
    renderGallery();
  });

  const triggerFetch = () => { state.params.page = 1; fetchPage(); };

  document.getElementById('items-per-page').addEventListener('change', (e) => {
    state.params.items_per_page = parseInt(e.target.value, 10);
    triggerFetch();
  });

  document.querySelectorAll('input[name="existence"]').forEach(el => {
    el.addEventListener('change', (e) => {
      state.params.existence_filter = e.target.value;
      triggerFetch();
    });
  });

  document.getElementById('subdir-query').addEventListener('input', debounce((e) => {
    state.params.subdir_query = e.target.value;
    triggerFetch();
  }, 300));

  document.getElementById('sort-option').addEventListener('change', (e) => {
    state.params.sort_option = e.target.value;
    triggerFetch();
  });

  document.getElementById('search-in').addEventListener('change', (e) => {
    state.params.search_in = e.target.value;
    triggerFetch();
  });

  document.getElementById('search-query').addEventListener('input', debounce((e) => {
    state.params.search_query = e.target.value;
    triggerFetch();
  }, 300));

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.multi-select-dropdown').forEach(dd => {
      if (!dd.parentElement.contains(e.target)) dd.classList.remove('open');
    });
  });

  const resizer = document.getElementById('resizer');
  const sidebar = document.getElementById('sidebar');
  let isResizing = false;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizer.classList.add('active');
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= 150 && newWidth <= 800) {
      sidebar.style.width = newWidth + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      resizer.classList.remove('active');
      document.body.style.cursor = 'default';
    }
  });
}

function showBanner(type, msg) {
  const el = document.getElementById('db-status');
  el.innerHTML = `<div class="banner ${type}">${msg}</div>`;
}
function showStatus(state) {
  if (state === 'loading') showBanner('info', '<div class="spinner"></div> Loading...');
}

async function loadDatabase(path) {
  showStatus('loading');
  const err = await window.go.main.App.LoadDatabase(path);
  if (err) { showBanner('error', '❌ ' + err); return; }
  state.dbPath = path;
  showBanner('success', '✓ Valid database file');
  await refreshStats();
  await fetchPage();
}

async function refreshStats() {
  state.stats = await window.go.main.App.GetStats();
  const area = document.getElementById('stats-area');
  area.innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Total Entries</div><div class="metric-value">${state.stats.total_entries}</div></div>
      <div class="metric-card"><div class="metric-label">Images Found</div><div class="metric-value">${state.stats.images_found}</div></div>
      <div class="metric-card"><div class="metric-label">Images Missing</div><div class="metric-value">${state.stats.images_missing}</div></div>
      <div class="metric-card"><div class="metric-label">Unique Prompts</div><div class="metric-value">${state.stats.unique_prompts}</div></div>
    </div>
    <div class="caption">📅 Date range: ${state.stats.oldest_date || '?'} to ${state.stats.newest_date || '?'}</div>
    <div class="caption">💾 Database size: ${state.stats.file_size_str || '?'}</div>
  `;
}

async function fetchPage() {
  state.result = await window.go.main.App.GetPage(state.params);
  state.allSubdirs = state.result.all_subdirs || [];
  state.allPrompts = state.result.all_prompts || [];
  
  renderMultiSelect('subdir-multiselect', state.allSubdirs, state.params.selected_subdirs, 'Subdirectories', (selected) => {
    state.params.selected_subdirs = selected;
    state.params.page = 1;
    fetchPage();
  });

  const pSect = document.getElementById('prompt-filter-section');
  if (state.stats && state.stats.unique_prompts > 1) {
    pSect.style.display = 'block';
    renderMultiSelect('prompt-multiselect', state.allPrompts, state.params.selected_prompts, 'Prompts', (selected) => {
      state.params.selected_prompts = selected;
      state.params.page = 1;
      fetchPage();
    });
  } else {
    pSect.style.display = 'none';
  }

  await renderGallery();
  renderPagination();
  document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
}

function renderMultiSelect(containerId, options, selectedArr, label, onChange) {
  const container = document.getElementById(containerId);
  const btnText = selectedArr.length === 0 ? `All ${label}` : `${selectedArr.length} selected`;
  let html = `
    <button class="multi-select-toggle">${btnText} ▼</button>
    <div class="multi-select-dropdown">
  `;
  options.forEach(opt => {
    const checked = selectedArr.includes(opt) ? 'checked' : '';
    html += `
      <label class="multi-select-option">
        <input type="checkbox" value="${opt.replace(/"/g, '&quot;')}" ${checked} />
        ${opt}
      </label>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;

  const btn = container.querySelector('.multi-select-toggle');
  const dd = container.querySelector('.multi-select-dropdown');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dd.classList.toggle('open');
  });

  dd.addEventListener('change', () => {
    const checkedBoxes = Array.from(dd.querySelectorAll('input:checked')).map(cb => cb.value);
    onChange(checkedBoxes);
  });
}

async function renderGallery() {
  const gal = document.getElementById('gallery');
  gal.innerHTML = '';
  if (!state.result || !state.result.entries || state.result.entries.length === 0) {
    gal.innerHTML = '<div class="banner info">No entries found.</div>';
    return;
  }

  for (let i = 0; i < state.result.entries.length; i++) {
    const entry = state.result.entries[i];
    const card = document.createElement('div');
    card.className = 'entry-card';
    gal.appendChild(card);

    const leftCol = document.createElement('div');
    leftCol.className = 'img-col';
    leftCol.innerHTML = `<div class="spinner"></div>`;
    card.appendChild(leftCol);

    const rightCol = document.createElement('div');
    card.appendChild(rightCol);

    const basename = entry.image_path.split(/[\\/]/).pop();
    
    let rightHtml = `<div class="filename-box">🖼️ ${basename}</div>`;
    
    const dates = [];
    if (entry.created_at) dates.push(`Created: ${new Date(entry.created_at).toLocaleString()}`);
    if (entry.modified_at) dates.push(`Modified: ${new Date(entry.modified_at).toLocaleString()}`);
    if (dates.length > 0) rightHtml += `<div class="timestamp-box">${dates.join(' · ')}</div>`;

    rightHtml += `<div class="image-meta-box last" id="meta-${i}">Loading meta...</div>`;
    rightHtml += `<div class="prompt-label">Prompt: ${entry.prompt || 'N/A'}</div>`;

    if (state.editingIndex === i) {
      rightHtml += `
        <textarea class="edit-area" id="edit-area-${i}">${entry.description}</textarea>
        <div class="edit-btn-row">
          <button class="primary" id="save-btn-${i}">💾 Save</button>
          <button id="cancel-btn-${i}">❌ Cancel</button>
          <div></div>
        </div>
      `;
    } else {
      rightHtml += `
        <div class="description-box">${escapeHtml(entry.description)}</div>
        <div class="action-row">
          <button id="edit-btn-${i}">✏️ Edit</button>
          <button id="copy-btn-${i}">📋 Copy</button>
          <button id="path-btn-${i}">📁 Path</button>
          <button id="txt-btn-${i}">💾 Text</button>
        </div>
      `;
    }
    
    rightHtml += `<div class="caption">📝 ${entry.description ? entry.description.length : 0} characters | Full path: ${entry.image_path}</div>`;
    rightCol.innerHTML = rightHtml;

    if (state.editingIndex === i) {
      document.getElementById(`save-btn-${i}`).addEventListener('click', async () => {
        const text = document.getElementById(`edit-area-${i}`).value;
        const err = await window.go.main.App.SaveDescription(entry.image_path, text);
        if (err) { alert(err); return; }
        state.editingIndex = null;
        await fetchPage();
      });
      document.getElementById(`cancel-btn-${i}`).addEventListener('click', () => {
        state.editingIndex = null;
        renderGallery();
      });
    } else {
      document.getElementById(`edit-btn-${i}`).addEventListener('click', () => {
        state.editingIndex = i;
        renderGallery();
      });
      document.getElementById(`copy-btn-${i}`).addEventListener('click', async (e) => {
        await window.runtime.ClipboardSetText(entry.description || "");
        flashButton(e.target, '✓ Copied!');
      });
      document.getElementById(`path-btn-${i}`).addEventListener('click', async (e) => {
        await window.runtime.ClipboardSetText(entry.image_path || "");
        flashButton(e.target, '✓ Copied!');
      });
      document.getElementById(`txt-btn-${i}`).addEventListener('click', async () => {
        const err = await window.go.main.App.SaveTextFile(basename + '.txt', entry.description || "");
        if (err) alert(err);
      });
    }

    // Async load thumb & meta
    window.go.main.App.GetThumbnail(entry.image_path, state.thumbnailSize).then(src => {
      if (src) {
        leftCol.innerHTML = `<img src="${src}" style="width:${state.thumbnailSize}px" />`;
      } else {
        leftCol.innerHTML = `<div class="banner error">Image Missing</div>`;
      }
    });

    window.go.main.App.GetImageMeta(entry.image_path).then(meta => {
      const metaEl = document.getElementById(`meta-${i}`);
      if (meta && metaEl) {
        if (!meta.exists) {
          metaEl.innerHTML = 'File does not exist on disk';
        } else if (meta.width > 0) {
          metaEl.innerHTML = `📐 ${meta.width}x${meta.height} (${meta.megapixels.toFixed(1)} MP) · ⬛ Ratio: ${meta.aspect_ratio} · 💾 ${meta.file_size_kb.toFixed(1)} KB`;
        } else {
          metaEl.innerHTML = `💾 ${meta.file_size_kb.toFixed(1)} KB (Not an image)`;
        }
      }
    });
  }
}

function renderPagination() {
  const pag = document.getElementById('pagination');
  if (!state.result || state.result.total_items === 0) {
    pag.innerHTML = '';
    return;
  }
  
  const p = state.result.current_page;
  const t = state.result.total_pages;
  
  pag.innerHTML = `
    <div class="page-btn-row">
      <button id="pg-first" ${p <= 1 ? 'disabled' : ''}>⏮️ First</button>
      <button id="pg-prev" ${p <= 1 ? 'disabled' : ''}>◀️ Previous</button>
      <button id="pg-next" ${p >= t ? 'disabled' : ''}>Next ▶️</button>
      <button id="pg-last" ${p >= t ? 'disabled' : ''}>Last ⏭️</button>
    </div>
    <div class="page-slider-label">Page ${p} of ${t}</div>
    <input type="range" id="pg-slider" min="1" max="${t}" value="${p}" />
  `;

  const goPage = (pg) => { state.params.page = pg; fetchPage(); };

  document.getElementById('pg-first').addEventListener('click', () => goPage(1));
  document.getElementById('pg-prev').addEventListener('click', () => goPage(p - 1));
  document.getElementById('pg-next').addEventListener('click', () => goPage(p + 1));
  document.getElementById('pg-last').addEventListener('click', () => goPage(t));

  document.getElementById('pg-slider').addEventListener('input', debounce((e) => {
    goPage(parseInt(e.target.value, 10));
  }, 200));
}

function flashButton(btn, text, ms = 2000) {
  const orig = btn.textContent;
  btn.textContent = text;
  btn.classList.add('success');
  setTimeout(() => { btn.textContent = orig; btn.classList.remove('success'); }, ms);
}

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
