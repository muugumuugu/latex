const Export = (() => {
  function exportCSV(format) {
    const rows = Spreadsheet.getData(format);
    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map(r => headers.map(h => `"${r[h]}"`).join(","))
    ].join("\n");
    download(csv, `spreadsheet-${format}.csv`, "text/csv");
  }

  function exportJSON(format) {
    const rows = Spreadsheet.getData(format);
    download(JSON.stringify(rows, null, 2), `spreadsheet-${format}.json`, "application/json");
  }

  function download(content, filename, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  return { exportCSV, exportJSON };
})();
