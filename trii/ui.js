const UI = (() => {
  const sidebar = document.getElementById("sidebar");

  function showSidebar() {
    sidebar.innerHTML = `
      <h3>Conditional Formatting</h3>
      <label>Condition: <input id="cond"></label>
      <label>Color: <input id="color" type="color"></label>
      <button onclick="UI.applyFormatting()">Apply</button>
    `;
    sidebar.classList.toggle("hidden");
  }

  function applyFormatting() {
    const cond = document.getElementById("cond").value;
    const color = document.getElementById("color").value;

    document.querySelectorAll("#spreadsheet td[data-id]").forEach(cell => {
      const val = Spreadsheet.cellMap[cell.dataset.id] || "";
      try {
        if (eval(val + cond)) {
          cell.style.background = color;
        }
      } catch (e) {
        console.warn("Invalid condition", e);
      }
    });
  }

  return { showSidebar, applyFormatting };
})();
