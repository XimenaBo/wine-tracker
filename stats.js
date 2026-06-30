// ─── WINE TRACKER — STATS MODULE ────────────────────────────────────────────
// Reads live `tastings` and `cellar` arrays from the main app.
// Called by renderStats() in index.html when the Stats tab is opened.

const S_CHX = {
  'White':'#3d8bcd','Red':'#c0392b','Rosé':'#e91e8c',
  'Sparkling':'#8e44ad','Eaux-de-vie':'#e67e22',
  'Orange':'#d4ac0d','Sweet':'#1abc9c'
};
const S_RHX = {
  'Valais':'#c0392b','Vaud':'#3d8bcd',
  'Neuchatel':'#8e44ad','Bern':'#27ae60',
  'Geneva':'#16a085','Ticino':'#8e6914'
};
const S_GOLD = '#f39c12';

let sYear = 'all';
let sCSort = 'avg', sCMinN = 1, sCMinA = 1.0;
let sVSort = 'avg', sVMinN = 1, sVMinA = 1.0;
const S_GRAPE_REG = {};
let _allTastings = [];
let _charts = {};

// ── ENTRY POINT ───────────────────────────────────────────────────────────────
//function initStats(tastings, cellar) {
  //_allTastings = tastings || [];
function initStats(tastings, cellar) {
  console.log('initStats called, tastings:', (tastings||[]).length);
  _allTastings = tastings || [];
  sYear = 'all';
  buildYearFilter();
  renderStatsForYear();
}

function buildYearFilter() {
  const years = [...new Set(_allTastings
    .map(t => (t.date||'').slice(0,4))
    .filter(y => y && y >= '2020')
  )].sort();
  const bar = document.getElementById('stats-year-filter');
  if (!bar) return;
  bar.innerHTML = `<button class="filter-btn active" onclick="sSetYear('all',this)">All time</button>`
    + years.map(y => {
        const n = _allTastings.filter(t => (t.date||'').startsWith(y)).length;
        return `<button class="filter-btn" onclick="sSetYear('${y}',this)">${y} <span style="font-size:10px;opacity:.7">(${n})</span></button>`;
      }).join('');
}

