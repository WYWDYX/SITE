const websites = [
    "/Resource-Sharing/",
    "/Player/",
    "/Reading/",
    "/Repository-Public/"
];

const icons = {
    ok: "check_circle",
    fail: "error"
};

document.addEventListener("DOMContentLoaded", () => {
    const ul = document.getElementById("connectivity-list");
    websites.forEach(link => {
        fetch(link, {
                method: "HEAD"
            })
            .then(response => {
                const li = document.createElement("li");
                const icon = document.createElement("span");
                icon.className = "material-icons";
                icon.textContent = response.ok ? icons.ok : icons.fail;

                const div = document.createElement("div");
                div.textContent = `${link} ${response.ok ? '' : `(状态码: ${response.status})`}`;

                li.appendChild(icon);
                li.appendChild(div);
                ul.appendChild(li);
            })
            .catch(() => {
                const li = document.createElement("li");
                const icon = document.createElement("span");
                icon.className = "material-icons";
                icon.textContent = icons.fail;

                const div = document.createElement("div");
                div.textContent = `${link} (连接失败)`;

                li.appendChild(icon);
                li.appendChild(div);
                ul.appendChild(li);
            });
    });
});