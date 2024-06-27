import React, {useState} from 'react'
import ReactDOM from 'react-dom/client'
import {ScreencastClient} from "./src";

export function App() {
    const [website, setWebsite] = useState<string | undefined>("https://google.com/");

    const handleSubmit = async () => {
        await fetch(`http://localhost:8080/screencast/start?website=${website}`);
    }
    return <div>
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

            <button type={"submit"}>Load</button>
        </form>

        <ScreencastClient url={"ws://localhost:8090"}/>
    </div>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>,
)
