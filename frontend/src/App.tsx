import {useState} from 'react';
import logo from './assets/images/logo-universal.png';
import './App.css';
import {RunTest} from "../wailsjs/go/main/App";
import {smtp} from "../wailsjs/go/models";

function App() {
    const [resultText, setResultText] = useState("Please run a test below 👇");
    const [name, setName] = useState('');
    const updateName = (e: any) => setName(e.target.value);
    const updateResultText = (result: string) => setResultText(result);

    function runTest() {
        let config = new smtp.SMTPConfig();
        config.host = "smtp.example.com";
        RunTest(config).then((res) => {
            updateResultText(JSON.stringify(res));
        });
    }

    return (
        <div id="App">
            <img src={logo} id="logo" alt="logo"/>
            <div id="result" className="result">{resultText}</div>
            <div id="input" className="input-box">
                <button className="btn" onClick={runTest}>Run Test</button>
            </div>
        </div>
    )
}

export default App
