// PenPal Draw - Main Drawing Application

// Shortcut Keys Configuration
const DEFAULT_SHORTCUTS = [
  { key: 'K1', action: 'brush_medium', binding: '' },
  { key: 'K2', action: 'brush_large', binding: '' },
  { key: 'K3', action: 'color_black', binding: '' },
  { key: 'K4', action: 'color_white', binding: '' },
  { key: 'K5', action: 'undo', binding: '' },
  { key: 'K6', action: 'eraser', binding: '' },
  { key: 'K7', action: 'clear', binding: '' },
  { key: 'K8', action: 'save', binding: '' }
];

const XPPEN_DEFAULT_BINDINGS = [
  'Ctrl+F1', 'Ctrl+F2', 'Ctrl+F3', 'Ctrl+F4',
  'Ctrl+F5', 'Ctrl+F6', 'Ctrl+F7', 'Ctrl+F8'
];

class ShortcutManager {
  constructor(app) {
    this.app = app;
    this.shortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
    this.listeningForKey = null;
    this.isAutoDetecting = false;
    this.autoDetectIndex = 0;
    
    this.loadFromStorage();
    this.setupEventListeners();
  }
  
  loadFromStorage() {
    const saved = localStorage.getItem('penpal-shortcuts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all keys exist
        this.shortcuts = this.shortcuts.map((s, i) => ({
          ...s,
          ...parsed[i],
          key: s.key // Ensure key name doesn't change
        }));
      } catch (e) {
        console.log('Failed to load shortcuts:', e);
      }
    }
  }
  
  saveToStorage() {
    localStorage.setItem('penpal-shortcuts', JSON.stringify(this.shortcuts));
  }
  
  setupEventListeners() {
    // Modal controls
    const modal = document.getElementById('shortcutsModal');
    const openBtn = document.getElementById('shortcutsBtn');
    const closeBtn = document.getElementById('closeShortcuts');
    const resetBtn = document.getElementById('resetShortcuts');
    const autoDetectBtn = document.getElementById('autoDetectShortcuts');
    
    openBtn.addEventListener('click', () => this.openModal());
    closeBtn.addEventListener('click', () => this.closeModal());
    resetBtn.addEventListener('click', () => this.resetToDefault());
    autoDetectBtn.addEventListener('click', () => this.startAutoDetect());
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal();
    });
    
    // Keyboard event for shortcut detection
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Setup action select change handlers
    document.querySelectorAll('.shortcut-item').forEach((item, index) => {
      const select = item.querySelector('.action-select');
      const bindingSpan = item.querySelector('.key-binding');
      
      select.addEventListener('change', (e) => {
        this.shortcuts[index].action = e.target.value;
        this.saveToStorage();
      });
      
      bindingSpan.addEventListener('click', () => {
        this.startListeningForKey(index);
      });
    });
    
    // Initialize UI
    this.updateUI();
  }
  
  openModal() {
    document.getElementById('shortcutsModal').classList.add('active');
    this.updateUI();
  }
  
  closeModal() {
    document.getElementById('shortcutsModal').classList.remove('active');
    this.stopListeningForKey();
    this.stopAutoDetect();
  }
  
  updateUI() {
    document.querySelectorAll('.shortcut-item').forEach((item, index) => {
      const select = item.querySelector('.action-select');
      const bindingSpan = item.querySelector('.key-binding');
      
      select.value = this.shortcuts[index].action;
      
      if (this.shortcuts[index].binding) {
        bindingSpan.textContent = this.shortcuts[index].binding;
        bindingSpan.classList.add('bound');
      } else {
        bindingSpan.textContent = 'Click to bind';
        bindingSpan.classList.remove('bound');
      }
      
      // Update listening state
      if (this.listeningForKey === index) {
        item.classList.add('listening');
        bindingSpan.textContent = this.isAutoDetecting ? 'Press key...' : 'Press key...';
      } else {
        item.classList.remove('listening');
      }
    });
  }
  
  startListeningForKey(index) {
    this.listeningForKey = index;
    this.isAutoDetecting = false;
    this.updateUI();
  }
  
  stopListeningForKey() {
    this.listeningForKey = null;
    this.updateUI();
  }
  
  startAutoDetect() {
    this.isAutoDetecting = true;
    this.autoDetectIndex = 0;
    this.openModal();
    alert('Press each shortcut key on your XPPen tablet in order (K1 through K8)');
    this.startListeningForKey(0);
  }
  
  stopAutoDetect() {
    this.isAutoDetecting = false;
    this.autoDetectIndex = 0;
  }
  
  getKeyCombo(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');
    
    // Map special keys
    let key = e.key;
    if (key.startsWith('F') && !isNaN(key.slice(1))) {
      // F1-F24 stay as-is
    } else if (key.length === 1) {
      key = key.toUpperCase();
    } else if (key === ' ') {
      key = 'Space';
    }
    
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      parts.push(key);
    }
    
    return parts.join('+');
  }
  
  handleKeyDown(e) {
    if (this.listeningForKey === null) {
      // Check if this matches any bound shortcut
      const combo = this.getKeyCombo(e);
      const shortcut = this.shortcuts.find(s => s.binding === combo);
      if (shortcut) {
        e.preventDefault();
        this.executeAction(shortcut.action);
      }
      return;
    }
    
    e.preventDefault();
    
    const combo = this.getKeyCombo(e);
    if (!combo || combo === 'Ctrl' || combo === 'Alt' || combo === 'Shift') {
      return; // Wait for full combo
    }
    
    // Store the binding
    this.shortcuts[this.listeningForKey].binding = combo;
    this.saveToStorage();
    
    if (this.isAutoDetecting) {
      this.autoDetectIndex++;
      if (this.autoDetectIndex < this.shortcuts.length) {
        this.startListeningForKey(this.autoDetectIndex);
      } else {
        this.stopListeningForKey();
        this.stopAutoDetect();
        alert('All shortcut keys configured!');
      }
    } else {
      this.stopListeningForKey();
    }
    
    this.updateUI();
  }
  
  executeAction(action) {
    console.log('Executing action:', action);
    
    switch (action) {
      case 'brush_small':
        this.app.setBrushSize(3);
        break;
      case 'brush_medium':
        this.app.setBrushSize(10);
        break;
      case 'brush_large':
        this.app.setBrushSize(25);
        break;
      case 'color_black':
        this.app.setColor('#000000');
        break;
      case 'color_white':
        this.app.setColor('#ffffff');
        break;
      case 'color_red':
        this.app.setColor('#ff0000');
        break;
      case 'color_picker':
        this.app.startColorPicker();
        break;
      case 'undo':
        this.app.undo();
        break;
      case 'redo':
        this.app.redo();
        break;
      case 'clear':
        this.app.clearCanvas();
        break;
      case 'save':
        this.app.saveImage();
        break;
      case 'eraser':
        this.app.toggleEraser();
        break;
      case 'fullscreen':
        this.app.toggleFullscreen();
        break;
      case 'none':
      default:
        break;
    }
  }
  
  resetToDefault() {
    this.shortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
    this.saveToStorage();
    this.updateUI();
  }
  
  applyXPPenDefaults() {
    this.shortcuts.forEach((s, i) => {
      s.binding = XPPEN_DEFAULT_BINDINGS[i] || '';
    });
    this.saveToStorage();
    this.updateUI();
  }
}

