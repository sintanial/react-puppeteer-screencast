import {RawData, WebSocket, WebSocketServer} from "ws";
import {CDPSession, Page} from "puppeteer";
import {ScreencastSession} from "./ScreencastSession.ts";
import {FrameMessage} from "./FrameMessage.ts";
import {EventMessage, StateStartMessage, StateStopMessage} from "./EventMessage.ts";

export class ScreencastServer {
    private wss: WebSocketServer;

    private sessions: ScreencastSession[] = [];

    constructor(wss: WebSocketServer) {
        this.wss = wss;

        const onMessage = async (data: RawData) => {
            const message = JSON.parse(data.toString()) as EventMessage;
            const sess = this.sessions.find(sess => sess.sessId == message.sessId);
            if (!sess) return;

            await sess.handleEventMessage(message);
        }

        this.wss.on('connection', (ws: WebSocket) => {
            ws.on('message', (data) => onMessage(data));
        });
    }

    public async startTransmit(page: Page, cdp?: CDPSession) {
        const session = new ScreencastSession(page, cdp);
        this.sessions.push(session);

        this.wss.clients.forEach(ws => ws.send(JSON.stringify({
            type: "screencast.state.start",
            sessId: session.sessId,
        } as StateStartMessage)));
        await session.start((frame: FrameMessage) => {
            console.log("FRAME:", frame);
            this.wss.clients.forEach(client => client.send(JSON.stringify(frame)));
        }, {
            format: 'jpeg',
            quality: 100,
        });
    }

    public async stopTransmit(page: Page) {
        const session = this.sessions.find((sess) => sess.page === page);
        if (!session) return;

        await session.stop();
        this.wss.clients.forEach(ws => ws.send(JSON.stringify({
            type: "screencast.state.stop",
            sessId: session.sessId,
        } as StateStopMessage)));
        this.sessions = this.sessions.filter(sess => sess.page !== page);
    }
}
