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
      case 'brush_round':
        this.app.brushManager.setBrush('round');
        break;
      case 'brush_soft':
        this.app.brushManager.setBrush('soft');
        break;
      case 'brush_pencil':
        this.app.brushManager.setBrush('pencil');
        break;
      case 'brush_marker':
        this.app.brushManager.setBrush('marker');
        break;
      case 'brush_spray':
        this.app.brushManager.setBrush('spray');
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

// Brush System
const DEFAULT_BRUSHES = {
  round: {
    name: 'Round',
    type: 'round',
    hardness: 100,
    spacing: 10,
    angle: 0,
    roundness: 100,
    minSize: 10,
    texture: null
  },
  square: {
    name: 'Square',
    type: 'square',
    hardness: 100,
    spacing: 10,
    angle: 0,
    roundness: 100,
    minSize: 10,
    texture: null
  },
  soft: {
    name: 'Soft',
    type: 'round',
    hardness: 50,
    spacing: 15,
    angle: 0,
    roundness: 100,
    minSize: 10,
    texture: null
  },
  pencil: {
    name: 'Pencil',
    type: 'round',
    hardness: 90,
    spacing: 5,
    angle: 0,
    roundness: 100,
    minSize: 5,
    texture: 'noise'
  },
  marker: {
    name: 'Marker',
    type: 'square',
    hardness: 80,
    spacing: 20,
    angle: 0,
    roundness: 80,
    minSize: 50,
    texture: null
  },
  spray: {
    name: 'Spray',
    type: 'spray',
    hardness: 30,
    spacing: 40,
    angle: 0,
    roundness: 100,
    minSize: 10,
    texture: 'dots'
  },
  charcoal: {
    name: 'Charcoal',
    type: 'texture',
    hardness: 70,
    spacing: 25,
    angle: 0,
    roundness: 100,
    minSize: 20,
    texture: 'grain'
  }
};

class BrushManager {
  constructor(app) {
    this.app = app;
    this.currentBrush = 'round';
    this.brushes = { ...DEFAULT_BRUSHES };
    this.customBrushes = [];
    this.brushCanvas = null;
    this.brushCtx = null;
    this.lastDrawPoint = null;
    this.lastDrawTime = 0;
    
    this.loadCustomBrushes();
    this.initBrushCanvas();
    this.setupEventListeners();
  }
  
  initBrushCanvas() {
    // Create offscreen canvas for brush tip generation
    this.brushCanvas = document.createElement('canvas');
    this.brushCanvas.width = 100;
    this.brushCanvas.height = 100;
    this.brushCtx = this.brushCanvas.getContext('2d');
  }
  
  loadCustomBrushes() {
    const saved = localStorage.getItem('penpal-custom-brushes');
    if (saved) {
      try {
        this.customBrushes = JSON.parse(saved);
        // Add custom brushes to brush select
        this.customBrushes.forEach((brush, index) => {
          this.brushes[`custom_${index}`] = brush;
        });
      } catch (e) {
        console.log('Failed to load custom brushes:', e);
      }
    }
  }
  
  saveCustomBrushes() {
    localStorage.setItem('penpal-custom-brushes', JSON.stringify(this.customBrushes));
  }
  
  setupEventListeners() {
    // Brush select dropdown
    const brushSelect = document.getElementById('brushSelect');
    brushSelect.addEventListener('change', (e) => {
      this.setBrush(e.target.value);
    });
    
    // Custom brush button
    document.getElementById('customBrushBtn').addEventListener('click', () => {
      this.openBrushCreator();
    });
    
    // Brush creator modal
    const modal = document.getElementById('customBrushModal');
    document.getElementById('closeCustomBrush').addEventListener('click', () => {
      modal.classList.remove('active');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
    
    // Brush creator controls
    this.setupBrushCreatorControls();
    
    // Initial preview
    this.updateBrushPreview();
  }
  
  setupBrushCreatorControls() {
    // Type select
    document.getElementById('customBrushType').addEventListener('change', () => {
      this.updateBrushPreview();
    });
    
    // Sliders
    const sliders = ['brushHardness', 'brushSpacing', 'brushAngle', 'brushRoundness', 'minSize'];
    sliders.forEach(id => {
      const slider = document.getElementById(id);
      const valueSpan = document.getElementById(id.replace('brush', '').replace('min', 'minSize') + 'Value');
      slider.addEventListener('input', () => {
        valueSpan.textContent = slider.value;
        this.updateBrushPreview();
      });
    });
    
    // Texture buttons
    document.querySelectorAll('.texture-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.texture-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateBrushPreview();
      });
    });
    
    // Save button
    document.getElementById('saveCustomBrush').addEventListener('click', () => {
      this.saveNewBrush();
    });
    
