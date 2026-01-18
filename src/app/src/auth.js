/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */

import crypto from 'crypto';

import { setupPatreonAuth, patreonRedirect, patreonLoginURL } from '#src/auth_patreon_api.js';
import { setupTranslatorsAuth, translatorsLogin } from '#src/auth_translators.js';
import { setupTokenAuth, tokenLogin } from '#src/auth_token.js';
import { log, error } from '#src/log.js';
import { has } from '#src/util.js';

// general
let conf;
let sessionKey;

let baseURL = false;
let allowJustLogin = false;

export function setupAuth(c) {
    conf = c;
    if (baseURL) {
        log("auth", "Auth already setup:  ", baseURL);
        return;
    }
    baseURL = conf('url');
    
    log("auth", "Base URL:  ", baseURL);
    sessionKey = conf('session_key');
    allowJustLogin = conf('allow_just_login');

    setupPatreonAuth(conf);
    setupTranslatorsAuth(conf);
    setupTokenAuth(conf);
}

function checkSignature(message, signature, salt) {
    signature = signature.toString();
    
    const hash = crypto.createHash('sha256');
    hash.update(message);
    hash.update(salt);
    let expectSignature = hash.digest('hex').toString();

    log("auth", "Check signature:", signature, "==", expectSignature);
    return signature == expectSignature;
}

export function isLoggedIn(req) {
    try {
        log("auth", "isLoggedIn: cookie =", req.cookies);
        if (has(req.cookies, 'login')) {
            let cookieParts = req.cookies.login.split(/:/);
            let loginToken = cookieParts[0];
            let signature = cookieParts[1];

            return checkSignature(loginToken, signature, sessionKey);
        }
    } catch (e) {
        console.log(e);
        return false;
    }
    
    return false;
}

export function checkAuth(req, res) {
    let result = {
        isLoggedIn: isLoggedIn(req),
        patreonLoginURL: patreonLoginURL()
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result));
}

export function setLogin(res, redirect = false) {
    const loginDur = 3600*24*30*1000; // 30 days
    const now = Date.now();

    const loginToken = "$"+now;

    const hash = crypto.createHash('sha256');
    hash.update(loginToken);
    hash.update(sessionKey);
    let signature = hash.digest('hex');

    let cookie = loginToken+":"+signature.toString();
    res.cookie('login', cookie, { maxAge: loginDur, httpOnly: true, domain: undefined }).redirect((redirect ? '/' : '')+'#login_success');
}

export function failLogin(res, redirect = false) {
    res.redirect((redirect ? '/' : '')+'#login_fail');
}

export function logout(req, res) {
    res.clearCookie('login').redirect('/#logged_out');
}

export { patreonRedirect };

export function translatorsLoginURL() {
    return auth_translators.loginURL();
}

export { translatorsLogin };

export { tokenLogin };