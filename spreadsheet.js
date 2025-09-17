// spreadsheet.js
// Core engine: manages grid, cellMap, LaTeX In/Out, headers, copy/paste, conditional formatting

/* global texme, MathJax */

const wrapper = document.getElementById('gridWrapper');
const columnTypes = []; // {type, isPair, name}
const cellMap = {};     // id -> { element, render, type, value }
let numRows = 0;
let numCols = 0;

// paste buffer for copy/paste
let pasteBuffer = null; // {type:'row'|'col', data: [...] }

function colName(n){ let s=''; while(n>=0){ s=String.fromCharCode(65+(n%26))+s; n=Math.floor(n/26)-1;} return s; }
function rowName(r){ return (r+1).toString(); }
function cellId(c,r,suffix=''){ return colName(c)+rowName(r)+(suffix||''); }

function addColumn(type, header){
  columnTypes.push({ type, isPair: type === 'latex', name: header || colName(numCols) });
  numCols++;
}

function removeColumn(index){
  if(index < 0 || index >= numCols) return;
  // remove all cellMap entries for that column
  for(let r=0;r<numRows;r++){
    const inId = cellId(index,r,'_in');
    const id = cellId(index,r,'');
    delete cellMap[inId];
    delete cellMap[id];
  }
  columnTypes.splice(index,1);
  // shift any later cellMap keys (we will rebuild table)
  numCols--;
  renderTable();
}

function renameColumn(index, newName){
  if(index<0||index>=numCols) return;
  columnTypes[index].name = newName || colName(index);
  renderTable(); // re-render header labels
}

function addRow(){
  numRows++;
  renderTable();
}

function removeRow(index){
  if(index<0||index>=numRows) return;
  // delete cellMap for that row
  for(let c=0;c<numCols;c++){
    delete cellMap[cellId(c,index,'_in')];
    delete cellMap[cellId(c,index,'')];
  }
  // shift others: easiest to rebuild
  numRows--;
  renderTable();
}

// Renders grid
function renderTable(){
  wrapper.innerHTML = '';
  const table = document.createElement('table'); table.className = 'sheet';
  const thead = document.createElement('thead'); const headRow = document.createElement('tr');
  const corner = document.createElement('th'); corner.className = 'corner'; corner.textContent = ''; headRow.appendChild(corner);

  for(let c=0;c<numCols;c++){
    const spec = columnTypes[c];
    if(spec.isPair){
      const thIn = document.createElement('th'); thIn.textContent = spec.name + ' (In)'; headRow.appendChild(thIn);
      const thOut = document.createElement('th'); thOut.textContent = spec.name + ' (Out)'; headRow.appendChild(thOut);
    } else {
      const th = document.createElement('th'); th.textContent = spec.name; headRow.appendChild(th);
    }
  }
  thead.appendChild(headRow); table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for(let r=0;r<numRows;r++){
    const tr = document.createElement('tr');
    const thRow = document.createElement('th'); thRow.className='rowHeader'; thRow.textContent = rowName(r);
    tr.appendChild(thRow);

    for(let c=0;c<numCols;c++){
      const spec = columnTypes[c];
      if(spec.isPair){
        // In
        const tdIn = document.createElement('td');
        const ta = document.createElement('textarea'); ta.className='input-cell';
        const idIn = cellId(c,r,'_in');
        ta.value = cellMap[idIn]?.value || '';
        ta.style.display = 'none'; // hide input by default (preview visible)
        tdIn.appendChild(ta);
        tr.appendChild(tdIn);

        // Out (preview)
        const tdOut = document.createElement('td');
        const divOut = document.createElement('div'); divOut.className = 'render-cell';
        tdOut.appendChild(divOut);
        tr.appendChild(tdOut);

        cellMap[idIn] = cellMap[idIn] || { type:'latex', value: ta.value };
        cellMap[idIn].element = ta;
        cellMap[idIn].render = divOut;

        attachLatexHandlers(ta, divOut, idIn);
      } else {
        const td = document.createElement('td');
        const ta = document.createElement('textarea'); ta.className='input-cell';
        const id = cellId(c,r,'');
        ta.value = cellMap[id]?.value || '';
        td.appendChild(ta);
        tr.appendChild(td);

        cellMap[id] = cellMap[id] || { type: spec.type === 'formula' ? 'formula' : 'text', value: ta.value };
        cellMap[id].element = ta;
        cellMap[id].type = cellMap[id].type || spec.type;

        // input handlers
        ta.oninput = function(){ cellMap[id].value = ta.value; applyConditionalFormatting(); };
        ta.onclick = function(){ navigator.clipboard?.writeText(ta.value).catch(()=>{}); ta.style.outline='2px solid blue'; setTimeout(()=>ta.style.outline='',200); };
      }
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  wrapper.appendChild(table);

  // Render previews from stored values
  for(const id in cellMap){
    const cobj = cellMap[id];
    if(cobj && cobj.type === 'latex' && cobj.render){
      try {
        cobj.render.innerHTML = texme.render(cobj.value || '');
      } catch(e){
        cobj.render.innerHTML = '<span style="color:red">render error</span>';
      }
      if(window.MathJax && window.MathJax.Hub){
        window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, cobj.render]);
      }
      // ensure display: preview visible, input hidden
      if(cobj.element) cobj.element.style.display = 'none';
      if(cobj.render) cobj.render.style.display = 'block';
    }
  }

  // update UI selects (if UI present)
  if(window.ui_updateSelectors) ui_updateSelectors();
}

