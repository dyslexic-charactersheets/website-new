#!/usr/bin/env node

/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */


import { resolve } from 'path';
import 'colors';

// set up the http engine
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';

import { log } from '#src/log.js';

// my own data
import { conf, onConfigLoaded } from '#src/conf.js';
import { renderDnD35, renderPathfinder1, renderStarfinder1 } from '#src/recomposer/recomposer.js';

// login
import { setupAuth, checkAuth, patreonRedirect, tokenLogin, translatorsLogin, logout } from '#src/auth.js';

// engines
import { pathfinder2init, pathfinder2render } from '#src/pathfinder2-server.js';

const app = express();
app.use(cookieParser());

app.use(express.json({ limit: '100mb' }));

let upload = multer({
  // allow post/upload up to 100MB
  limits: { fieldSize: 100 * 1024 * 1024 }
});


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

app.get('/auth/check', checkAuth);

app.get('/auth/patreon-redirect', patreonRedirect);

app.get('/auth/translators-login', translatorsLogin);
app.get('/auth/token-login', tokenLogin);

app.get('/auth/logout', logout);

app.post('/message', (req, res) => {
  message.sendMessage(req, res);
});


// build
app.post('/download/pathfinder2', upload.any(), (req, res) => pathfinder2render(req, res));
// app.post('/download/starfinder2', upload.any(), (req, res) => pathfinder2render(req, res));
app.post('/download/pathfinder1', upload.any(), (req, res) => renderPathfinder1(req, res));
app.post('/download/starfinder1', upload.any(), (req, res) => renderStarfinder1(req, res));
app.post('/download/dnd35', upload.any(), (req, res) => renderDnD35(req, res));


// === Run Server ===

onConfigLoaded(() => {
  setupAuth(conf);
  pathfinder2init();
  setTimeout(() => {
    var listen_port = conf('listen_port');
    app.listen(listen_port, () => log("server", `██  Listening on port ${listen_port}\n\n`.green));
  }, 200);
});
