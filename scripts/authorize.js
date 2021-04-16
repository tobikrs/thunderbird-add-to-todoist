import { uuidv4, handleRequestNotOk } from "./common.js";

const CLIENT_ID = "c2d0475590df46fdaeabe26577959f32";
const CLIENT_SECRET = "f8aeb08c99db46ab8cf547d816c30f6a";
const SCOPES = ["data:read_write"];
const REDIRECT_URL = "https://tobikrs.github.io/thunderbird-add-to-todoist/";
const TOKEN_EXCHANGE_URL = "https://todoist.com/oauth/access_token";

const AUTH_URL = `https://todoist.com/oauth/authorize\
?client_id=${CLIENT_ID}\
&scope=${encodeURIComponent(SCOPES.join(","))}`;

var authWindow;

function saveAccessToken(token) {
    return messenger.storage.local
        .set({ accessToken: token })
        .then(() => token);
}

function exchangeAccessToken(code) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const body = JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
    });

    return fetch(TOKEN_EXCHANGE_URL, {
        method: "POST",
        headers,
        mode: "cors",
        body,
    }).then((response) => {
        if (response.status === 200) {
            return response.json().then(({ access_token }) => access_token);
        }

        return handleRequestNotOk(response, "Request for token exchange");
    });
}

async function verifyAuthorization(message) {
    if (!!message.error) {
        // TODO: handle potential errors (https://developer.todoist.com/guides/#step-1-authorization-request)
        console.error(
            `Authorization request failed with Error: ${message.error}`
        );
    }

    if (!!message.code && !!message.state) {
        const { authState } = await getAuthState();

        if (authWindow.id) {
            browser.windows.remove(authWindow.id);
        }

        if (message.state == authState) {
            return Promise.resolve(message.code);
        }
    }

    return Promise.reject(new Error("Authorization could not be verified."));
}

async function requestAuthorization() {
    const state = await newAuthState();
    const url = AUTH_URL + `&state=${state}`;

    var code = new Promise((resolve, reject) => {
        browser.runtime.onMessage.addListener((msg) =>
            verifyAuthorization(msg).then(resolve).catch(reject)
        );
    });

    authWindow = await browser.windows.create({
        url,
        type: "popup",
    });

    return code;
}

function getAuthState() {
    return messenger.storage.local.get("authState");
}

function newAuthState() {
    const state = uuidv4();

    return messenger.storage.local.set({ authState: state }).then((_) => state);
}

function getNewAccessToken() {
    return requestAuthorization()
        .then(exchangeAccessToken)
        .then(saveAccessToken)
        .then();
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
                .catch((err) => {
                    return Promise.reject(
                        `Failed to get a new access token:\n${err}`.replaceAll(
                            "\n",
                            "\n  "
                        )
                    );
                });
        });
}