// LaTeX In/Out behavior
function attachLatexHandlers(input, preview, id){
  // cleanup
  input.onfocus = null; input.onblur = null; input.oninput = null; preview.onclick = null;

  function renderNow(){
    const code = input.value || '';
    try { preview.innerHTML = texme.render(code); } catch(e){ preview.innerHTML = '<span style="color:red">render error</span>'; }
    cellMap[id].value = code;
    if(window.MathJax && window.MathJax.Hub){
      window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, preview]);
    }
  }

  // initial render
  renderNow();
  input.style.display = 'none';
  preview.style.display = 'block';

  preview.onclick = function(){
    // show textarea
    preview.style.display = 'none';
    input.style.display = 'block';
    input.focus();
    // caret to end
    const v = input.value; input.value=''; input.value=v;
  };

  input.onblur = function(){
    renderNow();
    input.style.display = 'none';
    preview.style.display = 'block';
    applyConditionalFormatting();
  };

  input.oninput = function(){ // live preview
    try { preview.innerHTML = texme.render(input.value || ''); } catch(e){ preview.innerHTML = '<span style="color:red">render error</span>'; }
    cellMap[id].value = input.value;
  };

  input.onclick = function(ev){ ev.stopPropagation(); navigator.clipboard?.writeText(input.value).catch(()=>{}); input.style.outline='2px solid blue'; setTimeout(()=>input.style.outline='',200); };

  // double-click preview to copy rendered HTML (single click used to toggle)
  preview.ondblclick = function(){ navigator.clipboard?.writeText(preview.innerHTML).catch(()=>{}); preview.style.outline='2px solid green'; setTimeout(()=>preview.style.outline='',200); };
}

// ----------------- COPY / PASTE -----------------
function copyRow(r){
  if(r<0||r>=numRows) return;
  const rowData = [];
  for(let c=0;c<numCols;c++){
    const spec = columnTypes[c];
    if(spec.isPair){
      rowData.push(cellMap[cellId(c,r,'_in')]?.value || '');
    } else {
      rowData.push(cellMap[cellId(c,r,'')]?.value || '');
    }
  }
  pasteBuffer = { type:'row', data: rowData };
  updateBufferUI();
}

function pasteRow(targetRow){
  if(!pasteBuffer || pasteBuffer.type!=='row') return;
  if(targetRow<0||targetRow>=numRows) return;
  const rowData = pasteBuffer.data;
  for(let c=0;c<numCols;c++){
    const spec = columnTypes[c];
    if(spec.isPair){
      const id = cellId(c,targetRow,'_in');
      if(cellMap[id] && cellMap[id].element){ cellMap[id].element.value = rowData[c] || ''; cellMap[id].value = rowData[c] || ''; cellMap[id].render.innerHTML = texme.render(cellMap[id].value || ''); }
    } else {
      const id = cellId(c,targetRow,'');
      if(cellMap[id] && cellMap[id].element){ cellMap[id].element.value = rowData[c] || ''; cellMap[id].value = rowData[c] || ''; }
    }
  }
  // reapply UI / formatting
  renderTable();
  applyConditionalFormatting();
}

function copyColumn(c){
  if(c<0||c>=numCols) return;
  const colData = [];
  for(let r=0;r<numRows;r++){
    const spec = columnTypes[c];
    if(spec.isPair) colData.push(cellMap[cellId(c,r,'_in')]?.value || '');
    else colData.push(cellMap[cellId(c,r,'')]?.value || '');
  }
  pasteBuffer = { type:'col', index: c, data: colData };
  updateBufferUI();
}

function pasteColumn(targetCol){
  if(!pasteBuffer || pasteBuffer.type!=='col') return;
  if(targetCol<0||targetCol>=numCols) return;
  const colData = pasteBuffer.data;
  for(let r=0;r<numRows;r++){
    const spec = columnTypes[targetCol];
    if(spec.isPair){
      const id = cellId(targetCol,r,'_in');
      if(cellMap[id] && cellMap[id].element){ cellMap[id].element.value = colData[r] || ''; cellMap[id].value = colData[r] || ''; cellMap[id].render.innerHTML = texme.render(cellMap[id].value || ''); }
    } else {
      const id = cellId(targetCol,r,'');
      if(cellMap[id] && cellMap[id].element){ cellMap[id].element.value = colData[r] || ''; cellMap[id].value = colData[r] || ''; }
    }
  }
  renderTable();
  applyConditionalFormatting();
}

