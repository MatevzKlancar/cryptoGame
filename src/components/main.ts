import { Renderer } from './renderer';
import { Controller } from './controller';
import './styles/main.scss';

const canvas = document.getElementById('viewport') as HTMLCanvasElement;
const controller = new Controller(canvas);
new Renderer(canvas, controller).Start();

// Ensure keyboard events when loaded in an iframe (fix for itch.io)
window.onload = () => {
	window.focus();
};
window.onclick = () => {
	window.focus();
};
