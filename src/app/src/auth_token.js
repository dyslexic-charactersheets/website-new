/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */

// Translators login
import crypto from 'crypto';
import moment from 'moment';

import { setLogin, failLogin } from '#src/auth.js';
import { log, error } from '#src/log.js';

const dateFormat = 'YYYY-MM';

let loginTokens = [];
let timedTokenBase;
let timedTokens = [];
let date = '';

function updateTimedTokens() {
    let d = moment().format(dateFormat);
    if (date != d) {
        date = d;
        let tt = [];

        for (let i = 2; i >= 0; i--) {
            d = moment().subtract(i, "months").format(dateFormat);
            
            let hash = crypto.createHash('sha256');
            hash.update(timedTokenBase);
            hash.update(d);
            let token = hash.digest('hex').substring(0, 32);

            log("token", `Timed token (${i}):`, token);
            tt.push(token);
        }
        timedTokens = tt;
    }
}

export function setupTokenAuth(conf) {
    loginTokens = conf('login_tokens');
    loginTokens.forEach(token => {
        let url = conf('url')+'auth/token-login?token='+token;
        log("token", "Token login URL:        ", url);
    });
    // log("token", "Tokens:", loginTokens);

    timedTokenBase = conf('timed_token_base');
    updateTimedTokens();
    let url = conf('url')+'auth/token-login?token='+timedTokens[2];
    log("token", "Timed token login URL:  ", url);
}

export function getTimedLoginToken() {
    updateTimedTokens();
}

export function tokenLogin(req, res) {
    log("token", "Login");
    try {
        let token = req.query.token;
        log("token", "Token =", token);

        // static tokens
        if (loginTokens.indexOf(token) != -1) {
            log("token", "Static token OK! Login now");
            setLogin(res, true);
            return;
        }

        // timed tokens
        updateTimedTokens();
        if (timedTokens.indexOf(token) != -1) {
            log("token", "Timed token OK! Login now");
            setLogin(res, true);
            return;
        }

        // Nope.
        failLogin(res, true);
    } catch (e) {
        error("token", "Error:", e);
        failLogin(res, true);
    }
}
