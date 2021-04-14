const TOKEN = "<test-token>";
const REST_API_URL = "https://api.todoist.com/rest/v1/";

async function getOAuthTocken() {
    return TOKEN; // FIXME: later

    // TODO: load from storage...
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
    );
}

const METHOD = Object.freeze({
    GET: "GET",
    POST: "POST",
});

async function apiRequest(path, method = METHOD.GET, data = false) {
    let oauthToken = await getOAuthTocken();
    let url = REST_API_URL + path.trim().replace(/\/(.+)/, "$1");

    let headers = {
        "Authorization": `Bearer ${oauthToken}`,
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

    let response = await fetch(url, fetchInfo);

    if (response.ok) {
        return await response.json();
    } else {
        console.debug(await response.text());
        throw new Error(
            `Could not make request to todoist api: ${response.status} for ${response.url}`
        );
    }
}

async function fetchProjects() {
    return apiRequest("projects", METHOD.GET)
        .then((projects) => projects)
        .catch((err) => console.error(err));
}

async function addNewTask(
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
            console.error(err);
            return false;
        });
}
