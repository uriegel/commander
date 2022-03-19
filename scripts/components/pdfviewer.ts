const template = document.createElement('template')
template.innerHTML = `  
    <style>
        #control {
			display: flex;
    		flex-direction: column;
            height: 100%;
            width: 100%;
            background-color: var(--pdfviewer-background-color);
        }   
		#canvasContainer {
			flex-grow: 1;
    		position: relative;
			overflow-y: scroll;
    		overflow-x: hidden;
		}
		#pages {
			color: var(--pdfviewer-color);
		}
		canvas {
			position: absolute;
		}
    </style>
    <div id="control">
        <div>
			<button id="first">&#8676;</button>
			<button id="prev">&#8592;</button>
            <button id="next">&#8594;</button>
			<button id="last">&#8677;</button>
            <span id="pages"><span id="page_num"></span> / <span id="page_count"></span></span>
        </div>
		<div id="canvasContainer">
		    <canvas id="canvas"></canvas>
		</div>
    </div>
` 

type PdfLib = {
	getDocument: (url: string)=>PdfLoadingTask
}

type PdfLoadingTask = {
	promise: Promise<PdfDoc>
	destroy: ()=>void
}

type Viewport = {
	width: number
	height: number
}

type Scale = {

}

type RenderContext = {
	canvasContext: CanvasRenderingContext2D
	viewport: Viewport
}

type RenderTask = {
	promise: Promise<void>
}

type PdfPage = {
	getViewport: (scale: Scale)=>Viewport
	render: (renderContext: RenderContext)=>RenderTask 
}

type PdfDoc = {
	numPages: number
	getPage(num: number): PdfPage
}

// TODO First Last
// TODO Toolbar
// TODO Padding
// TODO Thumbnails
export class PdfViewer extends HTMLElement {
	private canvasContainer: HTMLElement
	private canvas: HTMLCanvasElement
	private pageNum = 0
	private resizeTimer = 0
	private pdfjsLib: PdfLib | undefined
	private pdfDoc: PdfDoc | null = null
	private loadingTask: PdfLoadingTask | null = null
	private pageRendering = false
	private pageNumPending: number | null = null
	private ctx: CanvasRenderingContext2D | null = null
	private width = 0
	
	constructor() {
		super()
		
		var style = document.createElement("style")
        document.head.appendChild(style)
        style.sheet!.insertRule(`:root {
            --pdfviewer-background-color : gray;
			--pdfviewer-color : white;
        }`)

        this.attachShadow({ mode: 'open'})
        this.shadowRoot!.appendChild(template.content.cloneNode(true))
		this.canvasContainer = this.shadowRoot!.getElementById('canvasContainer')!
		this.canvas = this.shadowRoot!.getElementById('canvas')! as HTMLCanvasElement
    }

    connectedCallback() {
        this.shadowRoot!.getElementById('prev')!.addEventListener('click', () => {
        	if (this.pageNum > 1) 
				this.queueRenderPage(--this.pageNum)
		})
      
        this.shadowRoot!.getElementById('next')!.addEventListener('click', () => {
			if (this.pageNum < (this.pdfDoc?.numPages ?? 0))
				this.queueRenderPage(++this.pageNum)
		})

		window.addEventListener('resize', () => {
            if (!this.resizeTimer)
                this.resizeTimer = setTimeout(() => {
                    this.resizeTimer = 0
					this.onWidthChanged()
                }, 150) as any as number
        })		
    }

    async load(url: string | undefined) {
		const loadPdfScripts = async () => new Promise(res => {
            const script = document.createElement('script')
            script.src = 'pdf.js'
            script.onload = () => res(undefined)
            //scriptTag.onreadystatechange = () => this.run(pdfUrl)
            document.body.appendChild(script)
		})

		if (!this.pdfjsLib) {
			await loadPdfScripts()
			this.pdfjsLib = (window as any)['pdfjs-dist/build/pdf'] as PdfLib
			(this.pdfjsLib as any).GlobalWorkerOptions.workerSrc = 'worker.js'
		}

		if (url)
			this.run(url)			
	}

    async run(url: string) {
		this.pdfDoc = null
		if (this.loadingTask)
			this.loadingTask.destroy()
		this.loadingTask = null
		this.pageNum = 1
		this.pageRendering = false
		this.pageNumPending = null
        this.ctx = this.canvas.getContext('2d')!
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        const pagecount = this.shadowRoot!.getElementById('page_count')!
		this.loadingTask = this.pdfjsLib!.getDocument(url)
        this.pdfDoc = await this.loadingTask.promise
      	pagecount.textContent = this.pdfDoc.numPages.toString()
      
		if (this.pageNum) 
			this.renderPage(this.pageNum)
    }

	onWidthChanged() {
		if (this.canvasContainer.clientWidth != this.width && this.pageNum) {
			this.queueRenderPage(this.pageNum)
			this.width = this.canvasContainer.clientWidth
		}
	}

 	async renderPage(num: number) {
		this.shadowRoot!.getElementById('page_num')!.textContent = num.toString()
		this.pageRendering = true;
		const page = await this.pdfDoc?.getPage(num)
		if (page) {
			this.width = this.canvasContainer.clientWidth
			const scale = this.canvasContainer.clientWidth / page.getViewport({scale: 1.0}).width
			const viewport = page.getViewport({ scale })
			this.canvas.height = viewport.height
			this.canvas.width = viewport.width
			
			const renderContext = {
				canvasContext: this.ctx!,
				viewport: viewport
			}
			await page.render(renderContext).promise
			this.pageRendering = false
			if (this.pageNumPending != null) {
				this.renderPage(this.pageNumPending)
				this.pageNumPending = null
			}
		}
	}

	queueRenderPage(num: number) {
		if (this.pageRendering) 
			this.pageNumPending = num
		else 
			this.renderPage(num)
	}
}

customElements.define('pdf-viewer', PdfViewer)

