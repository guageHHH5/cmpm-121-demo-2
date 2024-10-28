import "./style.css";

interface DrawableCommand{
    display(ctx: CanvasRenderingContext2D): void;
}


const APP_NAME = "Canvas Draw";
const app = document.querySelector<HTMLDivElement>("#app")!;

const Header = document.createElement("h1");
Header.innerHTML = APP_NAME;
app.append(Header);

const Canvas = document.getElementById ("myCanvas") as HTMLCanvasElement;
const ctx = Canvas.getContext("2d");
const clearButton = document.getElementById("clear") as HTMLButtonElement;
const undoButton = document.getElementById("undo") as HTMLButtonElement;
const redoButton = document.getElementById("redo") as HTMLButtonElement;
const thinTool = document.getElementById('thin') as HTMLButtonElement;
const thickTool = document.getElementById('thick') as HTMLButtonElement;
const buttonContainer = document.getElementById('button-container') as HTMLDivElement;
const ExportButton = document.getElementById("export") as HTMLButtonElement;

let drawing = false;
let strokes: DrawableCommand[] = [];
let CurrentStroke: MarkerLine | null = null;
let redoStack: DrawableCommand[] = [];
let lineThickness = 1.5;
let toolPrev: ToolPreview | null = null;
let selectedSticker: string | null = null;
let stickerPrev: StickerPreview | null = null; 

interface Sticker{
    id: string;
    emoji: string;
}

let stickers: Sticker[] = [
    {id: 'sticker1', emoji: '💩'},
    {id: 'sticker2', emoji: '😵‍💫'},
    {id: 'sticker3', emoji: '🖖🏻'}
];

class StickerPreview{
    private x: number;
    private y: number;
    private sticker: string;

    constructor(x: number, y: number, sticker: string){
        this.x = x;
        this.y = y;
        this.sticker = sticker;
    }

    move(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D){
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.sticker, this.x, this.y);
    }
}

class StickerPlacement implements DrawableCommand{
    private x: number;
    private y: number;
    private sticker: string;

    constructor(x: number, y: number, sticker: string){
        this.x = x;
        this.y = y;
        this.sticker = sticker;
    }

    drag(x: number, y: number){
        this.x = x;
        this.y = y;
    }

    display(ctx: CanvasRenderingContext2D){
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.sticker, this.x, this.y);
    }
}

class MarkerLine implements DrawableCommand{
    private points: {x: number, y: number }[] = [];
    private thickness: number;

    constructor(initialX: number, initialY: number, thickness: number){
        this.points.push({x: initialX, y: initialY});
        this.thickness = thickness;
    }

    drag(x: number, y: number){
        this.points.push({x, y});
    }

    display(ctx: CanvasRenderingContext2D){
        if(this.points.length < 2) return;

        ctx.lineWidth = this.thickness;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for(const point of this.points){
            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
        ctx.closePath();
    }
}

class ToolPreview{
    private x: number;
    private y: number;
    private thickness: number;

    constructor(x: number, y: number, thickness: number){
        this.x = x;
        this.y = y;
        this.thickness = thickness;
    }

    move(x: number, y: number){
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        ctx.closePath();
    }
}

function setCanvasBG(){
    if(ctx){
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 256, 256);
    }
    
};

