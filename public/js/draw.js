const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('color-picker');
const brushSize = document.getElementById('brush-size');

// Set canvas size with proper dimensions
function resizeCanvas() {
    // Store the current content
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set temp canvas to current dimensions and copy content
    if (canvas.width > 0 && canvas.height > 0) {
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.drawImage(canvas, 0, 0);
    }

    // Get new dimensions from parent container
    const rect = canvas.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    
    // Only resize if dimensions are valid
    if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
        
        // Restore the content if temp canvas had valid dimensions
        if (tempCanvas.width > 0 && tempCanvas.height > 0) {
            ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 
                         0, 0, canvas.width, canvas.height);
        }
    }
}

// Initialize canvas size
resizeCanvas();

// Debounce the resize event to prevent too many calls
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 200);
});

// Rest of your drawing code remains the same...
let isDrawing = false;
let currentPath = [];
let currentColor = colorPicker.value;
let currentSize = brushSize.value;

// Drawing event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// Color and size change listeners
colorPicker.addEventListener('change', (e) => currentColor = e.target.value);
brushSize.addEventListener('change', (e) => currentSize = e.target.value);

function getRelativePoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function startDrawing(e) {
    isDrawing = true;
    const point = getRelativePoint(e);
    currentPath = [point];
    drawPoint(point);
}

function draw(e) {
    if (!isDrawing) return;
    const point = getRelativePoint(e);
    currentPath.push(point);
    drawPath(currentPath);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'draw',
            points: currentPath,
            color: currentColor,
            username: currentUser
        }));
        ws.send(JSON.stringify({
            type: 'cursor',
            x: e.clientX,
            y: e.clientY,
            username: currentUser
        }));
    }
}

function stopDrawing() {
    isDrawing = false;
    currentPath = [];
}

function drawPoint(point) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, currentSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = currentColor;
    ctx.fill();
}

function drawPath(points) {
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawRemoteStroke(data) {
    const tempColor = currentColor;
    const tempSize = currentSize;
    
    currentColor = data.color;
    currentSize = data.brushSize || tempSize;
    
    drawPath(data.points);
    
    currentColor = tempColor;
    currentSize = tempSize;
}