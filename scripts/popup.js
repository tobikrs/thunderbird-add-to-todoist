import { fetchProjects, addNewTask } from "./common.js";

var ui = {};

for (let element of document.querySelectorAll("[id]")) {
    ui[element.id] = element;
}

browser.messageDisplay.onMessageDisplayed.addListener(closePopup);
ui.cancelBtn.addEventListener("click", closePopup);
ui.closeBtn.addEventListener("click", closePopup);
ui.addTask.addEventListener("submit", onSubmission);
ui.taskContent.addEventListener("input", onTitleChanged);
ui.project.addEventListener("input", onSelectionChanged);

init();

function init() {
    ui.response.style.disabled = "none";
    ui.content.style.display = "block";

    browser.tabs
        .query({
            active: true,
            currentWindow: true,
        })
        .then((tabs) => {
            let tabId = tabs[0].id;
            browser.messageDisplay.getDisplayedMessage(tabId).then(openPopup);
        });
}

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
            .catch(onError)
            .finally(
                () => (ui.taskContent.disabled = ui.project.disabled = false)
            );
    }

    event.preventDefault();
}

function onNewTask(task) {
    // console.log(`Task created: ${JSON.stringify(task)}`);
    // TODO: Option to open task
    
    ui.responseActionBtn.addEventListener("click", () => {
        animateOut(ui.response).then(closePopup);
    });

    showResponseMessage("Task created").then(() =>
        animateIn(ui.responseActionBtn)
    );
}

function onError(_status) {
    ui.responseActionBtn.innerHTML = "Try again";

    ui.responseActionBtn.addEventListener("click", () => {
        animateOut(ui.response).then(init);
    });

    showResponseMessage(null, true).then(() => animateIn(ui.responseActionBtn));
}

function showResponseMessage(message, isError = false) {
    const icon = ui.response.getElementsByClassName("icon")[0];
    const text = ui.response.getElementsByClassName("text")[0];

    icon.src = `assets/${!isError ? "success" : "error"}.png`;
    text.innerHTML = message || (isError ? "Oops! Something went wrong." : "");

    ui.content.style.display = "none";

    return animateIn(ui.response, true).then(() => animateIn(text));
}

function animateIn(el, withRotation = false, duration = 300, display) {
    el.style.opacity = 0;
    el.style.display = display || "block";

    return el
        .animate(
            [
                {
                    transform: "rotateY(0)",
                    opacity: 0,
                },
                {
                    transform: `rotateY(${withRotation ? "360deg" : "0"})`,
                    opacity: 1,
                },
            ],
            {
                duration,
            }
        )
        .finished.then(() => (el.style.opacity = 1));
}

function animateOut(el) {
    return el
        .animate(
            [
                {
                    transform: "scaleY(1)",
                    height: `${el.offsetHeight}px`,
                },
                {
                    transform: "scaleY(0)",
                    height: "0px",
                },
            ],
            {
                duration: 150,
            }
        )
        .finished.then(() => (el.style.display = "none"));
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