class DrawingApp {
  constructor() {
    this.canvas = document.getElementById('drawingCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.currentStroke = [];
    this.strokes = [];
    this.redoStack = [];
    
    // Brush settings
    this.brushSize = 5;
    this.color = '#000000';
    this.opacity = 1;
    this.usePressure = true;
    this.currentPressure = 0;
    
    // Eraser mode
    this.isEraser = false;
    this.previousColor = '#000000';
    this.previousSize = 5;
    
    // Color picker mode
    this.isPickingColor = false;
    
    // Canvas background
    this.backgroundColor = '#ffffff';
    
    // Initialize shortcut manager
    this.shortcutManager = new ShortcutManager(this);
    
    this.init();
  }
  
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupToolbar();
    this.loadMonitors();
    
    // Set initial canvas background
    this.fillBackground();
    
    // Log web mode detection
    if (!window.__TAURI__) {
      console.log('Running in WEB MODE - Some features limited');
    }
  }
  
  setupCanvas() {
    const container = document.getElementById('canvas-container');
    
    // Make canvas fill the container initially
    this.resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }
  
  resizeCanvas() {
    const container = document.getElementById('canvas-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Save current canvas content
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.canvas, 0, 0);
    
    // Resize canvas
    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;
    
    // Restore content or fill background
    if (tempCanvas.width > 0 && tempCanvas.height > 0) {
      this.ctx.drawImage(tempCanvas, 0, 0);
    } else {
      this.fillBackground();
    }
    
    // Restore brush settings (reset by resize)
    this.updateBrushSettings();
    
    console.log('Canvas resized to:', containerWidth, 'x', containerHeight);
  }
  
