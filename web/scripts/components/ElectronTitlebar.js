const electron = window.require('electron')

class ElectronTitlebar extends HTMLElement {
    constructor() {
        super()

        var style = document.createElement("style")
        document.head.appendChild(style)
        style.sheet.insertRule(`:root {
            --electron-titlebar-color: black;
            --electron-titlebar-background-color: #eee;
            --electron-titlebar-button-hover-color: lightgray;
            --electron-titlebar-focused-color: blue;
            --electron-titlebar-height: 30px;
        }`)
        
        this.attachShadow({ mode: 'open' })

        const template = document.createElement('template')
        template.innerHTML = ` 
            <style>
                #titlebar {
                    display: flex;
                    color: var(--electron-titlebar-color);
                    background-color: var(--electron-titlebar-background-color);
                    height: var(--electron-titlebar-height);
                    border-top: 1px solid transparent;
                }
                #titlebar.focused {
                    border-top: 1px solid var(--electron-titlebar-focused-color);
                }
                #icon {
                    height: var(--electron-titlebar-height);
                }
                .dragregion {
                    flex-grow: 1;
                    text-align: center;
                    vertical-align: middle;
                    margin: 3px 3px 0px 0px;
                    -webkit-app-region: drag;
                    display: flex;
                    align-items: center;   
                }
                #title {
                    flex-grow: 1;   
                    margin-top: -3px;        
                }
                .button {
                    width: 44px;
                    text-align: center;
                    font-size: 12pt;
                    display: flex;
                    align-items: center;        
                    cursor: pointer;
                }
                .button>span {
                    flex-grow: 1;   
                    margin-top: -3px;
                    user-select: none;
                }
                .button:hover {
                    background-color: var(--electron-titlebar-button-hover-color);
                }
                .close:hover {
                    background-color: red;
                    color: white;
                }
                .button>span.dash {
                    vertical-align: sub;
                    margin-top: 0px;
                }                             
            </style>
            <div id="titlebar">
                <img id="icon">
                <slot></slot>
                <div class="dragregion">
                    <span id="title"></span>
                </div>
                <div id="minimize" class="button" @click="onMinimize"><span class="dash">&#x2012;</span></div>
                <div id="maximize" class="button" @click="onMaximize"><span>&#9744;</span></div>                
                <div id="close" class="button close"><span>&#10005;</span></div>
            </div>
        `
        this.shadowRoot.appendChild(template.content.cloneNode(true))

        const icon = this.shadowRoot.getElementById("icon")
        icon.src = this.getAttribute("icon")
        const title = this.shadowRoot.getElementById("title")
        this.titlebar = this.shadowRoot.getElementById("titlebar")
        title.innerText = this.getAttribute("title")
        this.minimize = this.shadowRoot.getElementById("minimize")
        this.maximize = this.shadowRoot.getElementById("maximize")
        this.close = this.shadowRoot.getElementById("close")

        this.titlebar.classList.add("focused")
        electron.ipcRenderer.on("focus", () => this.titlebar.classList.add("focused"))
        electron.ipcRenderer.on("blur", () => this.titlebar.classList.remove("focused"))
    }

    connectedCallback() {
        this.minimize.addEventListener("click", () => electron.ipcRenderer.send("minimize"))
        this.maximize.addEventListener("click", () => electron.ipcRenderer.send("maximize"))
        this.close.addEventListener("click", () => close())
    }
}

customElements.define('electron-titlebar', ElectronTitlebar)
