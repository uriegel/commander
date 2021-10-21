class Menubar extends HTMLElement {
    constructor() {
        super()

        var style = document.createElement("style")
        document.head.appendChild(style)
        style.sheet.insertRule(`:root {
            --menubar-color: black;
            --menubar-background-color: white;
            --menubar-hover-color: lightblue;
            --menubar-selected-color: white;
            --menubar-selected-background-color: blue;
            --menubar-border-color: lightgray;
            --menubar-separator-color: lightgray;
            --menubar-shadow-color: rgba(0, 0, 0, 0.2);
        }`)

        this.isAccelerated = false
        this.isKeyboardActivated = false
        this.selectedIndex = -1
        this.attachShadow({ mode: 'open' })

        const template = document.createElement('template')
        template.innerHTML = ` 
            <style>
                .menubar {
                    user-select: none;
                    cursor: default;
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    height: 100%;
                }
                .invisible {
                    display: none;
                }
            </style>
            <ul class="menubar">
                <slot></slot>
            </ul>
        `
        this.shadowRoot.appendChild(template.content.cloneNode(true))
        this.style.outline = "none"
        this.setAttribute("tabindex", "-1")

        const items = Array.from(document.querySelectorAll('menubar-submenu'))
        this.itemCount = items.length
        items.forEach((n, i) => n.setAttribute("index", i))
        this.mnemonics = items.map((n, i) => {
            const header = n.getAttribute("header")
            const pos = header.indexOf('_')
            const key = pos != -1 ? header[pos + 1].toLowerCase() : null
            return ({key, index: i})
        })

        this.menubar = this.shadowRoot.querySelector('ul')
        this.autoMode = this.getAttribute("automode") == "true"
        if (this.autoMode)
            this.menubar.classList.add("invisible")
        this.getShortcuts()
    }

    get isAccelerated()  {
        return this._isAccelerated
    }
    set isAccelerated(value) {
        this._isAccelerated = value
        const items = Array.from(document.querySelectorAll('menubar-menuitem'))
        items.forEach(n => n.setAttribute("is-accelerated", value))
        const mainitems = Array.from(document.querySelectorAll('menubar-submenu'))
        mainitems.forEach(n => n.setAttribute("is-accelerated", value))
    }

    get isKeyboardActivated()  {
        return this._isKeyboardActivated
    }
    set isKeyboardActivated(value) {
        this._isKeyboardActivated = value
        const items = Array.from(document.querySelectorAll('menubar-submenu'))
        items.forEach(n => n.setAttribute("is-keyboard-activated", value))
    }
    
    get selectedIndex()  {
        return this._selectedIndex
    }
    set selectedIndex(value) {
        this._selectedIndex = value
        const items = Array.from(document.querySelectorAll('menubar-submenu'))
        items.forEach(n => n.setAttribute("selected-index", value))
    }

    connectedCallback() {
        document.addEventListener("keydown", evt => {
            if (this.autoMode && evt.keyCode == 18) { // alt
                if (this.menubar.classList.contains("invisible"))
                    this.menubar.classList.remove("invisible")
                else
                    this.menubar.classList.add("invisible")
                evt.preventDefault()
                evt.stopPropagation()
            }            
            if (evt.which == 18 && !evt.repeat && evt.code == "AltLeft") { // Alt 
                if (this.isAccelerated) {
                    this.closeMenu()
                    return
                }
                if (!this.isKeyboardActivated) {
                    if (this.selectedIndex == -1)
                        this.isKeyboardActivated = true
                    this.isAccelerated = true
                    this.lastActive = document.activeElement
                    this.focus()
                }
                evt.preventDefault()
                evt.stopPropagation()                
            }
            else if (evt.which == 27) // ESC
                this.closeMenu()
            else
                this.checkShortcut(evt)
        }, true)
        document.addEventListener("keyup", evt => {
            if (evt.which == 18) { // Alt 
                if (this.isKeyboardActivated && this.selectedIndex == -1) 
                    this.selectedIndex = 0
                evt.preventDefault()
                evt.stopPropagation()
            }
        }, true)

        this.addEventListener("menubar-item-mouseover", evt => {
            if (evt.detail.mainmenu && this.selectedIndex != -1)
                this.selectedIndex = evt.detail.index
        })
        this.addEventListener("menubar-item-mousedown", () => {
            if (!this.lastActive)
                this.lastActive = document.activeElement
        })
        this.addEventListener("menubar-clicked", evt => {
            this.isKeyboardActivated = false
            this.selectedIndex = evt.detail.index
        })
        this.addEventListener("menubar-executed", () => this.closeMenu())
        this.addEventListener("focusout", () => this.closeMenu())

        this.addEventListener("keydown", evt => {
            switch (evt.which) {
                case 37: // <-
                    this.selectedIndex--
                    if (this.selectedIndex == -1)
                        this.selectedIndex = this.itemCount - 1
                    evt.preventDefault()
                    evt.stopPropagation()
                    break
                case 39: // ->
                    this.selectedIndex++
                    if (this.selectedIndex == this.itemCount)
                        this.selectedIndex = 0
                    evt.preventDefault()
                    evt.stopPropagation()
                    break
                case 13: // Enter
                case 32: // Space                
                case 40: //  |d
                    if (this.isKeyboardActivated) {
                        this.isKeyboardActivated = false
                        evt.preventDefault()
                        evt.stopPropagation()
                        break
                    }
                default: {
                    if (this.isAccelerated) {
                        const items = this.mnemonics.filter(n => n.key == evt.key).map(n => n.index)
                        if (items.length > 0) {
                            this.selectedIndex = items[0]
                            this.isKeyboardActivated = false
                            evt.preventDefault()
                            evt.stopPropagation()
                            break
                        }
                    }
                    const items = Array.from(document.querySelectorAll('menubar-submenu'))
                    items.forEach(n => n.onKeyDown(evt))
                }
                break
            }
        })
    }

    closeMenu() {
        this.stopKeyboardActivated()
        this.selectedIndex = -1
        if (this.lastActive)
            this.lastActive.focus()
        this.lastActive = null
        if (!this.menubar.classList.contains("invisible")) {
            if (this.autoMode)
                this.menubar.classList.add("invisible")
//            setTimeout(() => this.$emit('resize'))
        }        
    }

    stopKeyboardActivated() {
        this.isKeyboardActivated = false
        this.isAccelerated = false
    }

    getShortcuts() {
        const getShortcut = text => {

            const getKey = k => k.length == 1 ? k.toLowerCase() : k

            if (!text)
                return  null
            var parts = text.split("+")
            if (parts.length == 1)
                return {
                    ctrl: false,
                    shift: false,
                    alt: false,
                    val: getKey(parts[0])
                }
            else
                return {
                    ctrl: parts[0] == "Strg" || parts[0] == "Ctrl",
                    shift: parts[0] == "Shift",
                    alt: parts[0] == "Alt",
                    val: getKey(parts[1])
                }
        }

        const items = Array.from(document.querySelectorAll('menubar-menuitem'))
            .map(n => ({ shortcut: getShortcut(n.getAttribute("shortcut")), menuitem: n }))
            .filter(n => n.shortcut)

        this.shortcuts = new Map()
        items.forEach(i => {
            const list = this.shortcuts.get(i.shortcut.val)
            if (list)
                this.shortcuts.set(i.shortcut.val, [...list, i])
            else
                this.shortcuts.set(i.shortcut.val, [i])
        })
    }

    checkShortcut(evt) {
        const shortcuts = this.shortcuts.get(evt.key)
        if (shortcuts) {
            const shortcut = shortcuts.filter(n => n.shortcut.ctrl == evt.ctrlKey && n.shortcut.alt == evt.altKey)
            if (shortcut.length == 1) {
                shortcut[0].menuitem.executeCommand()
                evt.preventDefault()
                evt.stopPropagation()
            }
        }
    }
}

