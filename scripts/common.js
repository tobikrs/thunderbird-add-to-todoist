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

export const METHOD = Object.freeze({
    GET: "GET",
    POST: "POST",
});

function apiRequest(path, method = METHOD.GET, data = false) {
    return getAccessToken().then((accessToken) => {
        let url = REST_API_URL + path.trim().replace(/\/(.+)/, "$1");
        let headers = {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
        };

        if (method == METHOD.POST) {
            headers = {
                ...headers,
                "Content-Type": "application/json",
                "X-Request-Id": uuidv4(),
            };
        }

        let fetchInfo = {
            method: method == METHOD.POST ? METHOD.POST : METHOD.GET,
            headers,
        };

        if (!!data) {
            fetchInfo = {
                ...fetchInfo,
                body: JSON.stringify(data),
            };
        }

        console.debug("FetchInfo: " + JSON.stringify(fetchInfo));

        return fetch(url, fetchInfo).then((response) => {
            if (response.ok) {
                return response.json();
            }

            response.text().then((test) => console.debug("Text: " + text));
            response.json()
                .then((json) => console.debug("Json: " + JSON.stringify(json)));

            return Promise.reject(
                new Error(
                    `Request to the api failed with status ${response.status} for ${response.url}`
                )
            );
        });
    });
}

export function fetchProjects() {
    return apiRequest("projects", METHOD.GET)
        .then((projects) => projects)
        .catch((err) =>
            console.error(`Failed to fetch projects from todoist:\n  ${err}`)
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

    return apiRequest("tasks", METHOD.POST, data)
        .then((task) => {
            console.debug("New task created!");
            return task;
        })
        .catch((err) => {
            console.error(`Failed to add a task to todoist:\n  ${err}`);
            return false;
        });
}
