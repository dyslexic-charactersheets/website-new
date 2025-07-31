#!/usr/bin/env nodejs

import url from 'url';
import { resolve } from 'path';
import 'colors';

// set up the http engine
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import multer from 'multer';

import { log } from '#src/log.js';

// my own data
import { conf, onConfigLoaded } from '#src/conf.js';
// const message = require('./src/message')(conf);
import { renderDnD35, renderPathfinder1, renderStarfinder1 } from '#src/recomposer/recomposer.js';

// login
import { auth } from '#src/auth.js';

// engines
// const gameData = require('./src/gamedata.js');
// const iconicData = require('./src/iconicdata');
import { pathfinder2init, pathfinder2formData, pathfinder2render } from '#src/pathfinder2-server.js';

const app = express();
app.use(cookieParser());
// app.use(express.urlencoded({ limit: '100mb', extended: true }));
// app.use(express.text({ limit: '100mb', type: '*/*' }));

app.use(express.json({ limit: '100mb' }));

// app.use(bodyParser.text({type: '*/*'}));
// app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
// app.use(bodyParser.formData());
// app.use(express.json({ type: 'application/json' }));

let upload = multer({
  // allow post/upload up to 100MB
  limits: { fieldSize: 100 * 1024 * 1024 }
});
// app.use(bodyParser());


// === Endpoints ===

// redirects
app.get('/', (req, res) => res.redirect('/en/'));
app.get('/build/pathfinder2', (req, res) => res.redirect('/en/build-pathfinder2.html'));
app.get('/build/pathfinder', (req, res) => res.redirect('/en/build-pathfinder1.html'));
app.get('/build/starfinder', (req, res) => res.redirect('/en/build-starfinder1.html'));
app.get('/build/dnd35', (req, res) => res.redirect('/en/build-dnd35.html'));

// static files
log("server", "Static dir:", resolve('htdocs'));
app.use(express.static('htdocs'));

log("server", "Iconics dir:", resolve('../../assets/iconics/small'));
app.use('/iconics', express.static('../../assets/iconics/small'));

log("server", "Logos dir:", resolve('../../assets/logos'));
app.use('/logos', express.static('../../assets/logos'));

function renderLogin(req, res, lang) {
  auth.setup();
  var no_login = !!url.parse(req.url, true).query.no_login;
  var patreon_login_url = auth.patreonLoginURL();
  var translators_login_url = auth.translatorsLoginURL();

  return res.render('login', {
    title: 'Login - Dyslexic Character Sheets',
    lang: lang,
    translators_login_url: translators_login_url,
    patreon_login_url: patreon_login_url,
    allow_just_login: auth.allowJustLogin,
    scriptFile: "charsheets.js",
    no_login: no_login,
    isLoggedIn: auth.isLoggedIn(req),
  });
}

app.get('/auth/patreon-redirect', auth.patreonRedirect);

// app.get('/auth/login', (req, res) => renderLogin(req, res, 'en'));

app.get('/auth/translators-login', auth.translatorsLogin);
app.get('/auth/token-login', auth.tokenLogin);

app.get('/auth/logout', (req, res) => auth.logout(res));

var loginGuard = function (req, res, lang, fn) {
  if (conf('require_login') && !auth.isLoggedIn(req)) {
    return renderLogin(req, res, lang);
  }
  return fn();
};

app.post('/message', (req, res) => {
  message.sendMessage(req, res);
});


// go!
app.post('/download/pathfinder2', upload.any(), (req, res) => pathfinder2render(req, res, 'en'));

app.post('/download/pathfinder1', upload.any(), (req, res) => renderPathfinder1(req, res));
app.post('/download/starfinder1', upload.any(), (req, res) => renderStarfinder1(req, res));
app.post('/download/dnd35', upload.any(), (req, res) => renderDnD35(req, res));

onConfigLoaded(() => {
  pathfinder2init();
  setTimeout(() => {
    var listen_port = conf('listen_port');
    app.listen(listen_port, () => log("server", `██  Listening on port ${listen_port}\n\n`.green));
  }, 200);
});
