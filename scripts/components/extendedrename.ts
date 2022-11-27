export type ExtendedInfo = {
    prefix: string,
    digits: number,
    start: number
} | null

export class ExtendedRenameDialog extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
            <div>
                <p>
                    <span>Erweitertes Umbenennen</span>
                </p>
                <table>
                    <tr>
                        <td class="right">Prefix:</td>
                        <td>
                            <input id="prefix" class="wdb-focusable" type="text">
                        </td>
                    </tr>
                    <tr>
                        <td class="right">Stellen:</td>
                        <td>
                            <select id="digits" class="wdb-focusable">
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
                            <input id="start" type="number" class="wdb-focusable">
                        </td>
                    </tr>
                </table>
            </div`

        this.prefixInput = this.querySelector('#prefix')!            
        this.digits = this.querySelector('#digits')!            
        this.start = this.querySelector('#start')!            

        this.prefixInput.addEventListener("focus", function () { this.select() })
        this.start.addEventListener("focus", function () { this.select() })
    }

    initialize() {
        this.prefixInput.value = localStorage.getItem("extended-rename-prefix") ?? ""
        this.digits.value = localStorage.getItem("extended-rename-digits") ?? "3"
        this.start.value = localStorage.getItem("extended-rename-start") ?? "0"
        setTimeout(() => this.start.focus(), 100)
    }

    save() {
        localStorage.setItem("extended-rename-prefix", this.prefixInput.value)
        localStorage.setItem("extended-rename-digits", this.digits.value)
        localStorage.setItem("extended-rename-start", this.start.value)
    }

    getExtendedInfos(): ExtendedInfo {
        return {
            prefix: this.prefixInput.value,
            digits: Number.parseInt(this.digits.value),
            start: Number.parseInt(this.start.value)
        }
    }

    private prefixInput: HTMLInputElement
    private digits: HTMLInputElement
    private start: HTMLInputElement
}

customElements.define('extended-rename', ExtendedRenameDialog)

