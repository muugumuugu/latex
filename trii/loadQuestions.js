const Loader = (() => {
  async function loadFiles(questionsFile, solutionsFile) {
    const qRes = await fetch(questionsFile);
    const sRes = await fetch(solutionsFile);
    const qText = await qRes.text();
    const sText = await sRes.text();

    const questions = parseQuestions(qText);
    const solutions = parseSolutions(sText);

    questions.forEach((q, i) => {
      Spreadsheet.cellMap[`${i}-0`] = q.number;
      Spreadsheet.cellMap[`${i}-1`] = q.text;
      Spreadsheet.cellMap[`${i}-2`] = solutions[i]?.answer || "";
      Spreadsheet.cellMap[`${i}-3`] = solutions[i]?.solution || "";
    });

    Spreadsheet.addRow(); // expand rows
    Spreadsheet.addColumn(); // expand cols
    Spreadsheet.addColumn();
    Spreadsheet.addColumn();
  }

  function parseQuestions(text) {
    return text.split("\n\n").map((block, i) => ({
      number: `Q${i + 1}`,
      text: block.trim()
    }));
  }

  function parseSolutions(text) {
    return text.split("\n\n").map(block => {
      const [answer, ...rest] = block.split("\n");
      return { answer, solution: rest.join("\n") };
    });
  }

  return { loadFiles };
})();