function sSetYear(yr, btn) {
  sYear = yr;
  document.querySelectorAll('#stats-year-filter .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const lbl = document.getElementById('stats-year-label');
  if (lbl) lbl.textContent = yr === 'all' ? '— all time' : `— ${yr}`;
  document.getElementById('stats-drill').innerHTML = '';
  renderStatsForYear();
}

function getFilteredTastings() {
  if (sYear === 'all') return _allTastings;
  return _allTastings.filter(t => (t.date||'').startsWith(sYear));
}

// ── COMPUTE STATS ─────────────────────────────────────────────────────────────
function computeStats(ts) {
  const count = (key) => {
    const m = {};
    ts.forEach(t => { const v = t[key]||''; if(v) m[v] = (m[v]||0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]);
  };

  const grapesByColour = {};
  ts.forEach(t => {
    (t.grapes||[]).forEach(g => {
      if (!g) return;
      const c = t.colour||'';
      if (!grapesByColour[c]) grapesByColour[c] = {};
      grapesByColour[c][g] = (grapesByColour[c][g]||0) + 1;
    });
  });
  Object.keys(grapesByColour).forEach(c => {
    grapesByColour[c] = Object.entries(grapesByColour[c]).sort((a,b) => b[1]-a[1]).slice(0,10);
  });

  const citiesByRegion = {};
  ts.forEach(t => {
    if (!t.region || !t.city) return;
    if (!citiesByRegion[t.region]) citiesByRegion[t.region] = {};
    citiesByRegion[t.region][t.city] = (citiesByRegion[t.region][t.city]||0) + 1;
  });

  const ratingByColour = {};
  ts.forEach(t => {
    if (!t.colour || !t.rating) return;
    if (!ratingByColour[t.colour]) ratingByColour[t.colour] = [];
    ratingByColour[t.colour].push(t.rating);
  });

  const cellarsDetail = {};
  ts.forEach(t => {
    if (!t.region || !t.winery) return;
    if (!cellarsDetail[t.region]) cellarsDetail[t.region] = {};
    if (!cellarsDetail[t.region][t.winery]) cellarsDetail[t.region][t.winery] = { ratings: [], city: t.city||'—' };
    if (t.rating) cellarsDetail[t.region][t.winery].ratings.push(t.rating);
  });

  const villageCellarsRaw = {};
  ts.forEach(t => {
    if (!t.region || !t.city || !t.winery) return;
    if (!villageCellarsRaw[t.region]) villageCellarsRaw[t.region] = {};
    if (!villageCellarsRaw[t.region][t.city]) villageCellarsRaw[t.region][t.city] = {};
    if (!villageCellarsRaw[t.region][t.city][t.winery]) villageCellarsRaw[t.region][t.city][t.winery] = [];
    if (t.rating) villageCellarsRaw[t.region][t.city][t.winery].push(t.rating);
  });
  const villageCellars = {};
  Object.entries(villageCellarsRaw).forEach(([region, cities]) => {
    villageCellars[region] = {};
    Object.entries(cities).forEach(([city, wineries]) => {
      villageCellars[region][city] = Object.entries(wineries)
        .map(([w,r]) => [w, r.length ? +(r.reduce((a,b)=>a+b,0)/r.length).toFixed(1) : 0, r.length])
        .sort((a,b) => b[1]-a[1]||b[2]-a[2]);
    });
  });

  const wineryCount = {};
  ts.forEach(t => { if(t.winery) wineryCount[t.winery] = (wineryCount[t.winery]||0) + 1; });
  const topWineries = Object.entries(wineryCount).sort((a,b) => b[1]-a[1]).slice(0,5);

  // Top rated always uses all-time data
  const ratingByWinery = {};
  _allTastings.forEach(t => {
    if (!t.winery || !t.rating) return;
    if (!ratingByWinery[t.winery]) ratingByWinery[t.winery] = [];
    ratingByWinery[t.winery].push(t.rating);
  });
  const topRated = Object.entries(ratingByWinery)
    .filter(([,r]) => r.length >= 5)
    .map(([w,r]) => [w, +(r.reduce((a,b)=>a+b,0)/r.length).toFixed(1), r.length])
    .sort((a,b) => b[1]-a[1]).slice(0,5);

  const cellarsByRegion = {};
  Object.entries(cellarsDetail).forEach(([r,ws]) => { cellarsByRegion[r] = Object.keys(ws).length; });

  const ratedTastings = ts.filter(t => t.rating);
  const avgRating = ratedTastings.length
    ? (ratedTastings.reduce((s,t)=>s+t.rating,0)/ratedTastings.length).toFixed(1)
    : '—';

  return {
    total: ts.length,
    wineries: new Set(ts.map(t=>t.winery).filter(Boolean)).size,
    regions: new Set(ts.map(t=>t.region).filter(Boolean)).size,
    avgRating,
    colours: count('colour'),
    regionsCount: count('region'),
    grapesByColour,
    citiesByRegion,
    ratingByColour: Object.fromEntries(
      Object.entries(ratingByColour).map(([c,r]) => [c, [+(r.reduce((a,b)=>a+b,0)/r.length).toFixed(1), r.length]])
    ),
    cellarsDetail,
    villageCellars,
    topWineries,
    topRated,
    cellarsByRegion
  };
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderStatsForYear() {
  const ts = getFilteredTastings();
  const d = computeStats(ts);
  window._statsData = d;

  document.getElementById('stat-grid').innerHTML = `
    <div class="stat-card"><div class="stat-num">${d.total}</div><div class="stat-lbl">Tastings</div></div>
    <div class="stat-card"><div class="stat-num">${d.wineries}</div><div class="stat-lbl">Wineries</div></div>
    <div class="stat-card"><div class="stat-num">${d.regions}</div><div class="stat-lbl">Regions</div></div>
    <div class="stat-card"><div class="stat-num">${d.avgRating}</div><div class="stat-lbl">Avg rating</div></div>`;

  sMkDonut('stats-c-type','stats-leg-type', Object.fromEntries(d.colours), S_CHX, lbl => {
    S_GRAPE_REG[lbl] = Object.fromEntries(d.grapesByColour[lbl]||[]);
    sShowGrapeDrill(lbl, S_CHX[lbl]||'#c0392b');
  });
  sMkDonut('stats-c-reg','stats-leg-reg', Object.fromEntries(d.regionsCount), S_RHX, lbl => {
    sShowRegionVillages(lbl, d);
  });

  sMkRatingVBars(d);
  sMkVisitedBars(d);
  sMkTopRated(d);
  sMkCellarBars(d);
}

// ── DONUT ─────────────────────────────────────────────────────────────────────
function sMkDonut(cid, lid, obj, chx, onClick) {
  const entries = Object.entries(obj).filter(([k])=>k).sort((a,b)=>b[1]-a[1]);
  if (!entries.length) return;
  const total = entries.reduce((s,[,v])=>s+v,0);
  const labels = entries.map(([k])=>k), values = entries.map(([,v])=>v);
  const colors = labels.map(l=>chx[l]||'#aaa');
  const fn = 'sfn_'+cid; window[fn] = onClick;
  document.getElementById(lid).innerHTML = entries.map(([l,v]) =>
    `<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);cursor:pointer" onclick="window['${fn}']('${l.replace(/'/g,"\\'")}')">
      <span style="width:10px;height:10px;border-radius:2px;background:${chx[l]||'#aaa'};flex-shrink:0"></span>
      ${l} ${Math.round(v/total*100)}%
    </span>`).join('');
  if (_charts[cid]) _charts[cid].destroy();
  _charts[cid] = new Chart(document.getElementById(cid), {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: 'transparent', hoverOffset: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw/total*100)}%)` } } },
      onClick: (e, els) => { if (els.length) onClick(labels[els[0].index]); }
    }
  });
}

// ── VERTICAL RATING BARS ──────────────────────────────────────────────────────
function sMkRatingVBars(d) {
  const entries = Object.entries(d.ratingByColour).sort((a,b)=>b[1][0]-a[1][0]);
  entries.forEach(([type]) => { S_GRAPE_REG[type] = Object.fromEntries(d.grapesByColour[type]||[]); });
  const el = document.getElementById('stats-rating-vbars');
  if (!el) return;
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(${entries.length},1fr);gap:6px">
    ${entries.map(([type,[avg,n]]) => {
      const h = Math.round((avg/5)*70);
      const hasGrapes = Object.keys(S_GRAPE_REG[type]||{}).length > 0;
      return `<div style="display:flex;flex-direction:column;align-items:center;cursor:${hasGrapes?'pointer':'default'}"
        onclick="${hasGrapes?`sShowGrapeDrill('${type}','${S_CHX[type]||'#aaa'}')`:''}"
        title="${hasGrapes?'Tap to see grapes':''}">
        <span style="font-size:10px;color:var(--text2);margin-bottom:3px">★${avg}</span>
        <div style="width:28px;background:var(--bg2);border-radius:4px 4px 0 0;display:flex;align-items:flex-end;height:80px">
          <div style="width:100%;height:${h}px;background:${S_CHX[type]||'#aaa'};border-radius:4px 4px 0 0;transition:height .4s"></div>
        </div>
        <span style="font-size:10px;color:var(--text2);text-align:center;margin-top:4px;line-height:1.3;max-width:60px">${type}<br><span style="font-size:9px;opacity:.7">${n}</span></span>
      </div>`;
    }).join('')}
  </div>`;
}

// ── SIMPLE BAR HELPER ─────────────────────────────────────────────────────────
function sBar(label, value, max, color, onClick, valueDisplay) {
  return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;cursor:${onClick?'pointer':'default'}" ${onClick?`onclick="${onClick}"`:''}>
    <span style="font-size:12px;color:var(--text2);width:150px;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${label}">${label}</span>
    <div style="flex:1;height:11px;background:var(--bg2);border-radius:99px;overflow:hidden">
      <div style="width:${Math.round(value/max*100)}%;height:100%;background:${color};border-radius:99px"></div>
    </div>
    <span style="font-size:11px;color:var(--text2);width:52px;text-align:right;flex-shrink:0;white-space:nowrap">${valueDisplay||value}</span>
  </div>`;
}

function sMkVisitedBars(d) {
  const el = document.getElementById('stats-visited');
  if (!el) return;
  if (!d.topWineries.length) { el.innerHTML = '<p style="font-size:13px;color:var(--text2);text-align:center;padding:.75rem 0">No data</p>'; return; }
  const max = Math.max(...d.topWineries.map(([,v])=>v));
  el.innerHTML = d.topWineries.map(([l,v]) => sBar(l, v, max, '#c0392b', null, v)).join('');
}

function sMkTopRated(d) {
  const el = document.getElementById('stats-top-rated');
  if (!el) return;
  if (!d.topRated.length) { el.innerHTML = '<p style="font-size:13px;color:var(--text2);text-align:center;padding:.75rem 0">Min 5 tastings needed</p>'; return; }
  el.innerHTML = d.topRated.map(([w,avg,n]) =>
    `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;cursor:pointer" onclick="sShowWineryTastings('${w.replace(/'/g,"\\'")}')">
      <span style="font-size:12px;color:var(--text2);width:150px;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${w}">${w}</span>
      <div style="flex:1;height:11px;background:var(--bg2);border-radius:99px;overflow:hidden">
        <div style="width:${Math.round(avg/5*100)}%;height:100%;background:#e67e22;border-radius:99px"></div>
      </div>
      <span style="font-size:11px;color:${S_GOLD};width:52px;text-align:right;flex-shrink:0;white-space:nowrap">★${avg}·${n}</span>
    </div>`
  ).join('');
}

function sMkCellarBars(d) {
  const el = document.getElementById('stats-cellar-bars');
  if (!el) return;
  const entries = Object.entries(d.cellarsByRegion).sort((a,b)=>b[1]-a[1]);
  if (!entries.length) { el.innerHTML = '<p style="font-size:13px;color:var(--text2);text-align:center;padding:.75rem 0">No data</p>'; return; }
  const max = Math.max(...entries.map(([,v])=>v));
  el.innerHTML = entries.map(([r,v]) =>
    `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;cursor:pointer" onclick="sShowCellarDrill('${r}')">
      <span style="font-size:12px;color:var(--text2);width:100px;text-align:right;flex-shrink:0">${r}</span>
      <div style="flex:1;height:11px;background:var(--bg2);border-radius:99px;overflow:hidden">
        <div style="width:${Math.round(v/max*100)}%;height:100%;background:${S_RHX[r]||'#888'};border-radius:99px"></div>
      </div>
      <span style="font-size:11px;color:var(--text2);width:24px;text-align:right;flex-shrink:0">${v}</span>
    </div>`
  ).join('');
}

// ── DRILL HELPERS ─────────────────────────────────────────────────────────────
function sCloseDrill() { document.getElementById('stats-drill').innerHTML = ''; }

function sDrillWrap(title, backFn, content) {
  return `<div style="background:var(--bg);border:0.5px solid var(--border);border-radius:var(--radius);padding:1rem;margin-bottom:1rem">
    <div style="font-size:13px;font-weight:500;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <span>${title}</span>
      <div style="display:flex;gap:6px">
        ${backFn?`<button style="font-size:12px;color:var(--text2);cursor:pointer;background:none;border:0.5px solid var(--border);padding:3px 8px;border-radius:var(--radius-sm);font-family:var(--font)" onclick="${backFn}">← Back</button>`:''}
        <button style="font-size:12px;color:#c0392b;cursor:pointer;background:none;border:none;padding:0;font-family:var(--font)" onclick="sCloseDrill()">✕ close</button>
      </div>
    </div>
    ${content}
  </div>`;
}

function sCompactFilters(sortVal, minN, minA, prefix, region, city) {
  const rc = region ? `'${region}'` : 'null';
  const cc = city ? `'${city.replace(/'/g,"\\'")}'` : 'null';
  const inp = `style="width:100%;padding:3px 5px;font-size:11px;border:0.5px solid var(--border);border-radius:var(--radius-sm);background:var(--bg2);color:var(--text);font-family:var(--font)"`;
  const lbl = `style="font-size:10px;color:var(--text2);font-weight:500;text-transform:uppercase;letter-spacing:.3px;margin-bottom:2px"`;
  return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:6px;align-items:end;border-top:0.5px solid var(--border);padding-top:8px;margin-top:4px">
    <div><div ${lbl}>Sort by</div>
      <select ${inp} onchange="${prefix}Sort=this.value;sRenderTable(${rc},${cc})">
        <option value="avg" ${sortVal==='avg'?'selected':''}>Avg ★</option>
        <option value="n" ${sortVal==='n'?'selected':''}>Tastings</option>
      </select>
    </div>
    <div><div ${lbl}>Min tastings</div>
      <input type="number" min="1" max="30" value="${minN}" ${inp} onchange="${prefix}MinN=parseInt(this.value)||1;sRenderTable(${rc},${cc})">
    </div>
    <div><div ${lbl}>Min ★</div>
      <input type="number" min="1" max="5" step="0.1" value="${minA}" ${inp} onchange="${prefix}MinA=parseFloat(this.value)||1;sRenderTable(${rc},${cc})">
    </div>
    <button style="font-size:11px;color:var(--text2);cursor:pointer;background:none;border:0.5px solid var(--border);padding:4px 8px;border-radius:var(--radius-sm);font-family:var(--font)"
      onclick="${prefix}Sort='avg';${prefix}MinN=1;${prefix}MinA=1.0;sRenderTable(${rc},${cc})">Reset</button>
  </div>`;
}

function sMkTable(rows, cols) {
  if (!rows.length) return '<p style="font-size:13px;color:var(--text2);text-align:center;padding:.75rem 0">No entries match filters</p>';
  return `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px">
    <thead><tr>${cols.map(([l,cb,active]) =>
      `<th style="text-align:left;color:var(--text2);font-weight:500;padding:5px 6px;border-bottom:0.5px solid var(--border);font-size:11px;${cb?'cursor:pointer':''}; user-select:none;white-space:nowrap" ${cb?`onclick="${cb}"`:''}>${l}${active?' ↓':''}</th>`
    ).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map((v,i) =>
      `<td style="padding:5px 6px;border-bottom:0.5px solid var(--border);${i===0?'':'color:var(--text2);font-size:11px;'}${String(v).startsWith('★')?`color:${S_GOLD};white-space:nowrap`:''}">${v}</td>`
    ).join('')}</tr>`).join('')}</tbody>
  </table>`;
}

