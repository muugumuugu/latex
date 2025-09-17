const Spreadsheet = (() => {
  let table;
  let rows = 3;
  let cols = 3;
  let cellMap = {};

  function init() {
    table = document.getElementById("spreadsheet");
    render();
  }

  function render() {
    table.innerHTML = "";

    // Header row
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headerRow.insertCell(); // empty corner
    for (let c = 0; c < cols; c++) {
      const th = document.createElement("th");
      th.contentEditable = true;
      th.textContent = `Col${c + 1}`;
      th.dataset.col = c;
      th.oninput = () => cellMap[`header-${c}`] = th.textContent;
      headerRow.appendChild(th);
    }

    // Data rows
    const tbody = table.createTBody();
    for (let r = 0; r < rows; r++) {
      const row = tbody.insertRow();
      const rowHeader = row.insertCell();
      rowHeader.textContent = r + 1;

      for (let c = 0; c < cols; c++) {
        const cell = row.insertCell();
        const id = `${r}-${c}`;
        cell.contentEditable = true;
        cell.dataset.id = id;

        // Show LaTeX on focus, render on blur
        cell.addEventListener("focus", () => {
          cell.textContent = cellMap[id] || "";
        });
        cell.addEventListener("blur", () => {
          cellMap[id] = cell.textContent;
          renderLatex(cell, cellMap[id]);
        });

        if (cellMap[id]) {
          renderLatex(cell, cellMap[id]);
        }
      }
    }
  }

  function renderLatex(cell, content) {
    cell.innerHTML = content;
    MathJax.typesetPromise([cell]);
  }

  function addRow() {
    rows++;
    render();
  }

  function addColumn() {
    cols++;
    render();
  }

  function getData(format = "latex") {
    const data = [];
    for (let r = 0; r < rows; r++) {
      const row = {};
      for (let c = 0; c < cols; c++) {
        const header = cellMap[`header-${c}`] || `Col${c + 1}`;
        const id = `${r}-${c}`;
        let val = cellMap[id] || "";

        if (format === "html") {
          const div = document.createElement("div");
          div.innerHTML = val;
          val = div.textContent;
        }
        row[header] = val;
      }
      data.push(row);
    }
    return data;
  }

  return { init, addRow, addColumn, getData, cellMap };
})();

window.addEventListener("DOMContentLoaded", Spreadsheet.init);
