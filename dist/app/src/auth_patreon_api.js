/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */

import url from 'url';
import patreon from 'patreon';

import { setLogin, failLogin } from '#src/auth.js';
import { log, warn, error } from '#src/log.js';

let patreonOAuthClient;

let loginURL = "";
let redirectURL = "";

function getCurrentPledge(api) {
  let fields = 'fields[memberships]=status,currently_entitled_amount_cents';
  let url = `/current_user?include=memberships.null&${encodeURIComponent(fields)}`;
  return new Promise((resolve, reject) => {
    api(url)
      .then(({store}) => {
        log("patreon", "getCurrentPledge: store loaded", store);
        var pledges = store.findAll('pledge');
        log("patreon", "getCurrentPledge:", pledges);
        resolve((pledges.length >= 0) ? pledges[0] : null);
      })
      .catch((err) => {
        error("patreon", "Error from Patreon API", err);
        reject(err);
      });
  });
}

function getAPI(oauthGrantCode) {
  return new Promise((resolve, reject) => {
    log("patreon", "getAPI: oauth grant code =", oauthGrantCode, "redirect URL =", patreonRedirectURL());
    patreonOAuthClient.getTokens(oauthGrantCode, patreonRedirectURL())
      .then((tokensResponse) => {
        log("patreon", "getAPI", tokensResponse);
        var api = patreon.patreon(tokensResponse.access_token);
        resolve(api);
      })
      .catch((err) => {
        error("patreon", "getAPI", err);
        reject(err);
      });
  });
}

export function patreonLoginURL() {
  return loginURL;
}

function patreonRedirectURL() {
  return redirectURL;
}
    
export function setupPatreonAuth (conf) {
  var client_id = conf('patreon_v1_client_id');
  var client_secret = conf('patreon_v1_client_secret');
  
  patreonOAuthClient = patreon.oauth(client_id, client_secret);
  
  redirectURL = conf('url')+'auth/patreon-redirect';
  log("patreon", "Patreon redirect URL:    ", redirectURL);
  loginURL = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirectURL)}`;
  log("patreon", "Patreon login URL:       ", loginURL);
}

export function patreonRedirect (req, res) {
  var oauthGrantCode = url.parse(req.url, true).query.code;
  log("patreon", "OAuth grant code:", oauthGrantCode);

  getAPI(oauthGrantCode).then((api) => {
    log("patreon", "API loaded");
    getCurrentPledge(api).then((pledge) => {
      log("patreon", "Pledge:", pledge);
      if (pledge === undefined || pledge === null) {
        warn("patreon", "Pledge is null");
        failLogin(res, true);
        return;
      }
      
      var pledgeValue = pledge.amount_cents;
      if (pledgeValue === null || pledgeValue == 0) {
        warn("patreon", "No pledge")
        failLogin(res, true);
        return;
      }
      setLogin(res, true);
    }).catch((err) => {
      error('patreon', 'Error (getCurrentPledge)', err);
      failLogin(res, true);
    });

  }).catch((err) => {
    error('patreon', 'Error (getAPI)', err);
    failLogin(res, true);
  });
}