    // Test button
    document.getElementById('testCustomBrush').addEventListener('click', () => {
      this.testBrush();
    });
  }
  
  openBrushCreator() {
    document.getElementById('customBrushModal').classList.add('active');
    this.renderCustomBrushesList();
    this.updateBrushPreview();
  }
  
  updateBrushPreview() {
    const preview = document.getElementById('brushPreview');
    const ctx = preview.getContext('2d');
    const type = document.getElementById('customBrushType').value;
    const hardness = parseInt(document.getElementById('brushHardness').value);
    const angle = parseInt(document.getElementById('brushAngle').value);
    const roundness = parseInt(document.getElementById('brushRoundness').value);
    
    // Clear preview
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 200, 200);
    
    // Draw brush tip
    ctx.save();
    ctx.translate(100, 100);
    ctx.rotate((angle * Math.PI) / 180);
    
    const radiusX = 40;
    const radiusY = 40 * (roundness / 100);
    
    // Create gradient for softness
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    const alpha = hardness / 100;
    
    if (type === 'round' || type === 'texture') {
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'square') {
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-radiusX, -radiusY, radiusX * 2, radiusY * 2);
    }
    
    // Add texture if selected
    const activeTexture = document.querySelector('.texture-btn.active');
    if (activeTexture && type === 'texture') {
      this.drawTexture(ctx, activeTexture.dataset.texture, radiusX, radiusY);
    }
    
    ctx.restore();
    
    // Draw label
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Brush Preview', 100, 190);
  }
  
  drawTexture(ctx, textureType, w, h) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    
    switch (textureType) {
      case 'noise':
        for (let i = 0; i < 100; i++) {
          const x = (Math.random() - 0.5) * w * 2;
          const y = (Math.random() - 0.5) * h * 2;
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.5})`;
          ctx.fillRect(x, y, 2, 2);
        }
        break;
      case 'grain':
        for (let i = 0; i < 200; i++) {
          const x = (Math.random() - 0.5) * w * 2;
          const y = (Math.random() - 0.5) * h * 2;
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
          ctx.fillRect(x, y, 1, 1);
        }
        break;
      case 'dots':
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let i = 0; i < 20; i++) {
          const x = (Math.random() - 0.5) * w * 2;
          const y = (Math.random() - 0.5) * h * 2;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'lines':
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
          const y = (Math.random() - 0.5) * h * 2;
          ctx.beginPath();
          ctx.moveTo(-w, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        break;
    }
    
    ctx.restore();
  }
  
  saveNewBrush() {
    const name = document.getElementById('customBrushName').value.trim();
    if (!name) {
      alert('Please enter a brush name');
      return;
    }
    
    const activeTexture = document.querySelector('.texture-btn.active');
    const brush = {
      name: name,
      type: document.getElementById('customBrushType').value,
      hardness: parseInt(document.getElementById('brushHardness').value),
      spacing: parseInt(document.getElementById('brushSpacing').value),
      angle: parseInt(document.getElementById('brushAngle').value),
      roundness: parseInt(document.getElementById('brushRoundness').value),
      minSize: parseInt(document.getElementById('minSize').value),
      texture: activeTexture ? activeTexture.dataset.texture : null,
      isCustom: true
    };
    
    this.customBrushes.push(brush);
    const brushId = `custom_${this.customBrushes.length - 1}`;
    this.brushes[brushId] = brush;
    
    this.saveCustomBrushes();
    this.addBrushToSelect(brushId, brush.name);
    this.renderCustomBrushesList();
    
    // Select the new brush
    this.setBrush(brushId);
    
    // Reset form
    document.getElementById('customBrushName').value = '';
    
    this.app.showNotification(`Brush "${name}" saved!`);
  }
  
  addBrushToSelect(id, name) {
    const select = document.getElementById('brushSelect');
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    option.className = 'custom-brush-option';
    select.appendChild(option);
  }
  
  renderCustomBrushesList() {
    const grid = document.getElementById('customBrushesGrid');
    grid.innerHTML = '';
    
    this.customBrushes.forEach((brush, index) => {
      const item = document.createElement('div');
      item.className = 'brush-item';
      if (this.currentBrush === `custom_${index}`) {
        item.classList.add('active');
      }
      
      // Create preview canvas
      const canvas = document.createElement('canvas');
      canvas.width = 60;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      
      // Draw mini preview
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, 60, 60);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(30, 30, 20, 0, Math.PI * 2);
      ctx.fill();
      
      const name = document.createElement('span');
      name.textContent = brush.name;
      
      item.appendChild(canvas);
      item.appendChild(name);
      
      item.addEventListener('click', () => {
        this.setBrush(`custom_${index}`);
        document.getElementById('customBrushModal').classList.remove('active');
      });
      
      grid.appendChild(item);
    });
    
    if (this.customBrushes.length === 0) {
      grid.innerHTML = '<p style="color: #666; grid-column: 1/-1; text-align: center;">No custom brushes yet. Create one above!</p>';
    }
  }
  
  setBrush(brushId) {
    if (!this.brushes[brushId]) {
      console.error('Brush not found:', brushId);
      return;
    }
    
    this.currentBrush = brushId;
    document.getElementById('brushSelect').value = brushId;
    
    const brush = this.brushes[brushId];
    this.app.showNotification(`Brush: ${brush.name}`);
  }
  
  testBrush() {
    // Close modal and let user test on main canvas
    document.getElementById('customBrushModal').classList.remove('active');
    this.app.showNotification('Test your brush on the canvas!');
  }
  
  getCurrentBrush() {
    return this.brushes[this.currentBrush] || this.brushes.round;
  }
  
  // Main drawing method - called by DrawingApp
  draw(ctx, x, y, pressure, size, color, opacity) {
    const brush = this.getCurrentBrush();
    const brushSize = size * (brush.minSize / 100 + pressure * (1 - brush.minSize / 100));
    const halfSize = brushSize / 2;
    
    ctx.globalAlpha = opacity;
    
    switch (brush.type) {
      case 'round':
        this.drawRoundBrush(ctx, x, y, halfSize, color, brush.hardness);
        break;
      case 'square':
        this.drawSquareBrush(ctx, x, y, halfSize, color, brush.hardness);
        break;
      case 'spray':
        this.drawSprayBrush(ctx, x, y, halfSize, color);
        break;
      case 'texture':
        this.drawTextureBrush(ctx, x, y, halfSize, color, brush.texture);
        break;
      default:
        this.drawRoundBrush(ctx, x, y, halfSize, color, brush.hardness);
    }
    
    ctx.globalAlpha = 1;
  }
  
  drawRoundBrush(ctx, x, y, radius, color, hardness) {
    if (hardness >= 90) {
      // Hard edge
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Soft edge with gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(hardness / 100, color);
      gradient.addColorStop(1, color.replace(/[^,]+\)/, '0)'));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawSquareBrush(ctx, x, y, halfSize, color, hardness) {
    if (hardness >= 90) {
      ctx.fillStyle = color;
      ctx.fillRect(x - halfSize, y - halfSize, halfSize * 2, halfSize * 2);
    } else {
      // Soft square using shadow
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = (100 - hardness) / 5;
      ctx.fillStyle = color;
      ctx.fillRect(x - halfSize, y - halfSize, halfSize * 2, halfSize * 2);
      ctx.restore();
    }
  }
  
  drawSprayBrush(ctx, x, y, radius, color) {
    const particleCount = Math.max(10, Math.floor(radius * 2));
    ctx.fillStyle = color;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      const size = Math.random() * 2 + 0.5;
      
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawTextureBrush(ctx, x, y, radius, color, textureType) {
    // Draw base circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add texture
    if (textureType) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.translate(x, y);
      
      switch (textureType) {
        case 'noise':
          for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
            ctx.fillRect(Math.cos(angle) * dist, Math.sin(angle) * dist, 2, 2);
          }
          break;
        case 'grain':
          for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
            ctx.fillRect(Math.cos(angle) * dist, Math.sin(angle) * dist, 1, 1);
          }
          break;
      }
      
      ctx.restore();
    }
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
    
    // Initialize managers
    this.shortcutManager = new ShortcutManager(this);
    this.brushManager = new BrushManager(this);
    
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
    
    // Use brush manager for drawing
    const size = this.usePressure 
      ? this.brushSize * (0.2 + pressure * 0.8) 
      : this.brushSize;
    
    this.brushManager.draw(this.ctx, x, y, pressure, size, this.hexToRgba(this.color, this.opacity), this.opacity);
    
    // Store last draw point for spacing calculations
    this.brushManager.lastDrawPoint = { x, y };
    this.brushManager.lastDrawTime = Date.now();
  }
  
  draw(x, y, pressure) {
    const size = this.usePressure 
      ? this.brushSize * (0.2 + pressure * 0.8) 
      : this.brushSize;
    
    const brush = this.brushManager.getCurrentBrush();
    const spacing = (brush.spacing / 100) * size;
    
    // Interpolate points based on brush spacing
    if (this.brushManager.lastDrawPoint) {
      const lastX = this.brushManager.lastDrawPoint.x;
      const lastY = this.brushManager.lastDrawPoint.y;
      const dist = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
      
      if (dist >= spacing) {
        const steps = Math.floor(dist / spacing);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const ix = lastX + (x - lastX) * t;
          const iy = lastY + (y - lastY) * t;
          this.brushManager.draw(this.ctx, ix, iy, pressure, size, this.hexToRgba(this.color, this.opacity), this.opacity);
        }
        this.brushManager.lastDrawPoint = { x, y };
      }
    }
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
        // Use brush manager for redrawing
        let lastPoint = null;
        
        for (const point of stroke.points) {
          const baseSize = stroke.isEraser ? stroke.size / 2 : stroke.size;
          const size = stroke.usePressure 
            ? baseSize * (0.2 + point.pressure * 0.8) 
            : baseSize;
          
          const color = this.hexToRgba(stroke.color, stroke.opacity);
          
          if (lastPoint) {
            const brush = this.brushManager.getCurrentBrush();
            const spacing = (brush.spacing / 100) * size;
            const dist = Math.sqrt((point.x - lastPoint.x) ** 2 + (point.y - lastPoint.y) ** 2);
            
            if (dist >= spacing || !lastPoint) {
              this.brushManager.draw(this.ctx, point.x, point.y, point.pressure, size, color, stroke.opacity);
              lastPoint = point;
            }
          } else {
            this.brushManager.draw(this.ctx, point.x, point.y, point.pressure, size, color, stroke.opacity);
            lastPoint = point;
          }
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
