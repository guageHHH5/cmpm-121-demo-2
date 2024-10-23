import "./style.css";

type Point = {x: number, y: number};

const APP_NAME = "Canvas Draw";
const app = document.querySelector<HTMLDivElement>("#app")!;

const Header = document.createElement("h1");
Header.innerHTML = APP_NAME;
app.append(Header);

const Canvas = document.getElementById ("myCanvas") as HTMLCanvasElement;
const ctx = Canvas.getContext("2d");
const clearButton = document.getElementById("clear");
const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");



let drawing = false;
let strokes: Point[][] = [];
let CurrentStroke: Point[] = [];
let redoStack: Point[][] = [];

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
            if(stroke.length > 0){
                ctx.beginPath();
                ctx.moveTo(stroke[0].x, stroke[0].y);
                for(const point of stroke){
                    ctx.lineTo(point.x, point.y);
                }
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

function drawingChange(){
    const event = new Event("drawing-changed");
    Canvas.dispatchEvent(event);
}

function startDrawing(event: MouseEvent){
    drawing = true;
    CurrentStroke = [];
    const point: Point = {x: event.offsetX, y: event.offsetY};
    CurrentStroke.push(point); 
}

function draw(event: MouseEvent){
    if(!drawing) return;
    const point: Point = {x: event.offsetX, y: event.offsetY};
    CurrentStroke.push(point);

    drawingChange();
}

function stopDrawing(){
    if(drawing){
        strokes.push(CurrentStroke);
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

setCanvasBG();

document.title = APP_NAME;
app.innerHTML = APP_NAME;

