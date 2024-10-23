import "./style.css";

const APP_NAME = "Canvas Draw";
const app = document.querySelector<HTMLDivElement>("#app")!;

const Header = document.createElement("h1");
Header.innerHTML = APP_NAME;
app.append(Header);

const Canvas = document.getElementById ("myCanvas") as HTMLCanvasElement;
const ctx = Canvas.getContext("2d");
const clearButton = document.getElementById("clear");



let drawing = false;

function setCanvasBG(){
    if(ctx){
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 256, 256);
    }
    
};

function startDrawing(event: MouseEvent){
    drawing = true;
    if(ctx){
        ctx.beginPath();
        ctx.moveTo(event.offsetX, event.offsetY);
    }
}

function draw(event: MouseEvent){
    if(!ctx || !drawing) return;
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
}

function stopDrawing(){
    drawing = false;
    if(ctx)
        ctx.closePath();
}

Canvas.addEventListener("mousedown", startDrawing);
Canvas.addEventListener("mousemove", draw);
Canvas.addEventListener("mouseup", stopDrawing);
Canvas.addEventListener("mouseout", stopDrawing);

clearButton?.addEventListener("click", ()=>{
    if(ctx){
        ctx.clearRect(0, 0, Canvas.width, Canvas.height);
        setCanvasBG();
    }
});

setCanvasBG();

document.title = APP_NAME;
app.innerHTML = APP_NAME;

