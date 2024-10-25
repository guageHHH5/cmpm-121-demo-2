import "./style.css";

type Point = {x: number, y: number};



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


let drawing = false;
let strokes: MarkerLine[] = [];
let CurrentStroke: MarkerLine | null = null;
let redoStack: MarkerLine[] = [];
let lineThickness = 2;

class MarkerLine{
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
function setCanvasBG(){
    if(ctx){
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 256, 256);
    }
    
};

function redraw(){
    if(ctx){
        ctx.clearRect(0, 0, Canvas.width, Canvas.height);
        setCanvasBG();

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        for(const stroke of strokes){
            stroke.display(ctx);
        }
    }
}

function drawingChange(){
    const event = new Event("drawing-changed");
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
    lineThickness = 2;
    thinTool.classList.add('selectedTool');
    thickTool.classList.remove('selectedTool');
}

function selectThick(){
    lineThickness = 5;
    thickTool.classList.add('selectedTool');
    thinTool.classList.remove('selectedTool');
}

Canvas.addEventListener("mousedown", startDrawing);
Canvas.addEventListener("mousemove", draw);
Canvas.addEventListener("mouseup", stopDrawing);
Canvas.addEventListener("mouseout", stopDrawing);

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

setCanvasBG();

document.title = APP_NAME;
app.innerHTML = APP_NAME;

