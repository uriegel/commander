class ExtendedRename extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
            <div>
                <p>
                    <input id="activate" type="checkbox" class="wdb-focusable">
                    <span>Erweitertes Umbenennen</span>
                </p>
                <table>
                    <tr>
                        <td class="right">Prefix:</td>
                        <td>
                            <input id="prefix" class="wdb-focusable" type="text" disabled="disabled">
                        </td>
                    </tr>
                    <tr>
                        <td class="right">Stellen:</td>
                        <td>
                            <select id="digits" class="wdb-focusable" disabled>
                                <option>1</option>
                                <option>2</option>
                                <option>3</option>
                                <option>4</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td class="right">Start:</td>
                        <td>
                            <input id="start" type="number" class="wdb-focusable" disabled="disabled">
                        </td>
                    </tr>
                </table>
            </div`

        this.activate = this.querySelector('#activate')            
        this.prefixInput = this.querySelector('#prefix')            
        this.digits = this.querySelector('#digits')            
        this.start = this.querySelector('#start')            
        this.activate.onclick = () => this.syncActivated()
    }

    get isActivated() { return this.activate.checked }
    set isActivated(value) { 
        this.activate.checked = value
        this.syncActivated()
    }

    initialize() {
        this.isActivated = true
        this.prefixInput.value = localStorage.getItem("extended-rename-prefix")
        this.digits.value = localStorage.getItem("extended-rename-digits") || 3
        this.start.value = localStorage.getItem("extended-rename-start") || 0
    }

    save() {
        localStorage.setItem("extended-rename-prefix", this.prefixInput.value)
        localStorage.setItem("extended-rename-digits", this.digits.value)
        localStorage.setItem("extended-rename-start", this.start.value)
    }

    getExtendedInfos() {
        return this.isActivated 
        ? ({
            prefix: this.prefixInput.value,
            digits: this.digits.value,
            start: this.start.value
        })
        : null
    }


    syncActivated() {
        if (this.activate.checked) {
            this.prefixInput.disabled = false
            this.digits.disabled = false
            this.start.disabled = false
        } else {
            this.prefixInput.disabled = true
            this.digits.disabled = true
            this.start.disabled = true
        }
    }        
}

customElements.define('extended-rename', ExtendedRename)