function sRenderTable(region, city) {
  const d = window._statsData;
  if (!d) return;
  if (city) {
    const all = (d.villageCellars[region]||{})[city]||[];
    let rows = all.map(([w,avg,n]) => ({w,avg,n})).filter(r => r.n >= sVMinN && r.avg >= sVMinA);
    if (sVSort === 'avg') rows.sort((a,b) => b.avg-a.avg||b.n-a.n);
    else rows.sort((a,b) => b.n-a.n||b.avg-a.avg);
    const sc = city.replace(/'/g,"\\'");
    const cols = [
      ['Cellar', null, false],
      ['Avg ★', `sVSort='avg';sRenderTable('${region}','${sc}')`, sVSort==='avg'],
      ['Tastings', `sVSort='n';sRenderTable('${region}','${sc}')`, sVSort==='n']
    ];
    document.getElementById('stats-drill').innerHTML = sDrillWrap(
      `Cellars in ${city}, ${region}`,
      `sShowRegionVillages('${region}')`,
      sMkTable(rows.map(({w,avg,n}) => [w, `★ ${avg.toFixed(1)}`, n]), cols)
      + sCompactFilters(sVSort, sVMinN, sVMinA, 'sV', region, city)
    );
  } else {
    const detail = d.cellarsDetail[region]||{};
    let rows = Object.entries(detail)
      .map(([w,{ratings,city}]) => ({ w, avg: ratings.length ? +(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : 0, n: ratings.length, city }))
      .filter(r => r.n >= sCMinN && r.avg >= sCMinA);
    if (sCSort === 'avg') rows.sort((a,b) => b.avg-a.avg||b.n-a.n);
    else rows.sort((a,b) => b.n-a.n||b.avg-a.avg);
    const cols = [
      ['Cellar', null, false],
      ['Village', null, false],
      ['Avg ★', `sCSort='avg';sRenderTable('${region}',null)`, sCSort==='avg'],
      ['Tastings', `sCSort='n';sRenderTable('${region}',null)`, sCSort==='n']
    ];
    document.getElementById('stats-drill').innerHTML = sDrillWrap(
      `Cellars in ${region}`,
      null,
      sMkTable(rows.map(({w,avg,n,city}) => [w, city, `★ ${avg.toFixed(1)}`, n]), cols)
      + sCompactFilters(sCSort, sCMinN, sCMinA, 'sC', region, null)
    );
  }
  document.getElementById('stats-drill').scrollIntoView({behavior:'smooth',block:'nearest'});
}

function sShowGrapeDrill(type, color) {
  const entries = Object.entries(S_GRAPE_REG[type]||{});
  let content;
  if (!entries.length) {
    content = '<p style="font-size:13px;color:var(--text2);text-align:center;padding:.75rem 0">No grape data recorded yet</p>';
  } else {
    const max = Math.max(...entries.map(([,v])=>v));
    content = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">${entries.map(([l,v]) =>
      `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
        <span style="font-size:12px;color:var(--text2);width:130px;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${l}">${l}</span>
        <div style="flex:1;height:11px;background:var(--bg2);border-radius:99px;overflow:hidden">
          <div style="width:${Math.round(v/max*100)}%;height:100%;background:${color};border-radius:99px"></div>
        </div>
        <span style="font-size:11px;color:var(--text2);width:24px;text-align:right">${v}</span>
      </div>`).join('')}</div>`;
  }
  document.getElementById('stats-drill').innerHTML = sDrillWrap(`Grapes in my ${type} tastings`, null, content);
  document.getElementById('stats-drill').scrollIntoView({behavior:'smooth',block:'nearest'});
}

function sShowRegionVillages(region) {
  const d = window._statsData;
  if (!d) return;
  const cities = d.citiesByRegion[region]||{};
  const entries = Object.entries(cities);
  if (!entries.length) return;
  const max = Math.max(...entries.map(([,v])=>v));
  const color = S_RHX[region]||'#888';
  const bars = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
    ${entries.map(([city,v]) =>
      `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;cursor:pointer" onclick="sShowVillageDrill('${region}','${city.replace(/'/g,"\\'")}')">
        <span style="font-size:12px;color:var(--text2);width:130px;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${city}</span>
        <div style="flex:1;height:11px;background:var(--bg2);border-radius:99px;overflow:hidden">
          <div style="width:${Math.round(v/max*100)}%;height:100%;background:${color};border-radius:99px"></div>
        </div>
        <span style="font-size:11px;color:var(--text2);width:24px;text-align:right">${v}</span>
      </div>`).join('')}
  </div>
  <p style="font-size:11px;color:var(--text2);margin-top:8px">Tap a village → cellars</p>`;
  document.getElementById('stats-drill').innerHTML = sDrillWrap(`Villages by number of tastings — ${region}`, null, bars);
  document.getElementById('stats-drill').scrollIntoView({behavior:'smooth',block:'nearest'});
}

