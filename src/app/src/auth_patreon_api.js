/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */

import url from 'url';
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';

import { setLogin, failLogin } from '#src/auth.js';
import { log, warn, error } from '#src/log.js';
// import { red } from 'colors';

// Config

let clientId = "";
let clientSecret = "";
let loginURL = "";
let redirectURL = "";
let patreonIpAddress = false;
    
export function setupPatreonAuth (conf) {
  clientId = conf('patreon_v2_client_id');
  clientSecret = conf('patreon_v2_client_secret');
  
  redirectURL = conf('url')+'auth/patreon-redirect';
  log("patreon", "Patreon redirect URL:    ", redirectURL);
  loginURL = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectURL)}`;
  log("patreon", "Patreon login URL:       ", loginURL);

  
  dns.lookup('www.patreon.com', (err, address, family) => {
    if (err) {
      error("patreon", "Cannot lookup DNS", err);
      return;
    }
    log("patreon", `Found address: ${address} family: IPv${family}`);
    patreonIpAddress = address;
  });
}

export function patreonLoginURL() {
  return loginURL;
}

// API calls

function apiCall(apiPath, method = 'GET', useHttps = true, accessToken = false) {
  return new Promise((resolve, reject) => {
    let url = (useHttps ? 'https' : 'http')+'://www.patreon.com/api/'+apiPath;

    let headers = {};
    if (accessToken) {
      headers['Authorization'] = 'Bearer '+accessToken;
    }

    // Bypass DNS lookup function to save DNS timeouts/failures
    let lookup = (hostname, options, callback) => {
      log("patreon", "Lookup", hostname, options);
      if (hostname == 'www.patreon.com' && patreonIpAddress) {
        if (options.all) {
          callback(null, [ { address: patreonIpAddress, family: 4}])
        } else {
          callback(null, patreonIpAddress, 4);
        }
        return;
      }
      error("patreon", "Lookup what?", hostname);
      try {
        dns.lookup(hostname, options, (err, address, family) => {
          error("patreon", "DNS error", err);
          callback(err, address, family);
        });
      } catch (ex) {
        error("patreon", "DNS error", ex);
      }
    };

    // Make the API call
    log("patreon", "API call".green, url, "headers:".yellow, headers);
    try {
      (useHttps ? https : http).get(url, { method, headers, lookup }, (response) => {
        // log("patreon", "API response", response);
        
        const { statusCode, statusMessage, rawHeaders } = response;

        if (statusCode == 301) {
          error("patreon", "Redirect:", rawHeaders);
          reject(statusMessage);
          return;
        };

        if (statusCode !== 200) {
          error("patreon", "API response code:", statusCode, statusMessage);
          // error("patreon", "Response", response);
          reject(statusMessage);
          return;
        }

        response.setEncoding('utf8');
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', () => {
          try {
            const body = JSON.parse(rawData);
            log("patreon", "API result:", body);
            resolve(body);
          } catch (e) {
            error("patreon", "API exception:", e);
            reject(e.message);
          }
        });
      });
    } catch (e) {
      error("patreon", "API exception:", e);
      reject(e.message);
    }
  });
}

function verifyOauthToken(oauthToken) {
  return new Promise((resolve, reject) => {
    let url = `oauth2/token?code=${oauthToken}&grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectURL}`;
    apiCall(url, 'POST', true)
      .then((body) => {
        log("patreon", "verifyOauthToken: loaded", body);
        resolve(body);
      })
      .catch((err) => {
        error("patreon", "verifyOauthToken: Error from Patreon API", err);
        reject(err);
      })
  });
}

function getMembershipData(accessToken) {
  return new Promise((resolve, reject) => {
    let includes = 'include=memberships';
    let userFields = 'fields[user]=full_name,email';
    let campaignFields = 'fields[campaign]=summary,is_monthly';
    let membershipFields = 'fields[member]=patron_status';
    // are none of those useful?
    let url = `oauth2/v2/identity?${includes}&${userFields}&${membershipFields}`;
    
    apiCall(url, 'GET', true, accessToken)
      .then((body) => {
        log("patreon", "getMembershipData: loaded", JSON.stringify(body, null, 2));
        
        let name = body.data.attributes ? body.data.attributes.full_name : null;
        let isPatron = false;
        
        if (body.included) {
          let memberships = body.included.filter((inc) => inc.type == 'member' && inc.attributes && inc.attributes.patron_status == 'active_patron');
          if (memberships.length >= 1) {
            log("patreon", "Found membership", memberships);
            isPatron = true;
          }
        }

        resolve({
          name,
          isPatron
        });
      })
      .catch((err) => {
        error("patreon", "getMembershipData: Error from Patreon API", err);
        reject(err);
      });
  });
}

// Handle an auth redirect

export function patreonHandleRedirect (req, res) {
  log("patreon", "Incoming redirect", req.url);
  let query = url.parse(req.url, true).query;
  log("patreon", "Incoming query", query);

  let redirect = '/';
  if (query.state !== 'None') {
    redirect = query.state;
  }
  
  // User said 'no' to sharing info
  if (query.error == 'access_denied') {
    failLogin(res, redirect);
    return;
  }

  var oauthToken = query.code;
  log("patreon", "OAuth token:", oauthToken);

  verifyOauthToken(oauthToken).then((patreonInfo) => {
    let {access_token} = patreonInfo;

    getMembershipData(access_token).then(({name, isPatron}) => {
      if (!isPatron) {
        warn("patreon", "No pledge");
        failLogin(res, redirect);
        return;
      }
      
      setLogin(res, name, redirect);
    }).catch((err) => {
      error('patreon', 'Error (getCurrentPledge)', err);
      failLogin(res, redirect);
    });
  }).catch((err) => {
    error('patreon', 'Error (getCurrentPledge)', err);
    failLogin(res, redirect);
  });
}