class Submenu extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })

        const template = document.createElement('template')
        template.innerHTML = ` 
            <style>
                #menubarItem {
                    float: left;
                    align-items: center;
                    height: 100%;
                }
                #header {
                    height: 100%;
                    display: flex;
                    align-items: inherit;                    
                }
                #header:hover {
                    background-color: var(--menubar-hover-color);
                }
                .selected #header {
                    color: var(--menubar-selected-color);
                    background-color: var(--menubar-selected-background-color);
                }
                #submenu {
                    display: none;
                    position: absolute;
                    z-index: 10000;
                }
                .selected #submenu {
                    display: block;
                }
                .is-keyboard-activated #submenu  {
                    display: none;
                }
            </style>
            <li id="menubarItem">
                <div id="header">
                    <menubar-menuitem mainmenu="true" id="item"></menubar-menuitem>
                </div>
                <menubar-submenu-list id="submenu">
                    <slot id="slot">
                </menubar-submenu-list>
            </li>
        `
        this.shadowRoot.appendChild(template.content.cloneNode(true))
        this.menubaritem = this.shadowRoot.getElementById("menubarItem")
        this.item = this.shadowRoot.getElementById("item")
        this.index = Number.parseInt(this.getAttribute("index"))
        this.item.setAttribute("text", this.getAttribute("header"))
        this.item.setAttribute("index", this.index)
        const slot = this.shadowRoot.getElementById("slot")
        slot.id = `submenu-${this.index}`
        this.submenulist = this.shadowRoot.getElementById('submenu')
        this.submenulist.setAttribute("index", this.index)
    }

    static get observedAttributes() {
        return ['is-accelerated', 'is-keyboard-activated', 'selected-index']
    }

    connectedCallback() {
        this.menubaritem.addEventListener("mouseover", () => this.dispatchEvent(new CustomEvent('menubar-item-mouseover', {
            bubbles: true,
            composed: true,
            detail: {
                mainmenu: true,
                index: this.index
            }
        })))
        this.menubaritem.addEventListener("click", () => this.item.executeCommand())
    }

    onKeyDown(evt) {
        const items = Array.from(this.shadowRoot.querySelectorAll('menubar-submenu-list'))
            .filter(n => window.getComputedStyle(n).display != "none")
        if (items.length == 1)
            items[0].onKeyDown(evt) 
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        switch (attributeName) {
            case "is-accelerated":
                if (oldValue != newValue)
                    this.handleIsAccelerated(newValue)
                break
            case "selected-index":
                if (oldValue != newValue) {
                    const selectedIndex = Number.parseInt(newValue)
                    if (selectedIndex == this.index) {
                        this.menubaritem.classList.add("selected")
                        if (!this.menubaritem.classList.contains("is-keyboard-activated"))
                            this.submenulist.resetIndex()
                    }
                    else
                        this.menubaritem.classList.remove("selected")
                }
                break
            case "is-keyboard-activated":
                if (oldValue != newValue) {
                    if (newValue == "true")
                        this.menubaritem.classList.add("is-keyboard-activated")
                    else {
                        this.menubaritem.classList.remove("is-keyboard-activated")
                        if (this.menubaritem.classList.contains("selected"))
                            this.submenulist.resetIndex()
                    }
                }
                break
        }
    }

    handleIsAccelerated(value) {
        const items = Array.from(this.shadowRoot.querySelectorAll('menubar-menuitem'))
        items.forEach(n => n.setAttribute("is-accelerated", value))
        this.submenulist.setAttribute("is-accelerated", value)
    }
}

