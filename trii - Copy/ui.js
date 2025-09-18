let copiedRow = null;
let copiedCol = null;

function showFormattingSidebar() {
  document.getElementById('sidebar').classList.remove('hidden');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.add('hidden');
}

function applyFormatting() {
  const col = document.getElementById('fmtCol').value.toUpperCase();
  const cond = document.getElementById('fmtCond').value;
  const val = document.getElementById('fmtVal').value;
  const color = document.getElementById('fmtColor').value;

  for (const id in cellMap) {
    if (id.startsWith(col)) {
      const c = cellMap[id];
      const v = c.value || '';
      let match = false;
      if (cond === 'equals') match = v === val;
      if (cond === 'greater') match = parseFloat(v) > parseFloat(val);
      if (cond === 'less') match = parseFloat(v) < parseFloat(val);
      if (cond === 'contains') match = v.includes(val);
      if (match) {
        c.element.style.background = color;
        c.render.style.background = color;
      }
    }
  }
}

/* -------------------
   Row / Column ops
------------------- */

function deleteRow(rowIndex) {
  if (rowIndex < 0 || rowIndex >= numRows) return;
  for (let c = 0; c < numCols; c++) {
    delete cellMap[cellId(c, rowIndex)];
  }
  // Shift rows up
  const newMap = {};
  for (let r = 0; r < numRows; r++) {
    if (r === rowIndex) continue;
    const targetR = r > rowIndex ? r - 1 : r;
    for (let c = 0; c < numCols; c++) {
      const srcId = cellId(c, r);
      const dstId = cellId(c, targetR);
      if (cellMap[srcId]) newMap[dstId] = cellMap[srcId];
    }
  }
  cellMap = newMap;
  numRows--;
  renderTable();
}

function deleteColumn(colIndex) {
  if (colIndex < 0 || colIndex >= numCols) return;
  for (let r = 0; r < numRows; r++) {
    delete cellMap[cellId(colIndex, r)];
  }
  columnTypes.splice(colIndex, 1);
  // Shift columns left
  const newMap = {};
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (c === colIndex) continue;
      const srcC = c;
      const dstC = c > colIndex ? c - 1 : c;
      const srcId = cellId(srcC, r);
      const dstId = cellId(dstC, r);
      if (cellMap[srcId]) newMap[dstId] = cellMap[srcId];
    }
  }
  cellMap = newMap;
  numCols--;
  renderTable();
}

/* -------------------
   Copy / Paste Row/Col
------------------- */

function copyRow(rowIndex) {
  if (rowIndex < 0 || rowIndex >= numRows) return;
  copiedRow = [];
  for (let c = 0; c < numCols; c++) {
    const id = cellId(c, rowIndex);
    copiedRow.push(cellMap[id] ? cellMap[id].value : '');
  }
  alert("Row " + rowName(rowIndex) + " copied!");
}

function pasteRow(rowIndex) {
  if (!copiedRow) return;
  if (rowIndex < 0 || rowIndex >= numRows) return;
  for (let c = 0; c < numCols; c++) {
    const id = cellId(c, rowIndex);
    if (!cellMap[id]) continue;
    cellMap[id].value = copiedRow[c];
    cellMap[id].element.value = copiedRow[c];
  }
  renderTable();
}

function copyColumn(colIndex) {
  if (colIndex < 0 || colIndex >= numCols) return;
  copiedCol = [];
  for (let r = 0; r < numRows; r++) {
    const id = cellId(colIndex, r);
    copiedCol.push(cellMap[id] ? cellMap[id].value : '');
  }
  alert("Column " + colName(colIndex) + " copied!");
}

function pasteColumn(colIndex) {
  if (!copiedCol) return;
  if (colIndex < 0 || colIndex >= numCols) return;
  for (let r = 0; r < numRows; r++) {
    const id = cellId(colIndex, r);
    if (!cellMap[id]) continue;
    cellMap[id].value = copiedCol[r];
    cellMap[id].element.value = copiedCol[r];
  }
  renderTable();
}
