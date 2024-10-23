import "./style.css";

const APP_NAME = "Hello";
const app = document.querySelector<HTMLDivElement>("#app")!;

const Canvas = document.getElementById ("myCanvas") as HTMLCanvasElement;
const ctx = Canvas.getContext("2d");

if(ctx){
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 256, 256);
};

const Header = document.createElement("h1");
Header.innerHTML = APP_NAME;
app.append(Header);

document.title = APP_NAME;
app.innerHTML = APP_NAME;