function updateBufferUI(){
  if(window.ui_updateBuffer) ui_updateBuffer(pasteBuffer);
}

// ---------------- CONDITIONAL FORMATTING ----------------
const conditionalRules = []; // {id, col, operator, value, color}

function addConditionalRule(col, operator, value, color){
  conditionalRules.push({ id: Date.now()+Math.random(), col, operator, value: Number(value), color });
  applyConditionalFormatting();
  if(window.ui_renderRules) ui_renderRules();
}

function deleteConditionalRule(ruleId){
  const idx = conditionalRules.findIndex(r=>r.id===ruleId);
  if(idx>=0) conditionalRules.splice(idx,1);
  applyConditionalFormatting();
  if(window.ui_renderRules) ui_renderRules();
}

// applies formatting to text columns only (latex inputs keep default background)
function applyConditionalFormatting(){
  for(let r=0;r<numRows;r++){
    for(let c=0;c<numCols;c++){
      const spec = columnTypes[c];
      // we choose to apply to non-latex cells (inputs) and latex inputs
      const targets = [];
      if(spec.isPair){
        const idIn = cellId(c,r,'_in');
        if(cellMap[idIn] && cellMap[idIn].element) targets.push(cellMap[idIn].element);
      } else {
        const id = cellId(c,r,'');
        if(cellMap[id] && cellMap[id].element) targets.push(cellMap[id].element);
      }
      // default
      targets.forEach(el => el.style.background = (spec.isPair ? 'var(--in-bg)' : 'var(--in-bg)'));
      // run rules
      for(const rule of conditionalRules){
        if(rule.col !== c) continue;
        // compare numeric if possible
        for(const el of targets){
          const idref = spec.isPair ? cellId(c,r,'_in') : cellId(c,r,'');
          const valRaw = cellMap[idref]?.value ?? '';
          const v = parseFloat(valRaw);
          const compare = isFinite(v) ? v : NaN;
          let matched = false;
          if(!isNaN(compare)){
            switch(rule.operator){
              case '>': matched = compare > rule.value; break;
              case '<': matched = compare < rule.value; break;
              case '=': matched = compare === rule.value; break;
            }
          }
          el.style.background = matched ? rule.color : (spec.isPair ? 'var(--in-bg)' : 'var(--in-bg)');
        }
      }
    }
  }
}

// ---------------- EXPORT HELPERS ----------------
function exportCSV(type='latex'){
  // header row uses columnTypes[].name
  const header = columnTypes.map(s=>s.name).join(',');
  const rows = [header];
  for(let r=0;r<numRows;r++){
    const cells = [];
    for(let c=0;c<numCols;c++){
      const spec = columnTypes[c];
      let val = '';
      if(spec.isPair){
        const id = cellId(c,r,'_in');
        if(type==='latex') val = cellMap[id]?.value || '';
        else val = cellMap[id]?.render?.innerHTML || '';
      } else {
        val = cellMap[cellId(c,r,'')]?.value || '';
      }
      cells.push('"' + String(val).replace(/"/g,'""') + '"');
    }
    rows.push(cells.join(','));
  }
  const blob = new Blob([rows.join('\n')], { type:'text/csv;charset=utf-8;' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = (type==='latex'?'sheet_latex.csv':'sheet_html.csv'); link.click();
}

function exportJSON(type='latex'){
  const out = [];
  for(let r=0;r<numRows;r++){
    const obj = {};
    for(let c=0;c<numCols;c++){
      const spec = columnTypes[c];
      let val = '';
      if(spec.isPair){
        const id = cellId(c,r,'_in');
        val = (type==='latex') ? cellMap[id]?.value || '' : cellMap[id]?.render?.innerHTML || '';
      } else {
        val = cellMap[cellId(c,r,'')]?.value || '';
      }
      obj[spec.name] = val;
    }
    out.push(obj);
  }
  const blob = new Blob([JSON.stringify(out, null, 2)], { type:'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = (type==='latex'?'sheet_latex.json':'sheet_html.json'); link.click();
}

// Expose API for UI modules
window.ss = {
  addColumn, addRow, renderTable, removeColumn, renameColumn, removeRow,
  copyRow, pasteRow, copyColumn, pasteColumn,
  addConditionalRule, deleteConditionalRule, conditionalRules,
  exportCSV, exportJSON,
  getState: () => ({ columnTypes: JSON.parse(JSON.stringify(columnTypes)), numRows, numCols }),
  cellMap, columnTypes
};

// small helpers UI will call
function updateBufferUI(){ if(window.ui_updateBuffer) ui_updateBuffer(pasteBuffer); }
window.updateBufferUI = updateBufferUI;

