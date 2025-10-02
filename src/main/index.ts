import { app, BrowserWindow, protocol } from "electron"
import * as path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | null = null

protocol.registerSchemesAsPrivileged([
	{
		scheme: 'cmd',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true	
		}
	}
])

const createWindow = () => {

	protocol.handle("cmd", async req => {
		if (req.method == 'POST') {
			switch (req.url) {
				case "cmd://show_dev_tools/":
			    	mainWindow?.webContents.openDevTools()
					return new Response()
				default:
					const text = await req.text()
					console.log("POST", text)

					return new Response(JSON.stringify({ ok: true, received: text }),
						{
							headers: { 'Content-Type': 'application/json' }
						})
			}
		} else
			return new Response('<h1>Hello from GET</h1>', {
				headers: {
					'Content-Type': 'text/html' 
					
				}
  		});
	})

	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		//icon: path.join(__dirname, '../renderer/kirk.png')
		icon: "/home/uwe/Projekte/WindowsCommander/Commander/Resources/kirk.png"
		// webPreferences: {
		// 	preload: path.join(__dirname, "preload.js"),
		// },
	})
	mainWindow.removeMenu()

	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
		 mainWindow.webContents.openDevTools()
	}
  	else 
    	mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"))
  	
}

app.on("ready", createWindow)
app.on("window-all-closed", () => {
	if (process.platform !== "darwin")
		app.quit()
})
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0)
		createWindow()
})

//TODO

// display images
// display mp4 media in mediaplayer
// display pdf
// Range?
// if-modified-since
/*

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
return net.fetch(pathToFileURL(path.join(__dirname, filePath)).toString());
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