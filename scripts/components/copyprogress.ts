export type CopyProgressInfo = {
    total:   number
    current: number
}

export type CopyProgress = {
    currentFile: string
    total:       CopyProgressInfo
    current:     CopyProgressInfo
}

export class CopyProgressDialog extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
            <div class='copy-progress-root'>
                <p>
                    <span class="fileName"></span>
                </p>
                <progress class="currentProgress" max="0" value="0"></progress>
                <p>Gesamt:</p>
                <progress class="totalProgress" max="0" value="0"></progress>
            </div`
        
        this.fileNameSpan = this.getElementsByClassName("fileName")[0] as HTMLSpanElement
        this.currentProgress = this.getElementsByClassName("currentProgress")[0] as HTMLProgressElement
        this.totalProgress = this.getElementsByClassName("totalProgress")[0] as HTMLProgressElement
    }

    setValue(value: CopyProgress) {
        this.fileNameSpan.innerText = value.currentFile
        this.currentProgress.max = value.current.total
        this.currentProgress.value = value.current.current
        this.totalProgress.max = value.total.total
        this.totalProgress.value = value.total.current
    }

    private fileNameSpan: HTMLSpanElement
    private currentProgress: HTMLProgressElement
    private totalProgress: HTMLProgressElement
}

customElements.define('copy-progress', CopyProgressDialog)
