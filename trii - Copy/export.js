function showExportOptions() {
  const type = prompt("Export type: csv-latex, csv-html, json-latex, json-html");
  if (!type) return;
  if (type.startsWith('csv')) exportCSV(type.endsWith('latex') ? 'latex' : 'html');
  else exportJSON(type.endsWith('latex') ? 'latex' : 'html');
}

function exportCSV(mode) {
  let out = '';
  const headers = columnTypes.map(c => c.key || c.header);
  out += headers.join(',') + '\n';
  for (let r = 0; r < numRows; r++) {
    const row = [];
    for (let c = 0; c < numCols; c++) {
      const id = cellId(c, r);
      const cell = cellMap[id];
      if (!cell) { row.push(''); continue; }
      if (mode === 'latex') row.push('"' + (cell.value || '').replace(/"/g, '""') + '"');
      else row.push('"' + (cell.render?.innerHTML || cell.value || '').replace(/"/g, '""') + '"');
    }
    out += row.join(',') + '\n';
  }
  download(out, 'sheet.csv');
}

function exportJSON(mode) {
  const data = [];
  for (let r = 0; r < numRows; r++) {
    const obj = {};
    for (let c = 0; c < numCols; c++) {
      const id = cellId(c, r);
      const key = columnTypes[c].key || columnTypes[c].header;
      const cell = cellMap[id];
      if (!cell) continue;
      if (mode === 'latex') obj[key] = cell.value || '';
      else obj[key] = cell.render?.innerHTML || cell.value || '';
    }
    data.push(obj);
  }
  download(JSON.stringify(data, null, 2), 'sheet.json');
}

function download(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
