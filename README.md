# Commander
A Norton Commander clone based on Electron and React with Typescript

## Prerequisites

```
suda apt update
sudo apt install pkg-config
sudo apt install libgtk-3-dev
```

TODO
* copy: Linux progress dialog: durations
* copy: Linux cancel copy, prevent from close
* copy: Windows without progress

/*
In HTML, <table> cannot be a descendant of <p>.
This will cause a hydration error.
  <App>
    <div className="App linuxT..." onKeyDown={function onKeyDown}>
      <WithDialog>
        <Menu>
        <ViewSplit>
        <Statusbar>
        <div className="wdr--dialo...">
          <div>
          <div className="wdr--conta..." onKeyDown={function onKeyDown}>
            <div ref={{current:null}} className="wdr--dialog" onFocus={function onFocus}>
              <div className="wdr--content">
                <p>
                <div className="copyProgress">
>                 <p>
>                   <table>
*/

* Windows show file versions

* Extended rename

* F1

* Remotes

* Theming: adapt gray color from KDE/Gtk3 (/Neon/Ubuntu/Fedora)
* Theming: Unify Titlebar, path input and table columns, margins like Gtk4/Adwaita
* Theming: SVG folder Icons per Theme
* Theming: <tr> with padding 

* F11

* menubar-react: Insert shortcut Ins and Einfg

* set info, reset info when mount, getfiles
* set info with short delay and transitions

* CSP in index.html

* alt + enter (KDE with QT program)

