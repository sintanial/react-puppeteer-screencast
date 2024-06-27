# react-puppeteer-screencast

`react-puppeteer-screencast` is an npm package that allows you to stream the current state of a Puppeteer-controlled webpage directly into a browser using a canvas. The library also supports user input events for mouse and keyboard interactions.

## Features

- **Stream Puppeteer page to browser**: View the current state of a Puppeteer page in real-time.
- **User input events**: Interact with the streamed page using mouse and keyboard events.
- **Simple integration**: Easy to set up and integrate with your React application.

## Installation

```bash
npm install react-puppeteer-screencast
```

## Example of usage

### Client-side code

Create a React component to handle the screencast:

```jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ScreencastClient } from "react-puppeteer-screencast";

export function App() {
    const [website, setWebsite] = useState<string | undefined>("https://google.com/");

    const handleSubmit = async () => {
        await fetch(`http://localhost:8080/screencast/start?website=${website}`);
    }

    return (
        <div>
            <form onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await handleSubmit();
            }}>
                <input
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.currentTarget.value)}
                />
                <button type="submit">Load</button>
            </form>
            <ScreencastClient url={"ws://localhost:8090"} />
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
```

### Server-side code

Set up a server to handle Puppeteer and WebSocket connections:

```ts
import puppeteer from "puppeteer";
import { WebSocketServer } from "ws";
import { ScreencastServer } from "react-puppeteer-screencast";
import http from "http";

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });

    const wsServer = new WebSocketServer({ port: 8090 });
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
            });
        } catch (e) {
            console.error(e);
        }
    });

    httpServer.on('upgrade', function (request, socket, head) {
        socket.on('error', (e) => console.error(e));
        wsServer.handleUpgrade(request, socket, head, (ws) => wsServer.emit('connection', ws, request));
    });

    httpServer.listen(8080, '127.0.0.1');
})();
```

## Development

Clone the repository:

```bash
git clone https://github.com/yourusername/react-puppeteer-screencast.git
cd react-puppeteer-screencast
npm install
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs or enhancements.

## License

MIT License. See the [LICENSE](LICENSE) file for details.
