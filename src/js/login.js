function checkSignature(message, signature, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(message);
    hash.update(salt);
    var signature2 = hash.digest('hex');

    return signature == signature2;
}

function initIsLoggedIn() {
  body.dataset.loggedIn = false;

  // get the cookie value
  let cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("login="))
    ?.split("=")[1];

  if (cookieValue === undefined) {
    return;
  }
  
  let cookieParts = cookieValue.split(/:/);
  let loginToken = cookieParts[0];
  let signature = cookieParts[1];

  if (checkSignature(loginToken, signature, sessionKey)) {
    body.dataset.loggedIn = true;
  }
}

// async init
setTimeout(initIsLoggedIn, 1);

function isLoggedIn() {
  // TODO login
  return bool(body.dataset.loggedIn);
}
