import {CDPSession, MouseButton, Page} from "puppeteer";
import {Protocol} from "devtools-protocol";
import {randomUUID} from "crypto";
import {_keyDefinitions, KeyInput} from "./USKeyboardLayout.ts";
import {FrameMessage} from "./FrameMessage.ts";
import {EventMessage} from "./EventMessage.ts";

export type FrameHandler = (message: FrameMessage) => void;

const buttonNumberMapping: { [key: number]: MouseButton } = {
    0: "left",
    1: "middle",
    2: "right",
    3: "back",
    4: "forward"
}

export class ScreencastSession {
    public readonly sessId: string;
    public readonly page: Page;
    private client?: CDPSession;
    private listener?: (event: Protocol.Page.ScreencastFrameEvent) => void;

    constructor(page: Page, client?: CDPSession) {
        this.sessId = randomUUID().toString();
        this.page = page;
        this.client = client;
    }

    public async handleEventMessage(message: EventMessage) {
        if (message.type == "screencast.event.mouse") {
            const e = message.data;
            const eventType = e.type.replace('mouse', '').toLowerCase();
            if (eventType == "move") {
                await this.page.mouse.move(e.x, e.y);
            } else if (eventType == "up") {
                await this.page.mouse.up({button: buttonNumberMapping[e.button]})
            } else if (eventType == "down") {
                await this.page.mouse.down({button: buttonNumberMapping[e.button]})
            }
        } else if (message.type == "screencast.event.keyboard") {
            const e = message.data;
            const eventType = e.type.replace('key', '').toLowerCase();
            console.log("EVENT:", e);
            if (eventType == "up") {
                // if (this.charIsKey(e.key)) {
                await this.page.keyboard.up(e.code as any);
                // } else {
                //     await this.page.keyboard.sendCharacter(e.key);
                // }
            } else if (eventType == "down") {
                if (this.charIsKey(e.key)) {
                    await this.page.keyboard.down(e.code as any);
                } else {
                    await this.page.keyboard.sendCharacter(e.key);
                }
            }
        }
    }

    private charIsKey(char: string): char is KeyInput {
        return !!_keyDefinitions[char as KeyInput];
    }

    public async start(cb: FrameHandler, opts: Protocol.Page.StartScreencastRequest = {
        format: "jpeg",
        quality: 100,
    }) {
        const client = await this.getClient();
        this.clearListeners(client);

        this.listener = ({data, metadata, sessionId}) => {
            client.send('Page.screencastFrameAck', {sessionId}).catch(() => {
            });

            cb({
                type: "screencast.frame",
                sessId: this.sessId,
                data: {
                    data,
                    format: opts.format ?? "jpeg",
                    metadata
                }
            });
        };
        client.on('Page.screencastFrame', this.listener);

        await client.send('Page.startScreencast', opts);
    }

    public async stop() {
        const client = await this.getClient();
        this.clearListeners(client);
        await client.send('Page.stopScreencast');
    }

    private clearListeners(client: CDPSession) {
        if (this.listener) {
            client.off('Page.screencastFrame', this.listener);
            this.listener = undefined;
        }
    }

    private async getClient() {
        if (!this.client) {
            this.client = await this.page.createCDPSession();
        }

        return this.client
    }
}