class SubmenuList extends HTMLElement {
    constructor() {
        super()
        this.selectedIndex = -1
        this.attachShadow({ mode: 'open' })

        const template = document.createElement('template')
        template.innerHTML = ` 
            <style>
                #submenu {
                    color: var(--menubar-color);
                    background-color: var(--menubar-background-color);
                    z-index: 10000;

                    border-color: var(--menubar-border-color);
                    border-style: solid;
                    border-width: 1px;
                    white-space: nowrap;
                    box-shadow: 2px 2px 20px 2px var(--menubar-shadow-color);
                }
            </style>
            <div id="submenu" tabindex="-1">
                <slot id="slot">
            </div>
        `
        this.shadowRoot.appendChild(template.content.cloneNode(true))
    }

    static get observedAttributes() {
        return ['index', 'is-accelerated']
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        switch (attributeName) {
            case "index":
                this.index = newValue
                this.menuItems = Array.from(document.querySelectorAll('menubar-menuitem'))
                    .filter(n => n.assignedSlot.id == `submenu-${this.index}`)
                this.menuItems.forEach((n, i) => {
                    n.classList.add("submenu-item")
                    n.setAttribute("index", i)
                })
                setTimeout(() => this.mnemonics = this.menuItems.map(n => n.getMnemonic()).map((n, i) => ({key: n, index: i})))
                break
            case "is-accelerated":
                if (oldValue != newValue)
                    this.isAccelerated = newValue == "true"
                break
        }
    }

