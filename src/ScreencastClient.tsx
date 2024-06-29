import useWebSocket from "react-use-websocket";
import {useEffect, useState} from "react";
import {ScreencastDisplay} from "./ScreencastDisplay.tsx";
import {FrameMessage} from "./FrameMessage.ts";

export function ScreencastClient(props: {
    url: string
}) {
    const {sendJsonMessage, lastJsonMessage} = useWebSocket(props.url);
    const [lastFrame, setLastFrame] = useState<FrameMessage | null>(null);

    useEffect(() => {
        if (!lastJsonMessage) return;
        // @ts-ignore
        if (lastJsonMessage.type != "screencast.frame") return;

        const message = lastJsonMessage as FrameMessage;
        setLastFrame(message);
    }, [lastJsonMessage]);

    if (!lastFrame) {
        return null;
    }

    return <ScreencastDisplay
        style={{width: "100%"}}
        frame={lastFrame}
        onEventMessage={(event) => sendJsonMessage(event)}
    />
}
