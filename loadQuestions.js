// loadQuestions.js
(function(){
  const fileInput = document.getElementById('jsonFileInput');
  const loadDefaultsBtn = document.getElementById('btnLoadDefaults');

  function createColumnsFromSample(sample){
    // clear engine state
    // (we rely on engine's global arrays; easiest is to reset them and re-add)
    // This file assumes window.ss exposes addColumn, addRow, renderTable and the arrays are global
    // We'll just overwrite columnTypes and numRows by calling methods available
    // For safety, we rebuild: set engine columnTypes directly
    // BUT to avoid breaking encapsulation, we will call engine methods: remove all columns/rows then add
    // Reset: brute force by setting numRows/numCols via engine internal globals (they are global in spreadsheet.js)
    // Simpler: call window.ss to reset by reloading the table via direct manipulation:
    // (Here we assume columnTypes and numRows are globals in spreadsheet.js — they are.)
    window.columnTypes.length = 0;
    window.numRows = 0;
    window.numCols = 0;

    for(const k in sample){
      if(k === 'text' || k === 'solution' || k === 'notes') window.ss.addColumn('latex', k);
      else window.ss.addColumn('text', k);
    }
  }

  function populateFromArray(arr){
    if(!arr || !arr.length) return;
    createColumnsFromSample(arr[0]);
    arr.forEach(item=>{
      window.ss.addRow();
      const r = window.numRows - 1;
      let c = 0;
      for(const key in item){
        const spec = window.columnTypes[c];
        const id = spec.isPair ? cellId(c,r,'_in') : cellId(c,r,'');
        const raw = (item[key] === null || item[key] === undefined) ? '' : String(item[key]);
        if(window.cellMap[id]){
          window.cellMap[id].element.value = raw;
          window.cellMap[id].value = raw;
          if(window.cellMap[id].render){
            try{ window.cellMap[id].render.innerHTML = texme.render(raw); }catch(e){ window.cellMap[id].render.innerHTML = '<span style="color:red">render error</span>'; }
          }
        }
        c++;
      }
    });
    // final renderTable call to ensure UI updated
    window.renderTable && window.renderTable();
    window.ui_updateSelectors && window.ui_updateSelectors();
    window.applyConditionalFormatting && window.applyConditionalFormatting();
  }

  // file input -> read local JSON and load
  fileInput.addEventListener('change', (e)=>{
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = function(ev){
      try{
        const arr = JSON.parse(ev.target.result);
        if(!Array.isArray(arr)) return alert('JSON must be an array of objects');
        populateFromArray(arr);
      }catch(err){ alert('Error parsing JSON: ' + err.message); }
    };
    r.readAsText(f,'utf-8');
  });

  // auto-load default file if available on server
  loadDefaultsBtn.addEventListener('click', async ()=>{
    try{
      const resp = await fetch('questions_latex.json');
      if(!resp.ok) return alert('Default JSON not found at questions_latex.json');
      const arr = await resp.json();
      populateFromArray(arr);
    }catch(err){ alert('Could not load default JSON: '+err.message); }
  });

})();