function sShowVillageDrill(region, city) {
  sVSort = 'avg'; sVMinN = 1; sVMinA = 1.0;
  sRenderTable(region, city);
}

function sShowCellarDrill(region) {
  sCSort = 'avg'; sCMinN = 1; sCMinA = 1.0;
  sRenderTable(region, null);
}

function sShowWineryTastings(winery) {
  const ts = _allTastings.filter(t => t.winery === winery).sort((a,b) => (b.year||0)-(a.year||0));
  let content;
  if (!ts.length) {
    content = '<p style="font-size:13px;color:var(--text2);text-align:center;padding:.75rem 0">No tastings recorded</p>';
  } else {
    const cols = [['Wine',null,false],['Year',null,false],['Type',null,false],['★',null,false],['Notes',null,false]];
    const rows = ts.map(t => [
      t.name||'—', t.year||'—',
      `<span style="font-size:10px;padding:1px 5px;border-radius:99px;background:${(S_CHX[t.colour]||'#aaa')}22;color:${S_CHX[t.colour]||'#888'}">${t.colour||'—'}</span>`,
      t.rating ? `★${t.rating}` : '—',
      `<em style="color:var(--text2);font-style:italic">${t.notes||''}</em>`
    ]);
    content = sMkTable(rows, cols)
      + '<p style="font-size:11px;color:var(--text2);margin-top:6px">Showing all-time tastings</p>';
  }
  document.getElementById('stats-drill').innerHTML = sDrillWrap(winery, null, content);
  document.getElementById('stats-drill').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// Ensure Chart.js is loaded before rendering
function sEnsureChartJS(cb) {
  if (typeof Chart !== 'undefined') { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
  s.onload = cb;
  document.head.appendChild(s);
}

// Chart.js loading handled by renderStats in index.html
