const websites = [
    "https://wywdyx.github.io/Resource-Sharing/",
    "https://wywdyx.github.io/Player/",
    "Reading/",
    "https://wywdyx.github.io/Repository-Public/"
];

function randomJump() {
    const random = websites[Math.floor(Math.random() * websites.length)];
    window.location.href = random;
}