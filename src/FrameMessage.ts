import {Protocol} from "devtools-protocol";

export type Frame = {
    data: string,
    format: string,
    metadata: Protocol.Page.ScreencastFrameMetadata
}

export type FrameMessage = {
    type: "screencast.frame",
    sessId: string,
    data: Frame
}
