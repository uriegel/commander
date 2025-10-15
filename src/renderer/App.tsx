import React, { useEffect, useRef } from "react"
import Commander, { CommanderHandle } from "./components/Commander"
import WithDialog from 'web-dialog-react'
import './themes/linux.css'
import './App.css'
import "./extensions/extensions"
import { testPlatform } from '@platform/test'

const App = () => {

	const commander = useRef(null as CommanderHandle | null)

	useEffect(() => testPlatform(), [])
	
	const onKeyDown = (evt: React.KeyboardEvent) =>
		commander.current?.onKeyDown(evt)

	return (
		<div className="App linuxTheme" onKeyDown={onKeyDown}>
			<WithDialog>
				<Commander ref={commander} ></Commander>
			</WithDialog>
		</div>
	)
}

export default App