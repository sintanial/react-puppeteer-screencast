import React, {HTMLProps, useEffect, useRef} from "react";
import {Frame, FrameMessage} from "./FrameMessage.ts";
import {EventMessage, KeyboardEventMessage, MouseEventMessage} from "./EventMessage.ts";
import {throttle} from "./throttle.ts";

export function makeBase64ImageURIFromFrame(frame: Frame) {
    return `data:image/${frame.format};base64,${frame.data}`;
}

export function ScreencastDisplay(props: {
    frame: FrameMessage,
    onEventMessage?: (e: EventMessage) => void,
} & HTMLProps<HTMLCanvasElement>) {
    const {
        frame: frameMessage,
        onEventMessage,
        onMouseMove,
        onMouseDown,
        onMouseUp,
        onKeyDown,
        onKeyUp,
        onMouseEnter,
        onMouseLeave,
        ...viewProps

    } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isMouseInsiderRef = useRef(false);

    const lastFrameImage = useRef<HTMLImageElement>();
    const requestRef = useRef<number>()
    const renderFrame = () => {
        // The 'state' will always be the initial value here
        requestRef.current = requestAnimationFrame(renderFrame);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas?.getContext('2d');
        if (!context) return;

        if (!lastFrameImage.current) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(lastFrameImage.current, 0, 0, canvas.width, canvas.height);
    }

    useEffect(() => {
        requestRef.current = requestAnimationFrame(renderFrame);
        return () => cancelAnimationFrame(requestRef.current!);
    }, []);


    useEffect(() => {
        if (!frameMessage || frameMessage.type !== "screencast.frame") return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas?.getContext('2d');
        if (!context) return;

        const frame = frameMessage.data;
        canvas.width = frame.metadata.deviceWidth;
        canvas.height = frame.metadata.deviceHeight;

        const image = new Image();
        image.onload = () => {
            lastFrameImage.current = image;
        }
        image.src = makeBase64ImageURIFromFrame(frame);
    }, [frameMessage]);


    const handleMouseEvent = (event: React.MouseEvent) => {
        if (!onEventMessage) return;
        if (!canvasRef.current) return;
        if (!isMouseInsiderRef.current) return;

        event.preventDefault();
        event.stopPropagation();
        const rect = canvasRef.current.getBoundingClientRect();

        const canvasWidth = canvasRef.current.clientWidth;
        const canvasHeight = canvasRef.current.clientHeight;

        // Calculate scaling factors
        const frame = frameMessage.data;
        const scaleX = frame.metadata.deviceWidth / canvasWidth;
        const scaleY = frame.metadata.deviceHeight / canvasHeight;


        const mouseEvent: MouseEventMessage = {
            type: "screencast.event.mouse",
            sessId: frameMessage.sessId,
            data: {
                type: event.type,
                x: (event.clientX - rect.x) * scaleX,
                y: (event.clientY - rect.y) * scaleY,
                button: event.button,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
            }
        };

        onEventMessage(mouseEvent);
    };

    const handleKeyboardEvent = (event: KeyboardEvent) => {
        if (!onEventMessage) return;
        if (!canvasRef.current) return;
        if (!isMouseInsiderRef.current) return;

        event.preventDefault();
        event.stopPropagation();
        const keyboardEvent = {
            type: "screencast.event.keyboard",
            sessId: frameMessage.sessId,
            data: {
                type: event.type,
                key: event.key,
                code: event.code,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
            }
        } as KeyboardEventMessage;

        onEventMessage(keyboardEvent);
    };

    useEffect(() => {
        const keyListener = (e: KeyboardEvent) => handleKeyboardEvent(e);
        document.addEventListener('keyup', keyListener);
        document.addEventListener('keydown', keyListener);
        return () => {
            document.removeEventListener('keyup', keyListener);
            document.removeEventListener('keydown', keyListener);
        }
    }, []);

    const throttledMouseMove = throttle((e) => handleMouseEvent(e), 100);

    return (
        <canvas
            ref={canvasRef}
            onMouseMove={(e) => throttledMouseMove(e)}
            onMouseDown={handleMouseEvent}
            onMouseUp={handleMouseEvent}
            onKeyDown={(e) => handleKeyboardEvent(e.nativeEvent)}
            onKeyUp={(e) => handleKeyboardEvent(e.nativeEvent)}
            onMouseEnter={() => isMouseInsiderRef.current = true}
            onMouseLeave={() => isMouseInsiderRef.current = false}
            {...viewProps}
        />
    );
}
