let numRows = 3;
let numCols = 3;
let wrapper;
let cellMap = {};
let columnTypes = [];

window.onload = () => {
  wrapper = document.getElementById('wrapper');
  for (let c = 0; c < numCols; c++) columnTypes.push({ type: 'latex', header: colName(c) });
  renderTable();
};

// Helpers
function colName(c) { return String.fromCharCode(65 + c); }
function rowName(r) { return (r + 1).toString(); }
function cellId(c, r) { return colName(c) + rowName(r); }

function renderTable() {
  wrapper.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'sheet';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');

  const corner = document.createElement('th');
  headRow.appendChild(corner);

  for (let c = 0; c < numCols; c++) {
    const spec = columnTypes[c];
    const th = document.createElement('th');
    th.textContent = spec.header || colName(c);
    th.contentEditable = true;
    th.onblur = () => spec.key = th.textContent;
    headRow.appendChild(th);
  }

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (let r = 0; r < numRows; r++) {
    const tr = document.createElement('tr');
    const thRow = document.createElement('th');
    thRow.textContent = rowName(r);
    tr.appendChild(thRow);

    for (let c = 0; c < numCols; c++) {
      const td = document.createElement('td');
      const id = cellId(c, r);

      const ta = document.createElement('textarea');
      const divOut = document.createElement('div');

      ta.className = 'input-cell';
      divOut.className = 'render-cell';
      divOut.style.display = 'none';

      ta.value = cellMap[id]?.value || '';

      td.appendChild(ta);
      td.appendChild(divOut);

      cellMap[id] = cellMap[id] || { type: 'latex', value: ta.value };
      cellMap[id].element = ta;
      cellMap[id].render = divOut;

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  wrapper.appendChild(table);

  wireAllHandlers();
}

function wireAllHandlers() {
  for (const id in cellMap) {
    const c = cellMap[id];
    if (c.type === 'latex' && c.element && c.render) {
      const input = c.element;
      const preview = c.render;

      function renderNow() {
        const code = (input.value || '').trim();
        try { preview.innerHTML = texme.render(code); }
        catch (e) { preview.innerHTML = '<span style="color:red">render error</span>'; }
        if (window.MathJax && window.MathJax.Hub) {
          window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, preview]);
        }
        c.value = code;
      }

      input.addEventListener('focus', () => {
        input.style.display = '';
        preview.style.display = 'none';
      });
      input.addEventListener('blur', () => {
        renderNow();
        input.style.display = 'none';
        preview.style.display = '';
      });

      input.addEventListener('click', () => navigator.clipboard?.writeText(input.value || ''));
      preview.addEventListener('click', () => navigator.clipboard?.writeText(preview.innerHTML || ''));

      if (input.value.trim()) {
        renderNow();
        input.style.display = 'none';
        preview.style.display = '';
      }
    }
  }
}

// Row / Column ops
function addRow() { numRows++; renderTable(); }
function addColumn() { numCols++; columnTypes.push({ type: 'latex', header: colName(numCols - 1) }); renderTable(); }
