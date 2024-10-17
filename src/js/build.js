//  -- BUILD WIZARD --  //

let downloadDisabled = false;
function downloadCharacterSheet(request) {
  // don't download twice at once...
  if (downloadDisabled) {
    return;
  }
  downloadDisabled = true;

  // ...but timeout quickly
  downloadTimeout = setTimeout(function () {
    downloadDisabled = false;
    clearTimeout(downloadTimeout);
  });

  // the request
  let doc = JSON.stringify(request);

  let url = '/download';
  switch (request.data.attributes.game) {
    case 'pathfinder':
    case 'pathfinder1':
      url = '/download/pathfinder1';
      break;

    case 'starfinder':
    case 'starfinder1':
      url = '/download/starfinder1';
      break;

    case 'dnd35':
      url = '/download/dnd35';
      break;
  }

  let xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  // xhr.setRequestHeader('X-CSRFToken', csrftoken);
  xhr.setRequestHeader('Content-Type', 'application/javascript');
  xhr.responseType = 'blob';

  xhr.onload = function (e) {
    let blob = e.currentTarget.response;
    let fileName = 'file.html';
    let contentDispo = e.currentTarget.getResponseHeader('Content-Disposition');
    if (contentDispo) {
      fileName = contentDispo.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1];
      if (fileName.startsWith('"') && fileName.endsWith('"')) {
        fileName = fileName.substring(1, fileName.length - 1);
      }
    }
    
    let a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = fileName;
    a.dispatchEvent(new MouseEvent('click'));
  }
  xhr.send(doc);
  
  downloadDisabled = false;
}
