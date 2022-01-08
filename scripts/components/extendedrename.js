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

        const activate = this.querySelector('#activate')            
        const prefix = this.querySelector('#prefix')            
        const digits = this.querySelector('#digits')            
        const start = this.querySelector('#start')            
        activate.onclick = () => {
            if (activate.checked) {
                prefix.disabled = false
                digits.disabled = false
                start.disabled = false
            } else {
                prefix.disabled = true
                digits.disabled = true
                start.disabled = true
            }
        }
    }
}

customElements.define('extended-rename', ExtendedRename)

