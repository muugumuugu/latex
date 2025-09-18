let questions = [];
let solutions = [];

function loadQuestions(input) {
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    questions = reader.result.split('\n').filter(x => x.trim());
    fillSheet();
  };
  reader.readAsText(file);
}

function loadSolutions(input) {
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    solutions = reader.result.split('\n').filter(x => x.trim());
    fillSheet();
  };
  reader.readAsText(file);
}

function fillSheet() {
  if (!questions.length || !solutions.length) return;

  numRows = questions.length;
  numCols = 3;
  columnTypes = [
    { type: 'latex', header: 'Question' },
    { type: 'latex', header: 'Answer' },
    { type: 'latex', header: 'Solution' }
  ];
  cellMap = {};
  renderTable();

  for (let r = 0; r < questions.length; r++) {
    const q = questions[r];
    const s = solutions[r] || '';
    const ansLetter = s.charAt(0);
    const ansText = s.slice(2);

    cellMap[cellId(0, r)].element.value = q;
    cellMap[cellId(0, r)].value = q;

    cellMap[cellId(1, r)].element.value = ansLetter;
    cellMap[cellId(1, r)].value = ansLetter;

    cellMap[cellId(2, r)].element.value = ansText;
    cellMap[cellId(2, r)].value = ansText;
  }
}
