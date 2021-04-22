const electron = require('electron');
const url = require('url');
const path = require('path');

const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = electron;

let mainWindow, addWindow;

// Listen for app to be ready
app.on('ready', function() {
    //create new window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {nodeIntegration: true}
    });
    //load html file into the window
    // mainWindow.loadURL("http://demo.qunee.com/#Work%20Flow%20Demo")
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/view/workflow/index.html'),
        protocol: 'file:',
        slashes: true
    }));  //pass file://dirname/mainWindow.html to loadURL

    console.log(process.cwd())
    //quit app when closed
    mainWindow.on('close', function() {
        console.log('bye');
        app.exit(0);
    });

    // Build menu from template
    //const mainMenu = Menu.buildFromTemplate(mainMenuTplt);
    //Insert the menu
    //mainWindow.setMenu(mainMenu);
});

// //handle create read file window
// function createReadWindow() {
//     readWindow = new BrowserWindow({
//         width: 500,
//         height: 300,
//         title: 'Read a new file',
//         webPreferences: {nodeIntegration: true}
//     });

//     readWindow.loadURL(url.format({
//         pathname: path.join(__dirname, 'readWindow.html'),
//         protocol: 'file:',
//         slashes: true
//     }));

//     readWindow.on('closed', function() {
//         readWindow = null;
//     })
// }

// //catch item: add
// ipcMain.on('item:add', function(e, item) {
//     console.log(item)
//     mainWindow.webContents.send('item:add', item);
//     addWindow.close();
// })

// //create menu template
// const mainMenuTplt = [
//     {
//         label: 'File',
//         submenu:[
//             {
//                 label: 'Add Item',
//                 click() {
//                     createAddWindow();
//                 }
//             },
//             {
//                 label: 'Read Item',
//                 click() {
//                     createReadWindow();
//                 }
//             },
//             {
//                 label: 'Clear Items',
//                 click() {
//                     mainWindow.webContents.send('item:clear')
//                 }
//             },
//             {
//                 label: 'Quit',
//                 accelerator: process.platform == 'darwin' ? 'Command+q' : 'Ctrl+q',
//                 click() {
//                     app.quit();
//                 }
//             }
//         ]
//     }
// ];
// //handle mac
// if(process.platform == 'darwin') {
//     mainMenuTplt.unshift({});
// }

// //add developer tools item if not in production
// if(process.env.NODE_ENV !== 'production') {
//     mainMenuTplt.push({
//         label: 'Dev Tools',
//         submenu:[
//             {
//                 label: 'Toggle DevTools',
//                 click(item, focusedWindow){
//                     focusedWindow.toggleDevTools();
//                 },
//                 accelerator: process.platform == 'darwin' ? 'Command+i' : 'Ctrl+i',
//             },
//             {
//                 role: 'reload'
//             }
//         ]
//     })
// }