function exportCanvasAsPNG(){
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportCtx = exportCanvas.getContext("2d");
    if(exportCtx){
        exportCtx.scale(4,4);
        exportCtx.fillStyle = "#ffffff";
        exportCtx.fillRect(0, 0, Canvas.width, Canvas.height);
        strokes.forEach(stroke => stroke.display(exportCtx));
    }
    exportCanvas.toBlob((blob) => {
        if(blob){
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "canvas_export.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }, "image/png");
}

function redraw(){
    if(ctx){
        ctx.clearRect(0, 0, Canvas.width, Canvas.height);
        setCanvasBG();

        for(const stroke of strokes){
            stroke.display(ctx);
        }

        if(CurrentStroke){
            CurrentStroke.display(ctx);
        }

        if(stickerPrev && !drawing){
            stickerPrev.draw(ctx);
        }

        if(toolPrev && !drawing){
            toolPrev.draw(ctx);
        }
    }
}

function drawingChange(){
    const event = new Event("drawing-changed");
    Canvas.dispatchEvent(event);
}

function toolMoved(){
    const event = new Event('tool-moved');
    Canvas.dispatchEvent(event);
}

function startDrawing(event: MouseEvent){
    drawing = true;
    CurrentStroke = new MarkerLine(event.offsetX, event.offsetY, lineThickness);
}

function draw(event: MouseEvent){
    if(!drawing || !CurrentStroke) return;
    CurrentStroke.drag(event.offsetX, event.offsetY);
    drawingChange()
}

function stopDrawing(){
    if(drawing && CurrentStroke){
        strokes.push(CurrentStroke);
        redoStack = [];
        CurrentStroke = null;
        drawing = false;
    }
}

function updateToolPrev(event: MouseEvent){
    if(!toolPrev){
        toolPrev = new ToolPreview(event.offsetX, event.offsetY, lineThickness);
    } else {
        toolPrev.move(event.offsetX, event.offsetY);
    }
    toolMoved();
}

function UndoStroke(){
    if(strokes.length > 0){
        const lastStroke = strokes.pop();
        if(lastStroke){
            redoStack.push(lastStroke);
        }
        drawingChange();
    }
}

function RedoStroke(){
    if(redoStack.length > 0){
        const lastUndo = redoStack.pop();
        if(lastUndo){
            strokes.push(lastUndo);
        }
        drawingChange();
    }
}

function selectThin(){
    lineThickness = 1.5;
    thinTool.classList.add('selectedTool');
    thickTool.classList.remove('selectedTool');
}

function selectThick(){
    lineThickness = 4;
    thickTool.classList.add('selectedTool');
    thinTool.classList.remove('selectedTool');
}

function renderStickerButtons(){
    buttonContainer.innerHTML = '';

    stickers.forEach((sticker)=>{
        const button = document.createElement("button");
        button.textContent = sticker.emoji;
        button.addEventListener("click", ()=> selectSticker(sticker.emoji));
        buttonContainer.appendChild(button);
    });

    const customSticker = document.createElement("button");
    customSticker.textContent = "Add Custom Sticker";
    customSticker.addEventListener("click", createCustomSticker);
    buttonContainer.appendChild(customSticker);
}

function createCustomSticker(){
    const customEmoji = prompt("Enter an emoji for your custom sticker:", "😊");
    if (customEmoji) {
        const customSticker: Sticker = {
            id: `sticker${stickers.length + 1}`,
            emoji: customEmoji
        };
        stickers.push(customSticker);
        renderStickerButtons(); 
    }
}

function selectSticker(sticker: string){
    selectedSticker = sticker;

    toolMoved();

    toolPrev = null;
    stickerPrev = new StickerPreview(0, 0, sticker);
}

function updateStickerPrev(event: MouseEvent){
    if(stickerPrev){
        stickerPrev.move(event.offsetX, event.offsetY);
        redraw();
    }
}

function placeSticker(event: MouseEvent){
    if(selectedSticker){
        const newSticker = new StickerPlacement(event.offsetX, event.offsetY, selectedSticker);
        strokes.push(newSticker);
        redraw();

        if(stickerPrev){
            stickerPrev.move(event.offsetX, event.offsetY);
        }
    }
}

document.addEventListener('DOMContentLoaded', ()=>{
    renderStickerButtons();
    setCanvasBG();
})

Canvas.addEventListener('mousemove', (event) => {
    if (selectedSticker) {
        updateStickerPrev(event);
    } else {
        updateToolPrev(event); // Use tool preview if no sticker is selected
    }
});

Canvas.addEventListener('click', (event) => {
    if (selectedSticker) {
        placeSticker(event); // Place the sticker if a sticker is selected
    }
});

Canvas.addEventListener('mouseout', () => {
    toolPrev = null;
    stickerPrev = null; // Hide sticker preview when the mouse leaves the canvas
    redraw();
});
Canvas.addEventListener("mousedown", startDrawing);
Canvas.addEventListener("mousemove", (event) => {
    draw(event);
    updateToolPrev(event);
});
Canvas.addEventListener("mouseup", stopDrawing);
Canvas.addEventListener("mouseout", ()=>{
    toolPrev = null;
    drawingChange();
});

Canvas.addEventListener("drawing-changed", redraw);

undoButton?.addEventListener('click', UndoStroke);
redoButton?.addEventListener('click', RedoStroke);

clearButton?.addEventListener("click", ()=>{
    strokes = [];
    if(ctx){
        ctx.clearRect(0, 0, Canvas.width, Canvas.height);
        setCanvasBG();
    }
});

thinTool.addEventListener('click', selectThin);
thickTool.addEventListener('click', selectThick);
ExportButton.addEventListener('click', exportCanvasAsPNG);

setCanvasBG();

document.title = APP_NAME;
app.innerHTML = APP_NAME;

