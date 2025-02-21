export type ScreencastMouseEvent = {
    type: string,
    x: number,
    y: number,
    button: number,
    altKey: boolean,
    ctrlKey: boolean,
    shiftKey: boolean,
    metaKey: boolean,
}

export type ScreencastKeyboardEvent = {
    type: string,
    key: string,
    code: string,
    altKey: boolean,
    ctrlKey: boolean,
    shiftKey: boolean,
    metaKey: boolean,
}

export type StateStartMessage = {
    type: "screencast.state.start",
    sessId: string,
}

export type StateStopMessage = {
    type: "screencast.state.stop",
    sessId: string,
}

export type MouseEventMessage = {
    type: "screencast.event.mouse",
    sessId: string,
    data: ScreencastMouseEvent
}

export type KeyboardEventMessage = {
    type: "screencast.event.keyboard",
    sessId: string,
    data: ScreencastKeyboardEvent
}

type ScreencastWheelEvent = {
    deltaX: number,
    deltaY: number,
}

export type WheelEventMessage = {
    type: "screencast.event.wheel",
    sessId: string,
    data: ScreencastWheelEvent
}

export type EventMessage = MouseEventMessage | KeyboardEventMessage | WheelEventMessage;

export type StateMessage = StateStartMessage | StateStopMessage;