  fillBackground() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    console.log('Canvas background filled');
  }
  
  setupEventListeners() {
    // Pointer events for pen/mouse/touch support
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('pointerout', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.handlePointerUp(e));
    
    // Prevent default touch actions for better pen support
    this.canvas.style.touchAction = 'none';
    
    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Debug logging for web testing
    console.log('Canvas setup complete. Pointer events enabled.');
    console.log('Canvas size:', this.canvas.width, 'x', this.canvas.height);
  }
  
  handlePointerDown(e) {
    // Don't start drawing if picking color
    if (this.isPickingColor) {
      return;
    }
    
    e.preventDefault();
    
    // Capture pointer to ensure we get events even if cursor leaves canvas
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (err) {
      // Some browsers may not support this
      console.log('Pointer capture not supported');
    }
    
    this.isDrawing = true;
    this.currentStroke = [];
    this.redoStack = []; // Clear redo on new stroke
    
    const { x, y } = this.getPointerPosition(e);
    const pressure = this.getPressure(e);
    
    this.currentPressure = pressure;
    this.currentStroke.push({ x, y, pressure, isEraser: this.isEraser });
    
    this.updatePressureIndicator(pressure);
    this.startStroke(x, y, pressure);
    
    console.log('Pointer down:', e.pointerType, 'at', x, y, 'pressure:', pressure);
  }
  
  handlePointerMove(e) {
    e.preventDefault();
    
    if (!this.isDrawing) return;
    
    const { x, y } = this.getPointerPosition(e);
    const pressure = this.getPressure(e);
    
    this.currentPressure = pressure;
    this.currentStroke.push({ x, y, pressure });
    
    this.updatePressureIndicator(pressure);
    this.draw(x, y, pressure);
  }
  
  handlePointerUp(e) {
    if (!this.isDrawing) return;
    
    e.preventDefault();
    
    // Release pointer capture
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore if capture wasn't set
    }
    
    this.isDrawing = false;
    
    // Save stroke for undo
    if (this.currentStroke.length > 0) {
      this.strokes.push({
        points: [...this.currentStroke],
        color: this.color,
        size: this.brushSize,
        opacity: this.isEraser ? 1 : this.opacity,
        usePressure: this.usePressure,
        isEraser: this.isEraser
      });
    }
    
    this.currentStroke = [];
    this.updatePressureIndicator(0);
    
    // End the path
    this.ctx.beginPath();
    
    console.log('Pointer up, stroke saved. Total strokes:', this.strokes.length);
  }
  
  getPointerPosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
  
  getPressure(e) {
    // e.pressure is 0.0 to 1.0 for pen devices
    // For mouse, it's typically 0.5, for touch it varies
    if (!this.usePressure) {
      return 1.0;
    }
    
    // For pen, use actual pressure
    if (e.pointerType === 'pen') {
      return e.pressure || 0.5;
    }
    
    // For mouse and touch, use full pressure (1.0)
    return 1.0;
  }
  
  startStroke(x, y, pressure) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    
    // Draw a single dot if it's just a click
    const size = this.usePressure 
      ? this.brushSize * (0.2 + pressure * 0.8) 
      : this.brushSize;
    
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = size;
    this.ctx.strokeStyle = this.hexToRgba(this.color, this.opacity);
    
    // Draw initial dot
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }
  
  draw(x, y, pressure) {
    const size = this.usePressure 
      ? this.brushSize * (0.2 + pressure * 0.8) 
      : this.brushSize;
    
    this.ctx.lineWidth = size;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }
  
  updateBrushSettings() {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }
  
  setupToolbar() {
    // Brush size
    const brushSizeInput = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');
    brushSizeInput.addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
      brushSizeValue.textContent = this.brushSize;
    });
    
    // Color
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.addEventListener('input', (e) => {
      this.color = e.target.value;
    });
    
    // Opacity
    const opacityInput = document.getElementById('opacity');
    const opacityValue = document.getElementById('opacityValue');
    opacityInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.opacity = val / 100;
      opacityValue.textContent = val + '%';
    });
    
    // Pressure toggle
    const pressureToggle = document.getElementById('pressureToggle');
    pressureToggle.addEventListener('change', (e) => {
      this.usePressure = e.target.checked;
    });
    
    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearCanvas();
    });
    
    // Undo button
    document.getElementById('undoBtn').addEventListener('click', () => {
      this.undo();
    });
    
    // Redo button
    document.getElementById('redoBtn').addEventListener('click', () => {
      this.redo();
    });
    
    // Save button
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveImage();
    });
    
    // Move to display button
    document.getElementById('moveToDisplayBtn').addEventListener('click', () => {
      this.moveToSelectedDisplay();
    });
    
    // Fullscreen button
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
      this.toggleFullscreen();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.redo();
      }
      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveImage();
      }
      // Eraser toggle: E
      if (e.key === 'e' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        this.toggleEraser();
      }
      // Brush size shortcuts: [ and ]
      if (e.key === '[' && !e.ctrlKey && !e.metaKey) {
        const newSize = Math.max(1, this.brushSize - 5);
        this.setBrushSize(newSize);
      }
      if (e.key === ']' && !e.ctrlKey && !e.metaKey) {
        const newSize = Math.min(100, this.brushSize + 5);
        this.setBrushSize(newSize);
      }
    });
  }
  
  clearCanvas() {
    // Save current state for undo
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.strokes.push({ type: 'clear', imageData });
    
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    console.log('Canvas cleared');
  }
  
  undo() {
    if (this.strokes.length === 0) return;
    
    const lastStroke = this.strokes.pop();
    this.redoStack.push(lastStroke);
    
    // Redraw all remaining strokes
    this.redrawCanvas();
    console.log('Undo performed. Strokes left:', this.strokes.length);
  }
  
  redo() {
    if (this.redoStack.length === 0) return;
    
    const stroke = this.redoStack.pop();
    this.strokes.push(stroke);
    this.redrawCanvas();
    console.log('Redo performed. Strokes:', this.strokes.length);
  }
  
  redrawCanvas() {
    // Clear and fill background
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Redraw each stroke
    for (const stroke of this.strokes) {
      if (stroke.type === 'clear') {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        continue;
      }
      
      if (stroke.points && stroke.points.length > 0) {
        this.ctx.beginPath();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.hexToRgba(stroke.color, stroke.opacity);
        
        const first = stroke.points[0];
        this.ctx.moveTo(first.x, first.y);
        
        for (let i = 1; i < stroke.points.length; i++) {
          const point = stroke.points[i];
          // Use stored size and pressure for this specific stroke
          const baseSize = stroke.isEraser ? stroke.size / 2 : stroke.size;
          const size = stroke.usePressure 
            ? baseSize * (0.2 + point.pressure * 0.8) 
            : baseSize;
          
          this.ctx.lineWidth = size;
          this.ctx.lineTo(point.x, point.y);
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(point.x, point.y);
        }
      }
    }
  }
  
  saveImage() {
    const link = document.createElement('a');
    link.download = `penpal-draw-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
    console.log('Image saved');
  }
  
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  updatePressureIndicator(pressure) {
    const indicator = document.getElementById('pressureIndicator');
    const percentage = Math.round(pressure * 100);
    indicator.textContent = `Pressure: ${percentage}%`;
    
    // Color based on pressure
    if (pressure === 0) {
      indicator.style.color = '#888';
    } else if (pressure < 0.3) {
      indicator.style.color = '#FFC107'; // Yellow for light
    } else if (pressure < 0.7) {
      indicator.style.color = '#4CAF50'; // Green for medium
    } else {
      indicator.style.color = '#F44336'; // Red for heavy
    }
  }
  
  // === Tool Setters for Shortcuts ===
  setBrushSize(size) {
    this.brushSize = size;
    const input = document.getElementById('brushSize');
    const value = document.getElementById('brushSizeValue');
    if (input) input.value = size;
    if (value) value.textContent = size;
    
    // If in eraser mode, exit it
    if (this.isEraser) {
      this.toggleEraser();
    }
  }
  
  setColor(color) {
    this.color = color;
    const input = document.getElementById('colorPicker');
    if (input) input.value = color;
    
    // If in eraser mode, exit it
    if (this.isEraser) {
      this.toggleEraser();
    }
  }
  
  startColorPicker() {
    this.isPickingColor = true;
    this.canvas.style.cursor = 'crosshair';
    
    // One-time click handler
    const pickColor = (e) => {
      const { x, y } = this.getPointerPosition(e);
      const pixel = this.ctx.getImageData(x, y, 1, 1).data;
      const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('');
      this.setColor(hex);
      this.isPickingColor = false;
      this.canvas.style.cursor = 'crosshair';
      this.canvas.removeEventListener('pointerdown', pickColor);
      
      // Show feedback
      this.showNotification(`Color picked: ${hex}`);
    };
    
    this.canvas.addEventListener('pointerdown', pickColor, { once: true });
  }
  
  toggleEraser() {
    if (this.isEraser) {
      // Switch back to brush
      this.isEraser = false;
      this.color = this.previousColor;
      this.brushSize = this.previousSize;
      document.getElementById('colorPicker').value = this.color;
      document.getElementById('brushSize').value = this.brushSize;
      document.getElementById('brushSizeValue').textContent = this.brushSize;
      this.showNotification('Brush mode');
    } else {
      // Switch to eraser
      this.isEraser = true;
      this.previousColor = this.color;
      this.previousSize = this.brushSize;
      this.color = this.backgroundColor;
      this.brushSize = Math.max(this.brushSize * 2, 20);
      this.showNotification('Eraser mode');
    }
  }
  
  showNotification(message) {
    // Create notification element
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    notif.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #2d2d2d;
      color: #fff;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 3000;
      animation: fadeIn 0.2s ease;
    `;
    document.body.appendChild(notif);
    
    // Remove after 2 seconds
    setTimeout(() => {
      notif.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => notif.remove(), 200);
    }, 2000);
  }
  
  // Monitor/Display Management
  async loadMonitors() {
    try {
      // Check if Tauri API is available
      if (window.__TAURI__) {
        const { invoke } = window.__TAURI__;
        const monitors = await invoke('get_monitors');
        this.populateMonitorSelect(monitors);
      } else {
        // Web fallback - just show window info
        this.populateMonitorSelect([{
          name: 'Current Window (Web Mode)',
          x: window.screenLeft || window.screenX || 0,
          y: window.screenTop || window.screenY || 0,
          width: window.screen.width,
          height: window.screen.height,
          is_primary: true
        }]);
        
        // Disable move button in web mode
        const moveBtn = document.getElementById('moveToDisplayBtn');
        if (moveBtn) {
          moveBtn.disabled = true;
          moveBtn.title = 'Move to display requires desktop app';
        }
      }
    } catch (e) {
      console.log('Tauri not available, running in web mode');
    }
  }
  
  populateMonitorSelect(monitors) {
    const select = document.getElementById('monitorSelect');
    select.innerHTML = '';
    
    monitors.forEach((monitor, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.text = `${monitor.name} (${monitor.width}x${monitor.height})${monitor.is_primary ? ' - Primary' : ''}`;
      option.dataset.x = monitor.x;
      option.dataset.y = monitor.y;
      option.dataset.width = monitor.width;
      option.dataset.height = monitor.height;
      select.appendChild(option);
    });
    
    // Select the non-primary monitor by default (likely the XPPen)
    const nonPrimary = monitors.findIndex(m => !m.is_primary);
    if (nonPrimary !== -1) {
      select.value = nonPrimary;
    }
  }
  
  async moveToSelectedDisplay() {
    const select = document.getElementById('monitorSelect');
    const selected = select.options[select.selectedIndex];
    
    const x = parseInt(selected.dataset.x);
    const y = parseInt(selected.dataset.y);
    const width = parseInt(selected.dataset.width);
    const height = parseInt(selected.dataset.height);
    
    try {
      if (window.__TAURI__) {
        const { invoke } = window.__TAURI__;
        await invoke('move_window_to_monitor', {
          x,
          y,
          width,
          height,
          fullscreen: false
        });
      }
    } catch (e) {
      console.error('Failed to move window:', e);
    }
  }
  
  async toggleFullscreen() {
    try {
      if (window.__TAURI__) {
        const { invoke } = window.__TAURI__;
        await invoke('move_window_to_monitor', {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          fullscreen: true
        });
      } else {
        // Web fullscreen fallback
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    } catch (e) {
      console.error('Failed to toggle fullscreen:', e);
    }
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('PenPal Draw initializing...');
  const app = new DrawingApp();
  window.penpalApp = app; // Expose for debugging
  console.log('PenPal Draw ready! Open browser console (F12) for debug info.');
});
