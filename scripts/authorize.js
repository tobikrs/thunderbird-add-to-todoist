import { uuidv4 } from "./common.js";

const CLIENT_ID = "c2d0475590df46fdaeabe26577959f32";
const SCOPES = ["task:add", "data:read"];
const REDIRECT_URL = `https://127.0.0.1/mozoauth2/${messenger.identity.getRedirectURL().replace(/.*\:\/\/([^\.]*)\..*/, '$1')}`;

const AUTH_URL = `https://todoist.com/oauth/authorize\
?client_id=${CLIENT_ID}\
&scope=${encodeURIComponent(SCOPES.join(","))}\
&redirect_uri=${encodeURIComponent(REDIRECT_URL)}`;

const VALIDATION_URL = "";

function extractAccessToken(redirectUri) {
    let m = redirectUri.match(/[#?](.*)/);
    if (!m || m.length < 1) return null;
    let params = new URLSearchParams(m[1].split("#")[0]);
    return params.getAll();
}

function validateAuth(redirectURL) {
    console.log(redirectURL);

    console.log(extractAccessToken(redirectURL));
}

function authorize() {
    return setAuthState()
        .then((state) => {
            const url = AUTH_URL + `&state=${state}`;
            console.debug("AuthURL: " + url);

            return messenger.identity.launchWebAuthFlow({
                interactive: true,
                url,
                // redirect_uri: REDIRECT_URL
            });
        })
        .catch((err) => {
            throw new Error(`Failed to set new auth state:\n  ${err}`);
        });
}

function getAuthState() {
    return messenger.storage.local
        .get({ authState })
        .then((state) => state)
        .catch((err) =>
            Promise.reject(
                new Error(
                    `Failed to read auth state from local storage:\n  ${err}`
                )
            )
        );
}

function setAuthState() {
    const state = uuidv4();

    return messenger.storage.local
        .set({ authState: state })
        .then((_) => state)
        .catch((err) => {
            throw new Error(`Failed to store auth state:\n  ${err}`);
        });
}

export function getNewAccessToken() {
    return authorize()
        .then(validateAuth)
        .catch((err) => {
            throw new Error(`Failed to authorize: ${err}`);
        });
}

export function getAccessToken() {
    return messenger.storage.local
        .get("accessToken")
        .then(({ accessToken }) => {
            if (!!accessToken) {
                return accessToken;
            }

            return getNewAccessToken()
                .then((token) => token)
                .catch((err) =>
                    Promise.reject(
                        new Error(`Failed to get a new access token:\n  ${err}`)
                    )
                );
        });
}

export function saveAccessToken(token = "") {
    return browser.storage.local
        .set({ accessToken: token })
        .then((_) => token)
        .catch((err) =>
            Promise.reject(
                new Error(
                    `Can't write property 'accessToken' to local storage:\n  ${err}`
                )
            )
        );
}
