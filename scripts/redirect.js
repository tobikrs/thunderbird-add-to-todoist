const urlParams = new URLSearchParams(window.location.search);

browser.runtime.sendMessage({
    url: window.location.href,
    code: urlParams.get("code"),
    state: urlParams.get("state"),
    error: urlParams.get("error")
});
