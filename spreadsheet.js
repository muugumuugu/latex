// spreadsheet.js
// Core Spreadsheet Engine (global functions/vars used by loader)

const wrapper = document.getElementById('gridWrapper');
const columnTypes = []; // {type, isPair, name}
const cellMap = {};     // id -> { element, render, type, value }
let numRows = 0;
let numCols = 0;

function colName(n){ let s=''; while(n>=0){ s=String.fromCharCode(65+(n%26))+s; n=Math.floor(n/26)-1;} return s; }
function rowName(r){ return (r+1).toString(); }
function cellId(c,r,suffix=''){ return colName(c)+rowName(r)+(suffix||''); }

function addColumn(type, header){
  columnTypes.push({ type, isPair: type==='latex', name: header || colName(numCols) });
  numCols++;
}

function addRow(){
  numRows++;
  renderTable();
}

// Renders whole table from columnTypes and numRows
function renderTable(){
  wrapper.innerHTML = '';
  const table = document.createElement('table'); table.className = 'sheet';
  const thead = document.createElement('thead'); const headRow = document.createElement('tr');

  const corner = document.createElement('th'); corner.className = 'corner'; corner.textContent = ''; headRow.appendChild(corner);

  // headers
  for(let c=0;c<numCols;c++){
    const spec = columnTypes[c];
    if(spec.isPair){
      const thIn = document.createElement('th'); thIn.textContent = spec.name + ' (In)'; headRow.appendChild(thIn);
      const thOut = document.createElement('th'); thOut.textContent = spec.name + ' (Out)'; headRow.appendChild(thOut);
    } else {
      const th = document.createElement('th'); th.textContent = spec.name; headRow.appendChild(th);
    }
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  // body
  const tbody = document.createElement('tbody');
  for(let r=0;r<numRows;r++){
    const tr = document.createElement('tr');
    const thRow = document.createElement('th'); thRow.className = 'rowHeader'; thRow.textContent = rowName(r);
    tr.appendChild(thRow);

    for(let c=0;c<numCols;c++){
      const spec = columnTypes[c];

      if(spec.isPair){
        // In cell
        const tdIn = document.createElement('td');
        const ta = document.createElement('textarea');
        ta.className = 'input-cell';
        const idIn = cellId(c,r,'_in');
        ta.value = cellMap[idIn]?.value || '';
        // hide input by default; preview will be visible
        ta.style.display = 'none';
        tdIn.appendChild(ta);
        tr.appendChild(tdIn);

        // Out cell (preview)
        const tdOut = document.createElement('td');
        const divOut = document.createElement('div');
        divOut.className = 'render-cell';
        tdOut.appendChild(divOut);
        tr.appendChild(tdOut);

        // Save to cellMap
        cellMap[idIn] = cellMap[idIn] || { type:'latex', value: ta.value };
        cellMap[idIn].element = ta;
        cellMap[idIn].render = divOut;

        // Attach handlers (ensures one handler per element)
        attachLatexHandlers(ta, divOut, idIn);

      } else {
        // simple text/formula column
        const td = document.createElement('td');
        const ta = document.createElement('textarea');
        ta.className = 'input-cell';
        const id = cellId(c,r,'');
        ta.value = cellMap[id]?.value || '';
        td.appendChild(ta);
        tr.appendChild(td);

        cellMap[id] = cellMap[id] || { type: spec.type === 'formula' ? 'formula' : 'text', value: ta.value };
        cellMap[id].element = ta;
        cellMap[id].type = cellMap[id].type || spec.type;

        // simple input binding (overwrite to avoid duplicates)
        ta.oninput = function(){
          cellMap[id].value = ta.value;
        };
        ta.onclick = function(){ navigator.clipboard?.writeText(ta.value).catch(()=>{}); ta.style.outline='2px solid blue'; setTimeout(()=>ta.style.outline='',200); };
      }
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrapper.appendChild(table);

  // After building table, ensure all latex previews rendered
  for(const id in cellMap){
    if(cellMap[id].type === 'latex' && cellMap[id].render){
      // render current stored value (keeps LaTeX as-is)
      try {
        const code = cellMap[id].value || '';
        cellMap[id].render.innerHTML = texme.render(code);
        if(window.MathJax && window.MathJax.Hub){
          window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, cellMap[id].render]);
        }
      } catch(e){
        cellMap[id].render.innerHTML = '<span style="color:red">render error</span>';
      }
    }
  }
}

// Attaches perfect In/Out behavior to a latex cell
function attachLatexHandlers(input, preview, id){
  // remove previous handlers if any (safe-guard)
  input.onfocus = null;
  input.onblur = null;
  input.oninput = null;
  preview.onclick = null;

  // render function
  function renderNow(){
    const code = input.value || '';
    try {
      preview.innerHTML = texme.render(code);
    } catch(e){
      preview.innerHTML = '<span style="color:red">render error</span>';
    }
    // update stored value
    cellMap[id].value = code;
    // MathJax typeset (if present)
    if(window.MathJax && window.MathJax.Hub){
      window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, preview]);
    }
  }

  // initial render and display state
  renderNow();
  input.style.display = 'none';
  preview.style.display = 'block';

  // On preview click => switch to input (edit)
  preview.onclick = function(){
    preview.style.display = 'none';
    input.style.display = 'block';
    input.focus();
    // put caret at end
    const val = input.value;
    input.value = '';
    input.value = val;
  };

  // On input blur => render and switch to preview
  input.onblur = function(){
    renderNow();
    input.style.display = 'none';
    preview.style.display = 'block';
  };

  // Live preview as typing (but don't switch display)
  input.oninput = function(){
    // update preview live without switching to it
    try {
      preview.innerHTML = texme.render(input.value || '');
    } catch(e){
      preview.innerHTML = '<span style="color:red">render error</span>';
    }
    cellMap[id].value = input.value || '';
  };

  // Click textarea copies raw LaTeX
  input.onclick = function(ev){
    ev.stopPropagation();
    navigator.clipboard?.writeText(input.value).catch(()=>{});
    input.style.outline='2px solid blue'; setTimeout(()=>input.style.outline='',200);
  };

  // Click preview copies HTML
  preview.addEventListener('dblclick', function(){ // double-click for copy to avoid conflict with single-click toggling
    navigator.clipboard?.writeText(preview.innerHTML).catch(()=>{});
    preview.style.outline='2px solid green'; setTimeout(()=>preview.style.outline='',200);
  });
}

