/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */

let authLogger = getDebug('auth');
enableDebug('auth');

function checkSignature(message, signature, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(message);
    hash.update(salt);
    var signature2 = hash.digest('hex');

    return signature == signature2;
}

async function initLogin() {
  body.dataset.loggedIn = false;
  let response = await fetch('/auth/check');
  if (!response.ok) {
    return;
  }

  let msg = await response.json();
  if (msg.isLoggedIn) {
    authLogger.warn("Logged in!");
    body.dataset.isLoggedIn = true;
  }

  for (let loginLink of document.getElementsByClassName('auth-login-link')) {
    loginLink.href = msg.patreonLoginURL;
  }
}

// async init
setTimeout(initLogin, 1);

function isLoggedIn() {
  return bool(body.dataset.loggedIn);
}
