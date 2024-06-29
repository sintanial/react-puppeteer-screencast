import puppeteer from "puppeteer";
import {WebSocketServer} from "ws";
import {ScreencastServer} from "./src";
import http from "http";

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });

    const wsServer = new WebSocketServer({port: 8090});
    const screenServer = new ScreencastServer(wsServer);

    const httpServer = http.createServer(async (req, res) => {
        const u = new URL(req.url!, "http://localhost");
        const website = u.searchParams.get("website");
        if (!website) return;

        const page = await browser.newPage();
        await screenServer.startTransmit(page);
        res.end();

        await page.goto(website);
        try {
            await page.waitForNavigation({
                timeout: 5000,
            })
        } catch (e) {
        }
    });

    httpServer.on('upgrade', function (request, socket, head) {
        socket.on('error', (e) => console.error(e));
        wsServer.handleUpgrade(request, socket, head, (ws) => wsServer.emit('connection', ws, request));
    });

    screenServer.listen();
    httpServer.listen(8080, '127.0.0.1');
})();
