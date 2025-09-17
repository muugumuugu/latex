// ui.js
// builds the sidebar UI and wires it to the spreadsheet engine (window.ss)

(function(){
  // DOM refs
  const cfColSelect = document.getElementById('cfColSelect');
  const cfOpSelect = document.getElementById('cfOpSelect');
  const cfValue = document.getElementById('cfValue');
  const cfColor = document.getElementById('cfColor');
  const addRuleBtn = document.getElementById('addRuleBtn');
  const ruleList = document.getElementById('ruleList');

  const colSelect = document.getElementById('colSelect');
  const colHeaderInput = document.getElementById('colHeaderInput');
  const renameColBtn = document.getElementById('renameColBtn');
  const delColBtn = document.getElementById('delColBtn');

  const rowSelect = document.getElementById('rowSelect');
  const delRowBtn = document.getElementById('delRowBtn');

  const copyRowBtn = document.getElementById('copyRowBtn');
  const pasteRowBtn = document.getElementById('pasteRowBtn');
  const copyColBtn = document.getElementById('copyColBtn');
  const pasteColBtn = document.getElementById('pasteColBtn');

  const bufferInfo = document.getElementById('bufferInfo');

  // populate selects from ss state
  function updateSelectors(){
    const state = window.ss.getState();
    // columns
    cfColSelect.innerHTML = ''; colSelect.innerHTML = '';
    state.columnTypes.forEach((spec,i)=>{
      const opt1 = document.createElement('option'); opt1.value = i; opt1.textContent = spec.name; cfColSelect.appendChild(opt1);
      const opt2 = document.createElement('option'); opt2.value = i; opt2.textContent = spec.name; colSelect.appendChild(opt2);
    });
    // rows
    rowSelect.innerHTML = '';
    for(let r=0;r<state.numRows;r++){
      const o = document.createElement('option'); o.value = r; o.textContent = (r+1); rowSelect.appendChild(o);
    }
  }

  function renderRules(){
    ruleList.innerHTML = '';
    window.ss.conditionalRules.forEach(rule=>{
      const div = document.createElement('div'); div.className='ruleItem';
      const label = document.createElement('div'); label.textContent = `${colName(rule.col)} ${rule.operator} ${rule.value}`;
      const color = document.createElement('div'); color.className='colorBox'; color.style.background = rule.color;
      const edit = document.createElement('button'); edit.textContent='Edit'; edit.className='action-btn';
      const del = document.createElement('button'); del.textContent='Delete'; del.className='action-btn';
      div.appendChild(label); div.appendChild(color); div.appendChild(edit); div.appendChild(del);
      ruleList.appendChild(div);

      edit.onclick = ()=>{
        const newCol = prompt('Column index (0=A):', rule.col);
        const newOp = prompt('Operator (>,<,=):', rule.operator);
        const newVal = prompt('Value:', rule.value);
        const newColor = prompt('Color (hex):', rule.color);
        if(newCol!==null){
          window.ss.deleteConditionalRule(rule.id);
          window.ss.addConditionalRule(Number(newCol), newOp, Number(newVal), newColor);
        }
      };
      del.onclick = ()=>{
        window.ss.deleteConditionalRule(rule.id);
      };
    });
  }

  // helpers to convert column index to name (same as engine)
  function colName(n){ let s=''; while(n>=0){ s=String.fromCharCode(65+(n%26))+s; n=Math.floor(n/26)-1;} return s; }

  // wire buttons
  addRuleBtn.onclick = ()=>{
    const col = Number(cfColSelect.value || 0);
    const op = cfOpSelect.value;
    const val = Number(cfValue.value || 0);
    const color = cfColor.value || '#ffff99';
    window.ss.addConditionalRule(col, op, val, color);
    renderRules();
  };

  // column rename/delete
  renameColBtn.onclick = ()=>{
    const idx = Number(colSelect.value);
    const name = colHeaderInput.value.trim();
    if(isNaN(idx)) return alert('Choose a column');
    window.ss.renameColumn(idx, name);
    updateSelectors();
  };
  delColBtn.onclick = ()=>{
    const idx = Number(colSelect.value);
    if(!confirm('Delete column '+idx+'?')) return;
    window.ss.removeColumn(idx);
    updateSelectors();
  };

  // row delete
  delRowBtn.onclick = ()=>{
    const r = Number(rowSelect.value);
    if(!confirm('Delete row '+(r+1)+'?')) return;
    window.ss.removeRow(r);
    updateSelectors();
  };

  // copy/paste bindings - they use window.ss copy/paste functions
  copyRowBtn.onclick = ()=>{
    const r = Number(rowSelect.value||0);
    window.ss.copyRow(r);
    updateBufferUI();
  };
  pasteRowBtn.onclick = ()=>{
    const r = Number(rowSelect.value||0);
    window.ss.pasteRow(r);
    updateSelectors();
  };
  copyColBtn.onclick = ()=>{
    const idx = Number(colSelect.value||0);
    window.ss.copyColumn(idx);
    updateBufferUI();
  };
  pasteColBtn.onclick = ()=>{
    const idx = Number(colSelect.value||0);
    window.ss.pasteColumn(idx);
    updateSelectors();
  };

  // buffer UI
  function updateBufferUI(){
    if(window.pasteBuffer === null || window.pasteBuffer === undefined){
      bufferInfo.textContent = 'Empty';
    } else {
      bufferInfo.textContent = window.pasteBuffer.type + ' copied';
    }
  }

  // replace global hooks used by engine
  window.ui_updateSelectors = updateSelectors;
  window.ui_renderRules = renderRules;
  window.ui_updateBuffer = updateBufferUI;

  // initial call to populate selectors when engine loads
  setTimeout(()=>{ updateSelectors(); renderRules(); updateBufferUI(); }, 200);

})();
