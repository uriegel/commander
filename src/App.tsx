import './App.css'
import FolderView from './components/FolderView'

export type Nothing = {}

type Result = 
	| Nothing 
	| Exception

type Close = "close"
type GetFiles = "getfiles"

type RequestType = 
	| Close
	| GetFiles
	
type Exception = {
	exception: string
}	

type GetFilesType = {
    path:           string,
    showHiddenItems: boolean
}

type Empty = {
    empty?: string
}

export type RequestInput = 
    | Empty  
	| GetFilesType 
	
export async function request<T extends Result>(method: RequestType, input?: RequestInput) {

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

	// const onClick = async () => {
	// 	//await request<Close>("close")
	// 	await request<GetFiles>("getfiles", {
	// 		path: "/",
	// 		showHiddenItems: true
	// 	})
	// }

	return (
		<div className="App">
			<FolderView/>
		</div>
	)
}

export default App
