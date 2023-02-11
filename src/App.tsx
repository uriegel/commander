import React from 'react'
import './App.css'

export type Nothing = {}

type Result = 
	| Nothing 
	| Exception

type CloseType =          "close"

type RequestType = 
	| CloseType
	
type Exception = {
	exception: string
}	

export async function request<T extends Result>(method: RequestType, input?: string) {

    const msg = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {})
    }

    const response = await fetch(`http://localhost:20000/commander/${method}`, msg) 
    const res = await response.json() as T
    if ((res as Exception).exception)
        throw ((res as Exception).exception)
    else {
        return res
    }
}


const App = () => {

	const onClick = async () => {
		await request<CloseType>("close")
	}

	return (
		<div className="App">
			<h1>Hello Commander</h1>
			<button onClick={onClick}>Close Electron</button>
		</div>
	)
}

export default App
// TODO test release build: 
