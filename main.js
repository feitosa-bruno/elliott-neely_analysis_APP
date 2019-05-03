// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu } = require('electron')

// Enable debugging on launch for application
let debugging = true

// Menu Template
const template = [
	{
		role: 'window',
		submenu: [
			{ role: 'minimize' },
			{ role: 'close' }
		]
	},
	{
		label: 'View',
		submenu: [
			{ role: 'reload' },
			{ role: 'toggledevtools', accelerator: 'F12' },
		]
	},
]

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
	// Create the browser window...
	mainWindow = new BrowserWindow({
		show: false,
		width: 800,
		height: 600,
		title: 'Elliot-Neely Analysis',
		// frame: false,
		// titleBarStyle: 'hidden',
		webPreferences: {
			nodeIntegration: true
		}
	})

	// Define the menu
	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)

	// and load the index.html of the app.
	mainWindow.loadFile('./src/index.html')

	// Wait for everything to load to show (no one caught with pants on hands)
	mainWindow.once('ready-to-show', () => {
		// maximize it...
		mainWindow.maximize()
		// and show
		mainWindow.show()
	})

	if (debugging)
		// Open the DevTools.
		mainWindow.webContents.openDevTools({ mode: 'bottom', tab: 'console' })

	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
		
		// Also, close whole app (in case auxiliary windows where open on main window closure)
		app.quit()
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)


// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.