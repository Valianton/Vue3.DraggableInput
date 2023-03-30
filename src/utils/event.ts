function createEvent<T>(name: string, detail: T): CustomEvent {
    return new CustomEvent(name, {detail});
}

/**
 * {@see https://developer.mozilla.org/ru/docs/Web/API/EventTarget/addEventListener}
 * @param {EventTarget} eventTarget
 * @param {String} event
 * @param {Function} handler
 * @param {Object|Boolean=} options
 */
function listenDom(eventTarget: any, event: any, handler: any, options?: any) {
    eventTarget.addEventListener(event, handler, options);
    return () => eventTarget.removeEventListener(event, handler);
}

export {
    createEvent,
    listenDom,
}