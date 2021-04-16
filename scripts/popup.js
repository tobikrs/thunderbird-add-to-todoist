import { fetchProjects, addNewTask } from "./common.js";

var ui = {};

for (let element of document.querySelectorAll("[id]")) {
    ui[element.id] = element;
}

browser.messageDisplay.onMessageDisplayed.addListener(closePopup);
ui.cancelBtn.addEventListener("click", closePopup);
ui.addTask.addEventListener("submit", onSubmission);
ui.taskContent.addEventListener("input", onTitleChanged);
ui.project.addEventListener("input", onSelectionChanged);

// get current displayed message
browser.tabs
    .query({
        active: true,
        currentWindow: true,
    })
    .then((tabs) => {
        let tabId = tabs[0].id;
        browser.messageDisplay.getDisplayedMessage(tabId).then(openPopup);
    });

function openPopup(message) {
    updateTitle(message.subject);
    updateProjects();
}

function onSubmission(event) {
    ui.taskContent.disabled = ui.project.disabled = true;

    const subject = ui.taskContent.value;
    const projectId = parseInt(ui.project.value, 10);
    const messageUrl = getMessageUrl();

    if (!!subject) {
        let content = `${subject}`;

        if (messageUrl) {
            content += `*[Open in Thunderbird](${""})*\n\n`;
        }

        addNewTask(content, projectId)
            .then(onNewTask)
            .catch(_status => false)
            .finally(() => (ui.taskContent.disabled = ui.project.disabled = false));
    }

    event.preventDefault();
}

function onNewTask(task) {
    // TODO: show success message

    // console.log(`Task created: ${JSON.stringify(task)}`);

    setTimeout(closePopup, 500);
}

function getMessageUrl() {
    // FIXME: gFolderDisplay not found (not main window); permission missing?
    let hdr = window.gFolderDisplay?.selectedMessage;
    return hdr?.folder?.getUriForMsg(hdr) || false;
}

function updateTitle(title) {
    if (!!title && title.length > 0) {
        ui.taskContent.value = title;
    }
}

function updateProjects() {
    ui.submitBtn.disabled = true;

    fetchProjects()
        .then((projects) => {
            if (typeof projects == "object") {
                Array.prototype.forEach.call(
                    [...projects].sort(
                        (fst, snd) => fst.order - snd.order || -1
                    ),
                    (project) => {
                        if (!!project.id && !!project.name) {
                            var opt = document.createElement("option");
                            opt.value = project.id;
                            opt.innerHTML = project.name;
                            ui.project.appendChild(opt);
                        }
                    }
                );
            }
        })
        .then(onSelectionChanged);
}

function onSelectionChanged() {
    ui.submitBtn.disabled = false;

    if (!!ui.project.value) {
        ui.project.classList.add("has-value");
    } else {
        ui.project.classList.remove("has-value");
    }
}

function onTitleChanged() {
    ui.submitBtn.disabled = !ui.taskContent.value;
}

function closePopup() {
    window.close();
}