// Exports

function exportCSV(){
  const rows = [];
  const headerRow = columnTypes.map(spec => spec.name);
  rows.push(headerRow.join(','));
  for(let r=0;r<numRows;r++){
    const cells = [];
    for(let c=0;c<numCols;c++){
      const spec = columnTypes[c];
      let val = '';
      if(spec.isPair){
        val = cellMap[cellId(c,r,'_in')]?.value || '';
      } else {
        val = cellMap[cellId(c,r,'')]?.value || '';
      }
      cells.push('"' + val.replace(/"/g,'""') + '"');
    }
    rows.push(cells.join(','));
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'sheet_latex.csv'; link.click();
}

function exportJSON(){
  const out = [];
  for(let r=0;r<numRows;r++){
    const obj = {};
    for(let c=0;c<numCols;c++){
      const spec = columnTypes[c];
      let val = '';
      if(spec.isPair){
        val = cellMap[cellId(c,r,'_in')]?.value || '';
      } else {
        val = cellMap[cellId(c,r,'')]?.value || '';
      }
      obj[spec.name] = val;
    }
    out.push(obj);
  }
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'sheet_latex.json'; link.click();
}

// UI bindings (buttons exist in index.html)
document.getElementById('addRow').addEventListener('click', addRow);
document.getElementById('exportCSV').addEventListener('click', exportCSV);
document.getElementById('exportJSON').addEventListener('click', exportJSON);
