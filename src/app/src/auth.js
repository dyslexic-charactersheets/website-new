import crypto from 'crypto';

import { setupPatreonAuth, patreonRedirect, patreonLoginURL, patreonRedirectURL } from '#src/auth_patreon_api.js';
import { setupTranslatorsAuth } from '#src/auth_translators.js';
import { setupTokenAuth } from '#src/auth_token.js';

// general
let conf;
let sessionKey;

let baseURL = false;

function setupAuth() {
    if (baseURL)
        return;
    baseURL = conf('url');
    
    console.log("[auth]          Base URL:  ", baseURL);
    sessionKey = conf('session_key');
    auth.allowJustLogin = conf('allow_just_login');
    setupPatreonAuth(conf, auth);
    setupTranslatorsAuth(conf, auth);
    setupTokenAuth(conf, auth);
}

function checkSignature(message, signature, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(message);
    hash.update(salt);
    var signature2 = hash.digest('hex');

    return signature == signature2;
}

export var auth = {
    allowJustLogin: false,

    setup: () => {
        setupAuth();
    },

    isLoggedIn: req => {
        setupAuth();

        try {
            if (req.cookies.hasOwnProperty('login')) {
                var cookieParts = req.cookies.login.split(/:/);
                var loginToken = cookieParts[0];
                var signature = cookieParts[1];

                return checkSignature(loginToken, signature, sessionKey);
            }
        } catch (e) {
            console.log(e);
            return false;
        }
        
        return false;
    },

    setLogin: (res, redirect = false) => {
        var loginDur = 3600*24*30*1000; // 30 days
        var now = Date.now();

        var loginToken = "$"+now;

        const hash = crypto.createHash('sha256');
        hash.update(loginToken);
        hash.update(sessionKey);
        var signature = hash.digest('hex');

        var cookie = loginToken+":"+signature;
        res.cookie('login', cookie, { maxAge: loginDur, httpOnly: true }).redirect((redirect ? '/' : '')+'#login_success');
    },

    failLogin: (res, redirect = false) => {
        res.redirect((redirect ? '/' : '')+'#login_fail');
    },

    logout: (res) => {
        res.clearCookie('login').redirect('/#logged_out');
    },

    patreonLoginURL: () => auth_patreon.loginURL(),
    patreonRedirectURL: () => patreonRedirectURL,

    patreonLogin: (req, res) => {
        setupAuth();
        patreonLogin(req, res);
    },

    patreonRedirect: (req, res) => {
        setupAuth();
        patreonRedirect(req, res)
    },

    translatorsLoginURL: () => auth_translators.loginURL(),

    translatorsLogin: (req, res) => {
        setupAuth();
        translatorsLogin(req, res);
    },

    tokenLogin: (req, res) => {
        setupAuth();
        tokenLogin(req, res);
    }
};

// module.exports = function (c) {
//     conf = c;
//     return auth;
// };
