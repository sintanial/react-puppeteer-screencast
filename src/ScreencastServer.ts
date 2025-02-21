import {RawData, WebSocket, WebSocketServer} from "ws";
import {Page} from "puppeteer";
import {ScreencastSession} from "./ScreencastSession.ts";
import {FrameMessage} from "./FrameMessage.ts";
import {EventMessage, StateStartMessage, StateStopMessage} from "./EventMessage.ts";

export interface ScreencastTransmitter {
    startTransmit(page: Page, sessId?: string): Promise<void>;

    stopTransmit(page: Page, sessId?: string): Promise<void>;
}

export class ScreencastServer implements ScreencastTransmitter {
    private wss: WebSocketServer;

    private sessions: ScreencastSession[] = [];

    constructor(wss: WebSocketServer) {
        this.wss = wss;
    }

    public listen() {
        const onMessage = async (data: RawData) => {
            try {
                const message = JSON.parse(data.toString()) as EventMessage;
                await this.handle(message);
            } catch (e) {
            }
        }

        this.wss.on('connection', (ws: WebSocket) => {
            ws.on('message', (data) => onMessage(data));
        });
    }

    public async handle(message: EventMessage) {
        if (message && message.type?.indexOf("screencast.") === 0) {
            const sess = this.sessions.find(sess => sess.sessId == message.sessId);
            if (!sess) return;

            try {
                await sess.handleEventMessage(message);
            } catch (e) {
                console.error(e);
            }
        }
    }

    public async startTransmit(page: Page, sessId?: string) {
        const session = new ScreencastSession(page, sessId);
        this.sessions.push(session);

        this.wss.clients.forEach(ws => ws.send(JSON.stringify({
            type: "screencast.state.start",
            sessId: session.sessId,
        } as StateStartMessage)));
        await session.start((frame: FrameMessage) => {
            this.wss.clients.forEach(client => client.send(JSON.stringify(frame)));
        }, {
            format: 'jpeg',
            quality: 100,
        });
    }

    public async stopTransmit(page: Page, _sessId?: string) {
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
