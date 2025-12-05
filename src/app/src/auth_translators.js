/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */

// Translators login
import crypto from 'crypto';

import { setLogin, failLogin } from '#src/auth.js';

var sharedSecret;

function checkSignature(token, signature, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(token, 'latin1');
    hash.update(salt, 'latin1');
    var signature2 = hash.digest('hex');

    console.log("[auth]          Check signature:        ", signature, "==", signature2);

    return signature == signature2;
}

export function setupTranslatorsAuth (conf) {
    sharedSecret = conf('shared_secret');
}

export const loginURL = "https://translate.dyslexic-charactersheets.com/authorize";

export function translatorsLogin (req, res) {
    console.log("[auth]          Translator's login");
    try {
        var token = req.query.login;

        var tokenParts = token.split(/:/);
        var id = tokenParts[0];
        var signature = tokenParts[1];
        console.log("[auth]          Shared secret:          ", sharedSecret);
        console.log("[auth]          Login token:            ", id);
        console.log("[auth]          Signature:              ", signature);

        if (!checkSignature(id, signature, sharedSecret)) {
            console.log("[auth]          Signature doesn't match");
            failLogin(res, true);
            return;
        }
        console.log("[auth]          Translator login now");
        setLogin(res, true);
    } catch (e) {
        console.log("[auth]          Translator's login: Error:", e);
        // res.redirect('/login');
        failLogin(res, true);
    }
}