    connectedCallback() {
        this.addEventListener("menubar-item-mouseover", evt => {
            this.selectedIndex = evt.detail.index
        })
    }

    get selectedIndex() {
        return this._selectedIndex
    }

    set selectedIndex(value) {
        this._selectedIndex = value
        if (this.menuItems)
            this.menuItems.forEach(n => n.setAttribute("selected-index", value))
    }

    resetIndex() { this.selectedIndex = -1 }

    onKeyDown(evt) {
        switch (evt.which) {
            case 13: // Enter
            case 32: // Space                
                if (this.selectedIndex != -1)
                    this.menuItems[this.selectedIndex].executeCommand()
                this.keyIndex = 0
                this.lastKey = null
                evt.preventDefault()
                evt.stopPropagation()
                break
            case 38: //  |^
                this.selectedIndex--
                if (this.selectedIndex < 0)
                    this.selectedIndex = this.menuItems.length - 1
                evt.preventDefault()
                evt.stopPropagation()
                break
            case 40: //  |d
                this.selectedIndex++
                if (this.selectedIndex == this.menuItems.length)
                    this.selectedIndex = 0
                evt.preventDefault()
                evt.stopPropagation()
                break
            default:
                if (this.isAccelerated) {
                    const items = this.mnemonics.filter(n => n.key == evt.key).map(n => n.index)
                    if (items.length == 1) {
                        this.menuItems[items[0]].executeCommand()
                        evt.preventDefault()
                        evt.stopPropagation()
                    } else if (items.length > 1) {
                        if (this.lastKey != evt.key) {
                            this.lastKey = evt.key
                            this.keyIndex = 0
                        }
                        else {
                            this.keyIndex++
                            if (this.keyIndex >= items.length)
                                this.keyIndex = 0
                        }
                        this.selectedIndex = items[this.keyIndex]
                        evt.preventDefault()
                        evt.stopPropagation()
                    }
                    if (this.lastKey != evt.key)
                        this.lastKey = evt.key
                }
                break
        }
    }
}

