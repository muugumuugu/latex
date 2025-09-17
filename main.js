window.onload = function () {
  var input = document.getElementById('input')
  var preview = document.getElementById('preview')
  var copy = document.getElementById('copy')

  var texmeLine = '<!DOCTYPE html>' +
      '<script src="texme.js">' +
      '</script><textarea>'

  var timeout = null

  // Remove leading whitespace and add HTML to load TeXMe.
  function normalizeInput() {
    var code = input.value.replace(/^\s+/, '')
    if (!code.startsWith(texmeLine) && code.length > 0) {
      code = texmeLine + '\n\n' + code
    }
    input.value = code
  }

  // Render the outupt to the preview pane.
  function renderPreview() {
    var code = input.value
    code = code.replace(texmeLine, '')
    code = code.trim()
    preview.innerHTML = texme.render(code)
    window.MathJax.Hub.Queue(['resetEquationNumbers', MathJax.InputJax.TeX],
                             ['Typeset', window.MathJax.Hub, preview])
  }

  // Handle input.
  function handleInput() {
    normalizeInput()
    renderPreview()
  }

  // Schedule input handler to process input after a short delay.
  //
  // When the user edits an element in the input form, the
  // corresponding element of the output sheet is not updated
  // immediately for two reasons:
  //
  //   - A fast typist can type 7 to 10 characters per second. Updating
  //     the output sheet so frequently, causes the user interface to
  //     become less responsive.
  //
  //   - The onpaste or oncut functions of an input element gets
  //     the old value of the element instead of the new value
  //     resulting from the cut or paste operation.
  //
  // This function works around the above issues by scheduling the
  // handleInput() function to be called after 100 milliseconds. This
  // ensures that the preview is not updated more than 10 times per
  // second. This also ensures that when the handleInput() function is
  // invoked as a result of a cut or paste operation on a text field
  // element, then it gets the updated value of the element.
  function scheduleInputHandler() {
    if (timeout !== null) {
      window.clearTimeout(timeout)
      timeout = null
    }
    timeout = window.setTimeout(handleInput, 100)
  }

  function CopyToClipboard(containerid) {
  if (document.selection) {
    var range = document.body.createTextRange();
    range.moveToElementText(document.getElementById(containerid));
    range.select().createTextRange();
    document.execCommand("copy");
  } else if (window.getSelection) {
    var range = document.createRange();
    range.selectNode(document.getElementById(containerid));
    window.getSelection().addRange(range);
    document.execCommand("copy");
  }
}

  // Copy input to clipboard.
  function copyCode() {
    //input.select()
   // document.execCommand('copy')
    CopyToClipboard('preview');
  }

  input.onkeyup = scheduleInputHandler
  input.onpaste = scheduleInputHandler
  input.oncut = scheduleInputHandler
  copy.onclick = copyCode
}
