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

    case 'pathfinder2':
    case 'pathfinder2remaster':
    case 'starfinder2':
      url = '/download/pathfinder2';
      break;
  }

  const options = {
    method: 'POST',
    body: doc,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  fetch(url, options)
    .then((res) => {
      // get the filename from the headers
      let fileName = 'file.html';
      let contentDispo = res.headers.get('Content-Disposition');
      if (contentDispo) {
        fileName = contentDispo.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1];
        if (fileName.startsWith('"') && fileName.endsWith('"')) {
          fileName = fileName.substring(1, fileName.length - 1);
        }
      }
      
      // download the file
      res.blob().then((data) => {
        let a = document.createElement('a');
        a.href = window.URL.createObjectURL(data);
        a.download = fileName;
        a.dispatchEvent(new MouseEvent('click'));
      });
    })
    .catch((err) => console.log(err));

  
  downloadDisabled = false;
}