class MenuItem extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })

        const template = document.createElement('template')
        template.innerHTML = ` 
            <style>
                .menuitemtext {
                    display: flex;
                }
                #menuItem.selected {
                    background-color: var(--menubar-selected-background-color);
                    color: var(--menubar-selected-color);
                }
                .selector {
                    display: none;
                }                
                .submenu-item .selector {
                    display: inline-block;
                    opacity: 0;
                    padding: 0px 7px;
                }                
                .submenu-item.checkbox.is-checked .selector {
                    opacity: 1;
                }
                .submenu-item .spacer {
                    flex-grow: 1;
                    min-width: 20px;
                }                
                .accelerated-active.accelerated {
                    text-decoration: underline;
                }
                #menuItem {
                    padding: 2px 5px;
                    align-items: center;
                    height: 100%;
                    display: flex;                    
                }
                #menuItem.submenu-item {
                    padding: 5px 20px 5px 0px;
                }
            </style>
            <div id="menuItem">
                <div id="text" class="menuitemtext">
                    <span class="selector">✓</span>
                    <div>
                        <span id="pretext"></span><span id="mnemonictext" class="accelerated"></span><span id="posttext"></span>
                    </div>
                    <span class="spacer"> </span>
                    <span id="shortcut"></span>
                </div>
            </div>
        `

        this.shadowRoot.appendChild(template.content.cloneNode(true))
        this.index = Number.parseInt(this.getAttribute("index"))
        this.menuItem = this.shadowRoot.getElementById("menuItem")
        const pretext = this.shadowRoot.getElementById("pretext")
        this.mnemonicText = this.shadowRoot.getElementById("mnemonictext")
        const posttext = this.shadowRoot.getElementById("posttext")
        const textParts = getTextParts(this.getAttribute("text"))
        this.action = this.getAttribute("action")
        const setChecked = this.getAttribute("setChecked")
        if (setChecked)
            setTimeout(() => eval(`${setChecked}(this)`))
        pretext.innerText = textParts[0]
        this.mnemonicText.innerText = textParts[1]
        posttext.innerText = textParts[2]
        this.isCheckbox = this.getAttribute("checkbox") != null
        const menuItem = this.shadowRoot.getElementById("menuItem")
        if (this.isCheckbox)
            menuItem.classList.add("checkbox")
        this.mainmenu = this.getAttribute("mainmenu") == "true"        
        if (!this.mainmenu) 
            menuItem.classList.add("submenu-item")
        const shortcut = this.shadowRoot.getElementById("shortcut")
        shortcut.innerText = this.getAttribute("shortcut")
                         
        function getTextParts(text) {
            const pos = text.indexOf('_')
            if (pos == -1) 
                return ["", "", text]
            else if (pos == 0) 
                return ["", text[1], text.substring(2)]
            else 
                return [ 
                    text.substring(0, pos), 
                    text[pos + 1], 
                    text.substring(pos + 2)
                ]
        }
    }

    static get observedAttributes() {
        return ['is-accelerated', 'selected-index']
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        switch (attributeName) {
            case "is-accelerated":
                if (oldValue != newValue)
                    this.handleIsAccelerated(newValue)
                break
            case "selected-index":
                if (oldValue != newValue) {
                    const selectedIndex = Number.parseInt(newValue)
                    if (selectedIndex == this.index)
                        this.menuItem.classList.add("selected")
                    else
                        this.menuItem.classList.remove("selected")
                }
                break
        }
    }

    connectedCallback() {
        this.addEventListener("click", () => this.executeCommand())

        this.addEventListener("mousedown", () => this.dispatchEvent(new CustomEvent('menubar-item-mousedown', {
            bubbles: true,
            composed: true
        })))

        this.addEventListener("mouseover", () => this.dispatchEvent(new CustomEvent('menubar-item-mouseover', {
            bubbles: true,
            composed: true,
            detail: {
                mainmenu: this.mainmenu,
                index: this.index
            }
        })))
    }

    get isChecked()  {
        return this._isChecked
    }
    set isChecked(value) {
        this._isChecked = value
        if (this.isChecked)
            this.menuItem.classList.add("is-checked")
        else
            this.menuItem.classList.remove("is-checked")
    }

    getMnemonic() {
        return this.mnemonicText.innerText ? this.mnemonicText.innerText.toLowerCase() : null
    }

    executeCommand() {
        if (this.mainmenu) {
            this.dispatchEvent(new CustomEvent('menubar-clicked', {
                bubbles: true,
                composed: true,
                detail: { index: this.index }
            }))
        } else {
            this.dispatchEvent(new CustomEvent('menubar-executed', {
                bubbles: true,
                composed: true
            }))

            if (!this.isCheckbox) {
                if (this.action)
                    eval(`${this.action}()`)
            } else {
                this.isChecked = !this.isChecked
                if (this.action)
                    eval(`${this.action}(${this.isChecked})`)
            }
        }
    }

    handleIsAccelerated(value) {
        if (value == "true") 
            this.mnemonicText.classList.add("accelerated-active")
        else 
            this.mnemonicText.classList.remove("accelerated-active")
    }
}

class Separator extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })

        const template = document.createElement('template')
        template.innerHTML = ` 
            <style>
                hr {
                    border:solid var(--menubar-separator-color) 0.5px;
                    border-top-style: hidden;
                }
            </style>
            <hr /> 
        `
        this.shadowRoot.appendChild(template.content.cloneNode(true))
    }
}

customElements.define('menubar-mainmenu', Menubar)
customElements.define('menubar-submenu', Submenu)
customElements.define('menubar-submenu-list', SubmenuList)
customElements.define('menubar-menuitem', MenuItem)
customElements.define('menubar-separator', Separator)

// TODO Submenu zoom-level
// TODO Resize event when automode