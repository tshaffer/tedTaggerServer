import express from 'express';
import axios from 'axios';
import Moment from 'moment';
import opn from 'open';

const CREDENTIALS = require('../../secrets/credentials.json').web;

export class AuthService {

  authStorage: any;
  config: any;
  cachedToken: any;
  cbServerTimer: any;

  constructor(authStorage: any) {

    this.authStorage = authStorage;

    this.config = {};
    this.config.requiredScopes = [];
    this.config.listenOnPort = 3001;
    this.config.cbUrl = `http://localhost:${this.config.listenOnPort}/oauth2redirect`;

    this.cachedToken = null;
    this.cbServerTimer = null;
  }

  async getToken() {
    if (!this.cachedToken || this._isTokenExpired(this.cachedToken)) {
      await this.authenticate(this.config.requiredScopes);
    }

    return this.cachedToken.token;
  }

  async authenticate(scopes: any[] = []) {
    this.config.requiredScopes = scopes;
    const storedToken = this.authStorage.loadToken();

    if (!storedToken) {
      return this._authenticate(scopes);
    }

    let authToken = storedToken.token;

    if (this._isTokenExpired(storedToken)) {
      authToken = this._refreshToken(authToken);
    }

    this.cachedToken = this.authStorage.loadToken();
    return authToken;
  }

  async _authenticate(scopes: any[] = []) {
    return new Promise((resolve, reject) => {
      const url = this._setAuthorizationParameters(scopes, this.config.cbUrl);

      const app = express();

      const server = app.listen(this.config.listenOnPort, () => {
        opn(url, { wait: false }).then((cb: any) => cb.unref());
      });

      app.get('/oauth2redirect', async (req: any, res: any) => {
        const msg = this._createMessageFromCbRequest(req);
        res.end(msg);
        server.close();

        if (!!req.query.error) {
          return reject(`authentication error ${req.query}`);
        }

        const { code, scope: approvedScopes } = req.query;

        if (!this._isRequiredScopesApproved(approvedScopes)) {
          return reject(`Approved scopes are not sufficient; approved: ${approvedScopes}, required: ${this.config.requiredScopes}`);
        }

        const tokenRequest = this._createAuthorizationTokenRequest(code, this.config.cbUrl);
        const authToken: any = await this._getToken(tokenRequest);
        this.authStorage.storeToken(authToken);
        resolve(authToken);

        clearTimeout(this.cbServerTimer);
        server.close();
      });

      this.cbServerTimer = setTimeout(() => server.close(), 30000);
    });
  }

  _setAuthorizationParameters(scopes: any, cbUrl: any) {
    const scopesStr = scopes.join(' ');

    return `${CREDENTIALS.auth_uri}?` +
      `scope=${scopesStr}&` +
      `response_type=code&` +
      `redirect_uri=${cbUrl}&` +
      `access_type=offline&` +
      `client_id=${CREDENTIALS.client_id}`;
  }

  _createMessageFromCbRequest(req: any) {
    let msg = '';

    if (!!req.query.error) {
      msg = JSON.stringify(req.query, null, 4);
    } else {
      msg = 'Authentication successful! Please return to the console.';
    }

    return msg;
  }

  _isRequiredScopesApproved(approvedScopes: any) {
    const requiredScopesSet = new Set(this.config.requiredScopes);
    const approved = approvedScopes.split(' ').filter((x: any) => requiredScopesSet.has(x));

    return approved.length === this.config.requiredScopes.length;
  }

  _createAuthorizationTokenRequest(code: any, cbUrl: any) {
    return {
      code,
      client_id: CREDENTIALS.client_id,
      client_secret: CREDENTIALS.client_secret,
      redirect_uri: cbUrl,
      grant_type: 'authorization_code'
    };
  }

  _isTokenExpired(storedToken: any) {
    const expiresInInSec = storedToken.token.expires_in;
    const tokenExpiresAt = Moment.utc(storedToken.tokenCreatedAt).add(expiresInInSec, 'seconds');

    const diff = tokenExpiresAt.diff(Moment.utc(), 'seconds');
    return diff <= 10; // sec
  }

  async _refreshToken(authToken: any) {
    const refreshTokenRequest = this._createRefreshTokenRequest(authToken);
    const refreshToken: any = await this._getToken(refreshTokenRequest);

    if (!!refreshToken.error) {
      throw new Error(`Could not refresh token. ${refreshToken.error} ${refreshToken.error_description}`);
    }

    const { access_token, expires_in, token_type } = refreshToken;
    authToken.access_token = access_token;
    refreshToken.expires_in = expires_in;
    refreshToken.token_type = token_type;

    this.cachedToken = this.authStorage.storeToken(authToken);

    return authToken;
  }

  _createRefreshTokenRequest(authToken: any) {
    return {
      refresh_token: authToken.refresh_token,
      client_id: CREDENTIALS.client_id,
      client_secret: CREDENTIALS.client_secret,
      grant_type: 'refresh_token'
    };
  }

  async _getToken(tokenRequest: any) {

    return axios.post(CREDENTIALS.token_uri,
      {
        client_id: tokenRequest.client_id,
        client_secret: tokenRequest.client_secret,
        grant_type: tokenRequest.grant_type,
        refresh_token: tokenRequest.refresh_token,
      })
      .then((response) => {
        return Promise.resolve(response.data);
      }, (error) => {
        debugger;
        console.log(error);
      });

    // return new Promise((resolve, reject) => {
    //   request.post(CREDENTIALS.token_uri, {
    //     form: tokenRequest
    //   }, (err: any, resp: any, body: any) => {
    //     if (err) {
    //       console.error('getToken error', err);
    //       return reject(err);
    //     }
    //     const authToken = JSON.parse(body);
    //     resolve(authToken);
    //   });
    // });
  }

}
