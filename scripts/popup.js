var ui = {},
    currentMessage;

for (let element of document.querySelectorAll("[id]")) {
    ui[element.id] = element;
}

browser.messageDisplay.onMessageDisplayed.addListener(closePopup)
ui.cancelBtn.addEventListener("click", closePopup)
ui.addTask.addEventListener("submit", onSubmission);

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
    currentMessage = message;

    updateTitle(message.subject);
    updateProjects();

    alert("Test");
}

function onSubmission(event) {
    let subject = ui.title.value;
    let projectId = parseInt(ui.projects.value, 10);
    let messageUrl = getMessageUrl();

    if (
        !!subject &&
        !!currentMessage &&
        currentMessage.subject === subject
    ) {
        let content = `${subject}\n\n`;

        if (messageUrl) {
            content += `*[Open in Thunderbird](${""})*\n\n`;
        }

        addNewTask(content, projectId).then();

        console.log(event)
    }

    event.preventDefault();
}

function getMessageUrl() {
    // FIXME: gFolderDisplay not found (not main window); permission missing?
    let hdr = window.gFolderDisplay?.selectedMessage;
    return hdr?.folder?.getUriForMsg(hdr) || false;
}

function updateTitle(title) {
    if (!!title && title.length > 0) {
        ui.title.value = title;
    }
}

function updateProjects() {
    fetchProjects().then((projects) => {
        if (typeof projects == "object") {
            Array.prototype.forEach.call(
                [...projects].sort((fst, snd) => fst.order - snd.order || -1),
                (project) => {
                    if (!!project.id && !!project.name) {
                        var opt = document.createElement("option");
                        opt.value = project.id;
                        opt.innerHTML = project.name;
                        ui.projects.appendChild(opt);
                    }
                }
            );
        }
    });
}

function closePopup() {
    window.close()
}