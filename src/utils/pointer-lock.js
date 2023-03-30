document.exitPointerLock = document.exitPointerLock ?? document.mozExitPointerLock ?? (() => {
});

export function setRequestPointerLock(DOMElement) {
    DOMElement.requestPointerLock = DOMElement.requestPointerLock ?? DOMElement.mozRequestPointerLock ?? (() => {
    });
}

export function exitPointerLock() {
    document.exitPointerLock();
}