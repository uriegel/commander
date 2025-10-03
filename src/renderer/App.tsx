import React, { useRef } from "react"
import Commander, { CommanderHandle } from "./components/Commander"
import './themes/linux.css'
import './App.css'
import "../extensions"

const App = () => {

	const commander = useRef(null as CommanderHandle | null)
	
	const onKeyDown = (evt: React.KeyboardEvent) =>
		commander.current?.onKeyDown(evt)

	return (
		<div className="App linuxTheme" onKeyDown={onKeyDown}>
			<Commander ref={commander} ></Commander>
		</div>
	)
}

export default App