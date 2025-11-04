import 'functional-extensions'
import { app, BrowserWindow, protocol, nativeTheme } from "electron"
import * as path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import * as settings from 'electron-settings'
import { onCmd } from "./cmds.js"
import { onRequest } from "./requests.js"
import { registerGetIconProtocol } from "./icons.js"
import { registerGetBinProtocol } from "./bin.js"
import { registerGetMediaProtocol } from "./media.js"
import { Event } from './events.js'
import { registerGetTrackProtocol } from './track.js'
import { canClose } from './close-control.js'
import { registerGetWindowIconProtocol } from './windowicon.js'

process.env.UV_THREADPOOL_SIZE = "32"

export const rootDir = dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

export function sendEvent(data: Event) {
	mainWindow?.webContents.send('fromMain', data)	
}

protocol.registerSchemesAsPrivileged([
	{
		scheme: 'cmd',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true	
		}
	}, 	{
		scheme: 'json',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true	
		}
	}, 	{
		scheme: 'icon',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	},	{
		scheme: 'bin',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true	
		}
	}, {
		scheme: 'media',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	}, {
		scheme: 'track',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	}, {
		scheme: 'windowicon',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	}
])

const createWindow = () => {
	protocol.handle("cmd", async req => {
		if (req.method == 'POST') 
			onCmd(req, mainWindow)
		else 
            console.error(`Cmd only with HTTP method POST allowed`)
		return new Response()
	})
	protocol.handle("json", async req => await onRequest(req))
	registerGetIconProtocol()
	registerGetBinProtocol()
	registerGetMediaProtocol()
	registerGetTrackProtocol()
	if (process.platform == "win32")
		registerGetWindowIconProtocol()

	let bounds = {
		x: settings.getSync("x") as number,
		y: settings.getSync("y") as number,
		width: settings.getSync("width") as number || 600,
		height: settings.getSync("height") as number || 800,
		backgroundColor: nativeTheme.shouldUseDarkColors ? "#121212" : undefined,
		icon: path.join(rootDir, "../../icons/64x64.png"),
		webPreferences: {
			preload: path.join(rootDir, "../bridge/preload.js")
		}
	} as Electron.BrowserViewConstructorOptions

	if (process.platform == "win32")
		bounds = { ...bounds, 
			titleBarStyle: "hidden",
			titleBarOverlay: {
    			color: nativeTheme.shouldUseDarkColors ? "#262626" : "#ebebeb",
    			symbolColor: nativeTheme.shouldUseDarkColors ? 'white' : 'black',
    			height: 30
  			}
		} as Electron.BrowserViewConstructorOptions

	mainWindow = new BrowserWindow(bounds)
    if (settings.getSync("isMaximized"))
		mainWindow.maximize()
	
	mainWindow.on('maximize', () => {
		const bounds = mainWindow?.getBounds()
		if (bounds) {
			settings.set("width", bounds.width)
			settings.set("height", bounds.height)
			settings.set("isMaximized", true)
		}
    })

    mainWindow.on('unmaximize', () => settings.set("isMaximized", false))    
	mainWindow.on("close", evt => {
		if (!canClose()) {
			if (process.platform == "linux")
				sendEvent({ cmd: 'CopyProgressShowDialog', msg: {} })
			evt.preventDefault()
		}
        if (!mainWindow?.isMaximized()) {
			const bounds = mainWindow?.getBounds()
			if (bounds) {
				settings.setSync("x", bounds.x)
				settings.setSync("y", bounds.y)
				settings.setSync("width", bounds.width)
				settings.setSync("height", bounds.height)
			}
        }
	})   
	mainWindow.removeMenu()

	if (process.env.VITE_DEV_SERVER_URL) 
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
	else 
		mainWindow.loadFile(path.join(rootDir, "../renderer/index.html"))
	// TODO initial dev tools
	// mainWindow.webContents.openDevTools()
}

export const closeWindow = () => mainWindow?.close()

app.setName("commander")
app.on("ready", createWindow)
app.on("window-all-closed", () => {
	if (process.platform !== "darwin")
		app.quit()
})
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0)
		createWindow()
})

/*TODO

Electron's protocol module allows you to register and handle custom protocols or intercept existing ones. This is useful for creating secure, custom URL schemes or handling specific resource requests in your application.

Using protocol.handle for Custom Protocols

The protocol.handle method is the modern way to register custom protocols in Electron (replacing deprecated methods like registerFileProtocol). Here's how to use it:

Steps:

Register a Custom Protocol: Use protocol.handle to define a handler for your custom scheme.

const { app, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

app.whenReady().then(() => {
protocol.handle('myapp', (request) => {
const filePath = request.url.slice('myapp://'.length);
return net.fetch(pathToFileURL(path.join(rootDir, filePath)).toString());
});
});
Kopieren
Enable Privileges (Optional): If your protocol requires advanced features like CORS or fetch API support, register it as privileged:

protocol.registerSchemesAsPrivileged([
{
scheme: 'myapp',
privileges: {
standard: true,
secure: true,
supportFetchAPI: true,
corsEnabled: true,
},
},
]);
Kopieren
Test the Protocol: Access resources using your custom protocol, e.g., myapp://path/to/resource.

Handling File Requests with protocol.handle

For serving local files securely:

protocol.handle('local', (request) => {
const filePath = request.url.slice('local://'.length);
return net.fetch(`file://${filePath}`);
});
Kopieren
Best Practices and Tips

Security: Always validate paths to prevent directory traversal attacks.

Deprecation: Avoid using deprecated methods like registerFileProtocol. Use protocol.handle for future-proofing.

Session-Specific Protocols: If using custom sessions, explicitly register the protocol for that session.

By leveraging protocol.handle, you can create robust and secure custom protocols tailored to your application's needs.

*/