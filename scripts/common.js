import { getAccessToken } from "./authorize.js";

const REST_API_URL = "https://api.todoist.com/rest/v1/";

export function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
    );
}

export function handleRequestNotOk(response, message = "Request") {
    const textResponse = response
        .clone()
        .text()
        .then(
            (text) =>
                `${message} to ${response.url} failed: ${response.status} and ${text}`
        )
        // .catch(Promise.reject);

    const jsonResponse = response
        .clone()
        .json()
        .then(
            (json) =>
                `${message} to ${response.url} failed: ${
                    response.status
                } and '${JSON.stringify(json)}'`
        )
        // .catch(Promise.reject);

    return Promise.race([textResponse, jsonResponse])
        .catch(
            (_err) =>
                `${message} to ${response.url} failed: ${response.status} (${response.statusText})`
        )
        .then((msg) => {
            console.error(msg);

            return msg;
        })
        .then(Promise.reject);
}

function apiRequest(path, method = "GET", data = false) {
    return getAccessToken().then((accessToken) => {
        const url = REST_API_URL + path.trim().replace(/\/(.+)/, "$1");

        const headers = {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
        };

        if (method !== "GET") {
            headers["Content-Type"] = "application/json";
            headers["X-Request-Id"] = uuidv4();
        }

        const requestInfo = {
            method: method === "GET" ? "GET" : "POST",
            headers,
        };

        if (method !== "GET" && !!data) {
            requestInfo.body = JSON.stringify(data);
        }

        return fetch(url, requestInfo).then((response) => {
            if (response.ok) {
                return response.json();
            }

            return handleRequestNotOk(response);
        });
    });
}

export function fetchProjects() {
    return apiRequest("projects", "GET")
        .then((projects) => projects)
        .catch((err) =>
            console.error(
                `Failed to fetch projects from todoist:\n${err}`.replaceAll(
                    "\n",
                    "\n  "
                )
            )
        );
}

export function addNewTask(
    content,
    projectId = NaN,
    labelIds = [],
    priority = NaN,
    due = false
) {
    let data = {
        content,
    };

    if (!!projectId && typeof projectId == "number") {
        data = {
            ...data,
            project_id: projectId,
        };
    }

    if (!!labelIds && labelIds.length > 0) {
        data = {
            ...data,
            label_ids: labelIds,
        };
    }

    if (!!priority && priority > 0 && priority < 5) {
        data = {
            ...data,
            priority,
        };
    }

    if (!!due) {
        // TODO: date support
    }

    return apiRequest("tasks", "POST", data);
}
