// loadQuestions.js
// Loads a JSON file and populates the spreadsheet engine.
// Expects JSON array of objects: [{ id: "...", text: "...", options: {...}, answer: "A", solution: "..." }, ...]

(function(){
  const fileInput = document.getElementById('jsonFileInput');

  // helper to create columns from keys (keeps LaTeX keys as latex pair)
  function createColumnsFromSample(sample){
    // clear any previous columns/state
    columnTypes.length = 0;
    for(const k in sample){
      // treat specific keys as latex content
      if(k === 'text' || k === 'solution' || k === 'notes'){
        addColumn('latex', k);
      } else {
        addColumn('text', k);
      }
    }
  }

  // Fill worksheet from data array
  function populateFromArray(arr){
    // reset rows
    numRows = 0;
    // build columns
    createColumnsFromSample(arr[0]);
    // add rows and fill values
    arr.forEach(item => {
      addRow();
      const r = numRows - 1;
      let c = 0;
      for(const key in item){
        const spec = columnTypes[c];
        const id = spec.isPair ? cellId(c, r, '_in') : cellId(c, r, '');
        const raw = (item[key] === null || item[key] === undefined) ? '' : String(item[key]);
        if(cellMap[id]){
          cellMap[id].element.value = raw;
          cellMap[id].value = raw;
          if(cellMap[id].render){
            try{
              cellMap[id].render.innerHTML = texme.render(raw);
              if(window.MathJax && window.MathJax.Hub){
                window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, cellMap[id].render]);
              }
            } catch(e){
              cellMap[id].render.innerHTML = '<span style="color:red">render error</span>';
            }
            // ensure display state: preview visible, input hidden
            cellMap[id].element.style.display = 'none';
            cellMap[id].render.style.display = 'block';
          }
        }
        c++;
      }
    });
  }

  // When a JSON file is selected via input, parse and load
  fileInput.addEventListener('change', function(evt){
    const f = evt.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = function(e){
      try{
        const arr = JSON.parse(e.target.result);
        if(!Array.isArray(arr) || arr.length === 0) { alert('JSON must be an array with at least one object'); return; }
        populateFromArray(arr);
      }catch(err){
        alert('Error parsing JSON: ' + err.message);
      }
    };
    reader.readAsText(f, 'utf-8');
  });

  // Optional: auto-load default file at startup if present on server
  async function tryAutoLoad(){
    try{
      const resp = await fetch('questions_latex.json');
      if(!resp.ok) return;
      const arr = await resp.json();
      if(Array.isArray(arr) && arr.length) populateFromArray(arr);
    }catch(e){ /* ignore */ }
  }
  tryAutoLoad();

})();
