import re
import json
import html

# --- Load files ---
with open("questions.txt", "r", encoding="utf-8") as f:
    questions_txt = f.read()

with open("answers.txt", "r", encoding="utf-8") as f:
    answers_txt = f.read()

# --- Parse questions ---
question_blocks = re.split(r'(?=A\d+\. )', questions_txt)
answer_blocks = re.split(r'(?=A\d+\. )', answers_txt)
questions_data = []

for q_block in question_blocks:
    q_block = q_block.strip()
    if not q_block:
        continue
    q_id_match = re.match(r'(A\d+)\.', q_block)
    if not q_id_match:
        continue
    q_id = q_id_match.group(1)

    options_matches = re.findall(r'\(([A-D])\)\s*([^\n]+)', q_block)
    options = {opt: text.strip() for opt, text in options_matches} if options_matches else None

    if options_matches:
        first_opt_start = q_block.find(options_matches[0][0])
        text = q_block[:first_opt_start].strip()
        text = re.sub(r'^B\d+\.\s*', '', text)
    else:
        text = re.sub(r'^B\d+\.\s*', '', q_block).strip()

    table_match = re.search(r'\\begin\{tabular\}\{[^\}]+\}(.+?)\\end\{tabular\}', q_block, re.DOTALL)
    table = None
    if table_match:
        table_text = table_match.group(1).strip()
        lines = [line for line in table_text.splitlines() if '&' in line]
        headers = [h.strip() for h in re.split(r'&|\|', lines[0]) if h.strip()]
        values = [v.strip() for v in re.split(r'&|\|', lines[1]) if v.strip()]
        table = {headers[i]: [values[i]] for i in range(len(headers))}

    graph_match = re.search(r'([a-zA-Z0-9_\-]+\.jpg|\.png|\.jpeg)', q_block)
    graph = graph_match.group(1) if graph_match else None

    solution_text = None
    answer_letter = None
    for a_block in answer_blocks:
        if a_block.startswith(q_id):
            match_letter = re.search(r'\b' + re.escape(q_id) + r'\.\s*\(?([A-D])\)?', a_block)
            if match_letter:
                answer_letter = match_letter.group(1)
            solution_text = a_block.split(')', 1)[-1].strip()
            break

    questions_data.append({
        "id": q_id,
        "text": text,
        "options": options,
        "answer": answer_letter,
        "solution": solution_text,
        "notes": solution_text,
        "type": "mcq",
        "table": table,
        "graph": graph
    })

# --- Export CSV/JSON helpers ---
def export_csv(filename, data, use_html=False):
    import csv
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        headers = ["id", "text", "options", "answer", "solution", "notes", "table", "graph"]
        writer.writerow(headers)
        for q in data:
            text = html.escape(q['text']) if use_html else q['text']
            solution = html.escape(q['solution']) if use_html else q['solution']
            options = {k: html.escape(v) if use_html else v for k, v in (q['options'] or {}).items()}
            table = json.dumps(q['table'], ensure_ascii=False) if q['table'] else ""
            writer.writerow([q['id'], text, json.dumps(options, ensure_ascii=False), q['answer'], solution, solution, table, q['graph']])

def export_json(filename, data, use_html=False):
    out = []
    for q in data:
        text = html.escape(q['text']) if use_html else q['text']
        solution = html.escape(q['solution']) if use_html else q['solution']
        options = {k: html.escape(v) if use_html else v for k, v in (q['options'] or {}).items()}
        out.append({
            "id": q['id'],
            "text": text,
            "options": options,
            "answer": q['answer'],
            "solution": solution,
            "notes": solution,
            "table": q['table'],
            "graph": q['graph'],
            "type": q['type']
        })
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

# --- Run exports ---
export_csv("questions_latex.csv", questions_data, use_html=False)
export_csv("questions_html.csv", questions_data, use_html=True)
export_json("questions_latex.json", questions_data, use_html=False)
export_json("questions_html.json", questions_data, use_html=True)

print(f"Exported {len(questions_data)} questions to 4 files")
