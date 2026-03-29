// PenPal Draw - Main Drawing Application

// Layer Manager Class
class LayerManager {
  constructor(app) {
    this.app = app;
    this.layers = [];
    this.activeLayerId = null;
    this.nextLayerId = 1;
    this.layerCanvases = new Map();
    
    this.init();
  }
  
  init() {
    // Create background layer (always white, locked)
    this.addLayer('Background', true);
    // Create first drawing layer
    this.addLayer('Layer 1', false);
    
    this.setupEventListeners();
    this.renderLayersList();
  }
  
  setupEventListeners() {
    document.getElementById('addLayerBtn').addEventListener('click', () => {
      this.addLayer();
    });
    
    document.getElementById('deleteLayerBtn').addEventListener('click', () => {
      this.deleteActiveLayer();
    });
    
    document.getElementById('mergeLayerBtn').addEventListener('click', () => {
      this.mergeDown();
    });
    
    document.getElementById('layerOpacity').addEventListener('input', (e) => {
      const layer = this.getActiveLayer();
      if (layer) {
        layer.opacity = parseInt(e.target.value) / 100;
        document.getElementById('layerOpacityValue').textContent = e.target.value + '%';
        this.app.renderAllLayers();
      }
    });
  }
  
  addLayer(name = null, isBackground = false) {
    const id = this.nextLayerId++;
    const layerName = name || `Layer ${this.layers.filter(l => !l.isBackground).length + 1}`;
    
    // Create canvas for this layer
    const canvas = document.createElement('canvas');
    canvas.width = this.app.canvas.width;
    canvas.height = this.app.canvas.height;
    const ctx = canvas.getContext('2d');
    
    // Fill background layer with white
    if (isBackground) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    this.layerCanvases.set(id, { canvas, ctx });
    
    const layer = {
      id,
      name: layerName,
      visible: true,
      opacity: 1,
      isBackground,
      blendMode: 'normal'
    };
    
    // Insert above current active layer, or at end if no active
    if (this.activeLayerId && !isBackground) {
      const activeIndex = this.layers.findIndex(l => l.id === this.activeLayerId);
      this.layers.splice(activeIndex + 1, 0, layer);
    } else {
      this.layers.push(layer);
    }
    
    if (!isBackground) {
      this.setActiveLayer(id);
    }
    
    this.renderLayersList();
    this.app.renderAllLayers();
    
    return layer;
  }
  
  deleteActiveLayer() {
    const layer = this.getActiveLayer();
    if (!layer || layer.isBackground) {
      this.app.showNotification('Cannot delete background layer');
      return;
    }
    
    const index = this.layers.findIndex(l => l.id === layer.id);
    this.layerCanvases.delete(layer.id);
    this.layers.splice(index, 1);
    
    // Set new active layer
    const newActive = this.layers[Math.max(0, index - 1)];
    this.setActiveLayer(newActive.id);
    
    this.renderLayersList();
    this.app.renderAllLayers();
  }
  
  mergeDown() {
    const layer = this.getActiveLayer();
    if (!layer || layer.isBackground) {
      this.app.showNotification('Cannot merge background layer');
      return;
    }
    
    const index = this.layers.findIndex(l => l.id === layer.id);
    if (index === 0) {
      this.app.showNotification('Nothing to merge with');
      return;
    }
    
    const belowLayer = this.layers[index - 1];
    const belowCanvas = this.layerCanvases.get(belowLayer.id);
    const currentCanvas = this.layerCanvases.get(layer.id);
    
    // Draw current layer onto below layer with opacity
    belowCanvas.ctx.save();
    belowCanvas.ctx.globalAlpha = layer.opacity;
    belowCanvas.ctx.drawImage(currentCanvas.canvas, 0, 0);
    belowCanvas.ctx.restore();
    
    // Delete current layer
    this.layerCanvases.delete(layer.id);
    this.layers.splice(index, 1);
    
    // Set active to the merged layer
    this.setActiveLayer(belowLayer.id);
    
    this.renderLayersList();
    this.app.renderAllLayers();
    this.app.showNotification('Layers merged');
  }
  
  setActiveLayer(id) {
    this.activeLayerId = id;
    this.renderLayersList();
    
    // Update opacity slider
    const layer = this.getActiveLayer();
    if (layer) {
      document.getElementById('layerOpacity').value = Math.round(layer.opacity * 100);
      document.getElementById('layerOpacityValue').textContent = Math.round(layer.opacity * 100) + '%';
    }
  }
  
  getActiveLayer() {
    return this.layers.find(l => l.id === this.activeLayerId);
  }
  
  getActiveContext() {
    const entry = this.layerCanvases.get(this.activeLayerId);
    return entry ? entry.ctx : null;
  }
  
  toggleVisibility(id, event) {
    event.stopPropagation();
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      layer.visible = !layer.visible;
      this.renderLayersList();
      this.app.renderAllLayers();
    }
  }
  
  moveLayer(fromIndex, toIndex) {
    const layer = this.layers.splice(fromIndex, 1)[0];
    this.layers.splice(toIndex, 0, layer);
    this.renderLayersList();
    this.app.renderAllLayers();
  }
  
  renderLayersList() {
    const list = document.getElementById('layersList');
    list.innerHTML = '';
    
    // Show layers in reverse order (top to bottom)
    [...this.layers].reverse().forEach((layer, reversedIndex) => {
      const index = this.layers.length - 1 - reversedIndex;
      const isActive = layer.id === this.activeLayerId;
      
      const item = document.createElement('div');
      item.className = 'layer-item' + (isActive ? ' active' : '');
      item.draggable = !layer.isBackground;
      item.dataset.index = index;
      item.dataset.id = layer.id;
      
      // Visibility toggle
      const visibility = document.createElement('span');
      visibility.className = 'layer-visibility' + (layer.visible ? '' : ' hidden');
      visibility.innerHTML = layer.visible ? '👁️' : '🙈';
      visibility.title = layer.visible ? 'Hide layer' : 'Show layer';
      visibility.addEventListener('click', (e) => this.toggleVisibility(layer.id, e));
      
      // Thumbnail
      const thumb = document.createElement('canvas');
      thumb.className = 'layer-thumbnail';
      thumb.width = 32;
      thumb.height = 32;
      const thumbCtx = thumb.getContext('2d');
      const layerCanvas = this.layerCanvases.get(layer.id).canvas;
      thumbCtx.drawImage(layerCanvas, 0, 0, 32, 32);
      
      // Info
      const info = document.createElement('div');
      info.className = 'layer-info';
      
      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = layer.name;
      name.title = 'Double-click to rename';
      name.addEventListener('dblclick', (e) => this.startRename(layer.id, e));
      
      const type = document.createElement('span');
      type.className = 'layer-type';
      type.textContent = layer.isBackground ? 'Background' : `${Math.round(layer.opacity * 100)}% opacity`;
      
      info.appendChild(name);
      info.appendChild(type);
      
      item.appendChild(visibility);
      item.appendChild(thumb);
      item.appendChild(info);
      
      // Click to select
      item.addEventListener('click', () => this.setActiveLayer(layer.id));
      
      // Drag and drop
      if (!layer.isBackground) {
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', index);
          item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          document.querySelectorAll('.layer-item').forEach(li => li.classList.remove('drag-over'));
        });
        
        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (!item.classList.contains('dragging')) {
            item.classList.add('drag-over');
          }
        });
        
        item.addEventListener('dragleave', () => {
          item.classList.remove('drag-over');
        });
        
        item.addEventListener('drop', (e) => {
          e.preventDefault();
          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
          const toIndex = index;
          if (fromIndex !== toIndex && !isNaN(fromIndex)) {
            this.moveLayer(fromIndex, toIndex);
          }
        });
      }
      
      list.appendChild(item);
    });
    
    // Update button states
    const activeLayer = this.getActiveLayer();
    document.getElementById('deleteLayerBtn').disabled = !activeLayer || activeLayer.isBackground;
    document.getElementById('mergeLayerBtn').disabled = !activeLayer || activeLayer.isBackground || 
      this.layers.indexOf(activeLayer) === 0;
  }
  
  startRename(id, event) {
    const layer = this.layers.find(l => l.id === id);
    if (!layer || layer.isBackground) return;
    
    const nameSpan = event.target;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = layer.name;
    input.className = 'layer-name editing';
    
    const finishRename = () => {
      const newName = input.value.trim();
      if (newName) {
        layer.name = newName;
      }
      this.renderLayersList();
    };
    
    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        finishRename();
      } else if (e.key === 'Escape') {
        this.renderLayersList();
      }
    });
    
    nameSpan.replaceWith(input);
    input.focus();
    input.select();
  }
  
  resizeAllLayers(width, height) {
    this.layerCanvases.forEach(({ canvas, ctx }, id) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
      
      canvas.width = width;
      canvas.height = height;
      
      const layer = this.layers.find(l => l.id === id);
      if (layer && layer.isBackground) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(tempCanvas, 0, 0);
    });
  }
  
  loadImageToNewLayer(image) {
    // Create a new layer for the image
    const layer = this.addLayer('Image');
    const { ctx } = this.layerCanvases.get(layer.id);
    
    // Calculate scaling to fit canvas while maintaining aspect ratio
    const scale = Math.min(
      this.app.canvas.width / image.width,
      this.app.canvas.height / image.height,
      1
    );
    
    const x = (this.app.canvas.width - image.width * scale) / 2;
    const y = (this.app.canvas.height - image.height * scale) / 2;
    
    ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
    
    this.renderLayersList();
    this.app.renderAllLayers();
  }
}

// Shortcut Keys Configuration
const DEFAULT_SHORTCUTS = [
  { key: 'K1', action: 'brush_medium', binding: '' },
  { key: 'K2', action: 'brush_large', binding: '' },
  { key: 'K3', action: 'color_black', binding: '' },
  { key: 'K4', action: 'color_white', binding: '' },
  { key: 'K5', action: 'undo', binding: '' },
  { key: 'K6', action: 'eraser', binding: '' },
  { key: 'K7', action: 'clear', binding: '' },
  { key: 'K8', action: 'load', binding: '' }
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
        this.app.toolManager.setTool('brush_round');
        break;
      case 'brush_soft':
        this.app.toolManager.setTool('brush_soft');
        break;
      case 'brush_pencil':
        this.app.toolManager.setTool('brush_pencil');
        break;
      case 'brush_marker':
        this.app.toolManager.setTool('brush_marker');
        break;
      case 'brush_spray':
        this.app.toolManager.setTool('brush_spray');
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
      case 'load':
        this.app.loadImage();
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

// Tool & Brush System
const DEFAULT_TOOLS = {
  // Brushes
  brush_round: {
    name: 'Round Brush',
    category: 'brush',
    type: 'round',
    hardness: 100,
    spacing: 10,
    angle: 0,
    roundness: 100,
    minSize: 10,
    texture: null
  },
  brush_square: {
    name: 'Square Brush',
    category: 'brush',
    type: 'square',
    hardness: 100,
    spacing: 10,
    angle: 0,
    roundness: 100,
    minSize: 10,
    texture: null
  },
  brush_soft: {
    name: 'Soft Brush',
    category: 'brush',
    type: 'round',
    hardness: 50,
    spacing: 15,
    angle: 0,
    roundness: 100,
    minSize: 10,
    texture: null
  },
  brush_pencil: {
    name: 'Pencil',
    category: 'brush',
    type: 'round',
    hardness: 90,
    spacing: 5,
    angle: 0,
    roundness: 100,
    minSize: 5,
    texture: 'noise'
  },
  brush_marker: {
    name: 'Marker',
    category: 'brush',
    type: 'square',
    hardness: 80,
    spacing: 20,
    angle: 0,
    roundness: 80,
    minSize: 50,
    texture: null
  },
  brush_spray: {
    name: 'Spray',
    category: 'brush',
    type: 'spray',
    hardness: 30,
    spacing: 40,
    angle: 0,
    roundness: 100,
    minSize: 10,
    texture: 'dots'
  },
  brush_charcoal: {
    name: 'Charcoal',
    category: 'brush',
    type: 'texture',
    hardness: 70,
    spacing: 25,
    angle: 0,
    roundness: 100,
    minSize: 20,
    texture: 'grain'
  },
  // Tools
  eraser: {
    name: 'Eraser',
    category: 'tool',
    type: 'eraser',
    mode: 'pixel', // pixel, brush, block
    hardness: 100,
    spacing: 5,
    minSize: 10
  },
  smudge: {
    name: 'Smudge',
    category: 'tool',
    type: 'smudge',
    strength: 50,
    spacing: 5,
    minSize: 10
  },
  blur: {
    name: 'Blur',
    category: 'tool',
    type: 'blur',
    strength: 50,
    spacing: 10,
    minSize: 10
  },
  dodge: {
    name: 'Dodge',
    category: 'tool',
    type: 'dodge',
    exposure: 50,
    spacing: 10,
    minSize: 10
  },
  burn: {
    name: 'Burn',
    category: 'tool',
    type: 'burn',
    exposure: 50,
    spacing: 10,
    minSize: 10
  }
};

// Blend modes for compositing
const BLEND_MODES = {
  normal: (base, blend) => blend,
  multiply: (base, blend) => base * blend / 255,
  screen: (base, blend) => 255 - (255 - base) * (255 - blend) / 255,
  overlay: (base, blend) => base < 128 ? 2 * base * blend / 255 : 255 - 2 * (255 - base) * (255 - blend) / 255,
  'soft-light': (base, blend) => blend < 128 ? 2 * base * blend / 255 + base * base / 255 * (1 - 2 * blend / 255) : 2 * base * (1 - blend / 255) + Math.sqrt(base / 255) * (2 * blend - 255),
  'hard-light': (base, blend) => blend < 128 ? 2 * base * blend / 255 : 255 - 2 * (255 - base) * (255 - blend) / 255,
  'color-dodge': (base, blend) => blend === 255 ? 255 : Math.min(255, base * 255 / (255 - blend)),
  'color-burn': (base, blend) => blend === 0 ? 0 : 255 - Math.min(255, (255 - base) * 255 / blend),
  difference: (base, blend) => Math.abs(base - blend),
  exclusion: (base, blend) => base + blend - 2 * base * blend / 255
};

class ToolManager {
  constructor(app) {
    this.app = app;
    this.currentTool = 'brush_round';
    this.tools = { ...DEFAULT_TOOLS };
    this.customBrushes = [];
    this.toolCanvas = null;
    this.toolCtx = null;
    this.lastDrawPoint = null;
    this.lastDrawTime = 0;
    this.blendMode = 'normal';
    this.eraserMode = 'pixel';
    this.smudgeStrength = 50;
    
    // For smudge/blur - store sampled pixels
    this.sampleBuffer = null;
    this.sampleRadius = 0;
    
    this.loadCustomBrushes();
    this.initToolCanvas();
    this.setupEventListeners();
  }
  
  initToolCanvas() {
    // Create offscreen canvas for tool tip generation
    this.toolCanvas = document.createElement('canvas');
    this.toolCanvas.width = 100;
    this.toolCanvas.height = 100;
    this.toolCtx = this.toolCanvas.getContext('2d');
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
    // Tool select dropdown
    const toolSelect = document.getElementById('toolSelect');
    toolSelect.addEventListener('change', (e) => {
      this.setTool(e.target.value);
    });
    
    // Blend mode select
    const blendSelect = document.getElementById('blendMode');
    blendSelect.addEventListener('change', (e) => {
      this.blendMode = e.target.value;
      this.app.showNotification(`Blend: ${e.target.options[e.target.selectedIndex].text}`);
    });
    
    // Eraser mode select
    const eraserModeSelect = document.getElementById('eraserMode');
    if (eraserModeSelect) {
      eraserModeSelect.addEventListener('change', (e) => {
        this.eraserMode = e.target.value;
      });
    }
    
    // Smudge strength slider
    const smudgeStrength = document.getElementById('smudgeStrength');
    if (smudgeStrength) {
      smudgeStrength.addEventListener('input', (e) => {
        this.smudgeStrength = parseInt(e.target.value);
        document.getElementById('smudgeStrengthValue').textContent = e.target.value + '%';
      });
    }
    
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
    const sliderMap = {
      'brushHardness': 'hardnessValue',
      'brushSpacing': 'spacingValue',
      'brushAngle': 'angleValue',
      'brushRoundness': 'roundnessValue',
      'minSize': 'minSizeValue'
    };
    
    Object.entries(sliderMap).forEach(([sliderId, valueId]) => {
      const slider = document.getElementById(sliderId);
      const valueSpan = document.getElementById(valueId);
      if (slider && valueSpan) {
        slider.addEventListener('input', () => {
          valueSpan.textContent = slider.value;
          this.updateBrushPreview();
        });
      }
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
    
    // Clear preview with dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 200, 200);
    
    // Draw grid pattern for reference
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 200; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 200);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(200, i);
      ctx.stroke();
    }
    
    // Draw center crosshair
    ctx.strokeStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(100, 90);
    ctx.lineTo(100, 110);
    ctx.moveTo(90, 100);
    ctx.lineTo(110, 100);
    ctx.stroke();
    
    // Draw brush tip
    ctx.save();
    ctx.translate(100, 100);
    ctx.rotate((angle * Math.PI) / 180);
    
    const radiusX = 50; // Slightly larger for better visibility
    const radiusY = 50 * (roundness / 100);
    
    // Create gradient for softness
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    
    if (type === 'round' || type === 'texture') {
      // For round brush, use gradient based on hardness
      const innerAlpha = Math.max(0.3, hardness / 100);
      gradient.addColorStop(0, `rgba(100, 200, 255, ${innerAlpha})`);
      gradient.addColorStop(hardness / 100, `rgba(100, 200, 255, ${innerAlpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw outline
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + (hardness/200)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (type === 'square') {
      // For square brush
      gradient.addColorStop(0, `rgba(100, 200, 255, ${Math.max(0.3, hardness / 100)})`);
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-radiusX, -radiusY, radiusX * 2, radiusY * 2);
      
      // Draw outline
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + (hardness/200)})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(-radiusX, -radiusY, radiusX * 2, radiusY * 2);
    }
    
    // Add texture if selected
    const activeTexture = document.querySelector('.texture-btn.active');
    if (activeTexture && type === 'texture') {
      this.drawTexture(ctx, activeTexture.dataset.texture, radiusX, radiusY);
    }
    
    ctx.restore();
    
    // Draw label with current settings
    ctx.fillStyle = '#aaa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${type} | H:${hardness} | R:${roundness} | A:${angle}°`, 100, 185);
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
    let name = document.getElementById('customBrushName').value.trim();
    
    // Validate and sanitize brush name
    if (!name) {
      alert('Please enter a brush name');
      return;
    }
    
    // Sanitize: remove HTML tags, limit length
    name = name.replace(/<[^>]*>/g, '').substring(0, 20).trim();
    
    if (!name) {
      alert('Please enter a valid brush name (no HTML tags)');
      return;
    }
    
    const activeTexture = document.querySelector('.texture-btn.active');
    const brush = {
      name: name,
      category: 'brush',
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
    this.tools[brushId] = brush;
    
    this.saveCustomBrushes();
    this.addBrushToSelect(brushId, brush.name);
    this.renderCustomBrushesList();
    
    // Select the new brush
    this.setTool(brushId);
    
    // Reset form
    document.getElementById('customBrushName').value = '';
    
    this.app.showNotification(`Brush "${name}" saved!`);
  }
  
  addBrushToSelect(id, name) {
    const select = document.getElementById('toolSelect');
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    option.className = 'custom-brush-option';
    // Add to Custom optgroup
    const optgroup = select.querySelector('optgroup[label="Custom"]');
    if (optgroup) {
      optgroup.appendChild(option);
    } else {
      select.appendChild(option);
    }
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
        this.setTool(`custom_${index}`);
        document.getElementById('customBrushModal').classList.remove('active');
      });
      
      grid.appendChild(item);
    });
    
    if (this.customBrushes.length === 0) {
      grid.innerHTML = '<p style="color: #666; grid-column: 1/-1; text-align: center;">No custom brushes yet. Create one above!</p>';
    }
  }
  
  setTool(toolId) {
    if (!this.tools[toolId]) {
      console.error('Tool not found:', toolId);
      return;
    }
    
    this.currentTool = toolId;
    document.getElementById('toolSelect').value = toolId;
    
    const tool = this.tools[toolId];
    
    // Show/hide tool-specific UI
    const eraserSection = document.getElementById('eraserModeSection');
    const smudgeSection = document.getElementById('smudgeStrengthSection');
    const blendSection = document.getElementById('blendModeSection');
    
    if (eraserSection) {
      eraserSection.style.display = tool.type === 'eraser' ? 'flex' : 'none';
    }
    if (smudgeSection) {
      smudgeSection.style.display = (tool.type === 'smudge' || tool.type === 'blur') ? 'flex' : 'none';
    }
    if (blendSection) {
      blendSection.style.display = tool.category === 'brush' ? 'flex' : 'none';
    }
    
    // Reset smudge buffer when switching tools
    if (tool.type !== 'smudge') {
      this.sampleBuffer = null;
    }
    
    this.app.showNotification(`Tool: ${tool.name}`);
  }
  
  testBrush() {
    // Close modal and let user test on main canvas
    document.getElementById('customBrushModal').classList.remove('active');
    this.app.showNotification('Test your brush on the canvas!');
  }
  
  getCurrentTool() {
    return this.tools[this.currentTool] || this.tools.brush_round;
  }
  
  // Main drawing method - called by DrawingApp
  draw(ctx, x, y, pressure, size, color, opacity) {
    const tool = this.getCurrentTool();
    const toolSize = size * (tool.minSize / 100 + pressure * (1 - tool.minSize / 100));
    const halfSize = toolSize / 2;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Handle different tool categories
    if (tool.category === 'brush') {
      this.drawBrush(ctx, x, y, halfSize, color, tool, opacity);
    } else if (tool.category === 'tool') {
      this.drawTool(ctx, x, y, halfSize, tool, pressure, opacity);
    }
    
    ctx.restore();
  }
  
  drawBrush(ctx, x, y, radius, color, tool, opacity) {
    switch (tool.type) {
      case 'round':
        this.drawRoundBrush(ctx, x, y, radius, color, tool.hardness);
        break;
      case 'square':
        this.drawSquareBrush(ctx, x, y, radius, color, tool.hardness);
        break;
      case 'spray':
        this.drawSprayBrush(ctx, x, y, radius, color);
        break;
      case 'texture':
        this.drawTextureBrush(ctx, x, y, radius, color, tool.texture);
        break;
      default:
        this.drawRoundBrush(ctx, x, y, radius, color, tool.hardness);
    }
  }
  
  drawTool(ctx, x, y, radius, tool, pressure, opacity) {
    switch (tool.type) {
      case 'eraser':
        this.drawEraser(ctx, x, y, radius, tool);
        break;
      case 'smudge':
        this.drawSmudge(ctx, x, y, radius, tool, pressure);
        break;
      case 'blur':
        this.drawBlur(ctx, x, y, radius, tool);
        break;
      case 'dodge':
        this.drawDodgeBurn(ctx, x, y, radius, tool, true);
        break;
      case 'burn':
        this.drawDodgeBurn(ctx, x, y, radius, tool, false);
        break;
    }
  }
  
  drawEraser(ctx, x, y, radius, tool) {
    const mode = document.getElementById('eraserMode')?.value || 'pixel';
    
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    
    if (mode === 'pixel' || mode === 'brush') {
      const hardness = mode === 'pixel' ? 100 : tool.hardness;
      this.drawRoundBrush(ctx, x, y, radius, 'rgba(0,0,0,1)', hardness);
    } else if (mode === 'block') {
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    
    ctx.restore();
  }
  
  drawSmudge(ctx, x, y, radius, tool, pressure) {
    const strength = this.smudgeStrength / 100;
    
    // Get pixel data under the brush from the main canvas (which has all layers rendered)
    const diameter = Math.ceil(radius * 2);
    const sx = Math.max(0, Math.floor(x - radius));
    const sy = Math.max(0, Math.floor(y - radius));
    const sw = Math.min(diameter, this.app.canvas.width - sx);
    const sh = Math.min(diameter, this.app.canvas.height - sy);
    
    if (sw <= 0 || sh <= 0) return;
    
    try {
      // First render all layers to get current state
      this.app.renderAllLayers();
      
      // Get current pixels from main canvas
      const imageData = this.app.ctx.getImageData(sx, sy, sw, sh);
      const data = imageData.data;
      
      // Create smudged version by averaging with previous position
      if (this.sampleBuffer && this.lastDrawPoint) {
        const blendFactor = strength * pressure;
        
        for (let i = 0; i < data.length; i += 4) {
          if (this.sampleBuffer[i + 3] > 0) { // If sampled pixel is not transparent
            data[i] = data[i] * (1 - blendFactor) + this.sampleBuffer[i] * blendFactor;
            data[i + 1] = data[i + 1] * (1 - blendFactor) + this.sampleBuffer[i + 1] * blendFactor;
            data[i + 2] = data[i + 2] * (1 - blendFactor) + this.sampleBuffer[i + 2] * blendFactor;
          }
        }
        
        // Put modified pixels to the active layer context
        ctx.putImageData(imageData, sx, sy);
      }
      
      // Store current pixels for next smudge
      this.sampleBuffer = new Uint8ClampedArray(data);
      this.sampleRadius = radius;
      
    } catch (e) {
      console.log('Smudge error:', e);
    }
  }
  
  drawBlur(ctx, x, y, radius, tool) {
    const blurAmount = Math.ceil(radius / 4);
    
    // First render all layers to get current state
    this.app.renderAllLayers();
    const sx = Math.max(0, Math.floor(x - radius));
    const sy = Math.max(0, Math.floor(y - radius));
    const sw = Math.ceil(radius * 2);
    const sh = Math.ceil(radius * 2);
    
    if (sw <= 0 || sh <= 0) return;
    
    try {
      // Simple box blur
      const imageData = this.app.ctx.getImageData(sx, sy, sw, sh);
      const data = imageData.data;
      const output = new Uint8ClampedArray(data);
      
      for (let by = 0; by < sh; by++) {
        for (let bx = 0; bx < sw; bx++) {
          const px = sx + bx;
          const py = sy + by;
          const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
          
          if (dist > radius) continue;
          
          let r = 0, g = 0, b = 0, a = 0, count = 0;
          
          // Sample surrounding pixels
          for (let dy = -blurAmount; dy <= blurAmount; dy++) {
            for (let dx = -blurAmount; dx <= blurAmount; dx++) {
              const ny = by + dy;
              const nx = bx + dx;
              if (ny >= 0 && ny < sh && nx >= 0 && nx < sw) {
                const idx = (ny * sw + nx) * 4;
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                a += data[idx + 3];
                count++;
              }
            }
          }
          
          const idx = (by * sw + bx) * 4;
          output[idx] = r / count;
          output[idx + 1] = g / count;
          output[idx + 2] = b / count;
          output[idx + 3] = a / count;
        }
      }
      
      ctx.putImageData(new ImageData(output, sw, sh), sx, sy);
    } catch (e) {
      console.log('Blur error:', e);
    }
  }
  
  drawDodgeBurn(ctx, x, y, radius, tool, isDodge) {
    const exposure = (tool.exposure || 50) / 100;
    
    // First render all layers to get current state
    this.app.renderAllLayers();
    const sx = Math.max(0, Math.floor(x - radius));
    const sy = Math.max(0, Math.floor(y - radius));
    const sw = Math.ceil(radius * 2);
    const sh = Math.ceil(radius * 2);
    
    if (sw <= 0 || sh <= 0) return;
    
    try {
      const imageData = this.app.ctx.getImageData(sx, sy, sw, sh);
      const data = imageData.data;
      
      for (let by = 0; by < sh; by++) {
        for (let bx = 0; bx < sw; bx++) {
          const px = sx + bx;
          const py = sy + by;
          const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
          
          if (dist > radius) continue;
          
          const idx = (by * sw + bx) * 4;
          let intensity = 1 - (dist / radius); // Stronger in center
          intensity *= exposure * 0.3;
          
          if (isDodge) {
            // Lighten
            data[idx] = Math.min(255, data[idx] + (255 - data[idx]) * intensity);
            data[idx + 1] = Math.min(255, data[idx + 1] + (255 - data[idx + 1]) * intensity);
            data[idx + 2] = Math.min(255, data[idx + 2] + (255 - data[idx + 2]) * intensity);
          } else {
            // Darken
            data[idx] = Math.max(0, data[idx] * (1 - intensity));
            data[idx + 1] = Math.max(0, data[idx + 1] * (1 - intensity));
            data[idx + 2] = Math.max(0, data[idx + 2] * (1 - intensity));
          }
        }
      }
      
      ctx.putImageData(imageData, sx, sy);
    } catch (e) {
      console.log('Dodge/Burn error:', e);
    }
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
    this.pendingUndoEntry = null;
    
    // Memory management limits
    this.MAX_STROKES = 50; // Limit undo history (each entry has 2 snapshots)
    
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
    this.toolManager = new ToolManager(this);
    this.layerManager = null; // Will be initialized after canvas setup
    
    this.init();
  }
  
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupToolbar();
    this.loadMonitors();
    
    // Initialize layer manager after canvas setup
    this.layerManager = new LayerManager(this);
    
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
    
    // Save current canvas content if this is first resize
    if (this.canvas.width > 0 && this.canvas.height > 0 && !this.layerManager) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(this.canvas, 0, 0);
    }
    
    // Resize main canvas
    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;
    
    // Resize all layer canvases
    if (this.layerManager) {
      this.layerManager.resizeAllLayers(containerWidth, containerHeight);
    }
    
    // Restore brush settings (reset by resize)
    this.updateBrushSettings();
    
    // Re-render all layers
    this.renderAllLayers();
    
    console.log('Canvas resized to:', containerWidth, 'x', containerHeight);
  }
  
  // Render all visible layers to the main canvas
  renderAllLayers() {
    // Clear main canvas
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (!this.layerManager) return;
    
    // Draw each visible layer from bottom to top
    this.layerManager.layers.forEach(layer => {
      if (!layer.visible) return;
      
      const layerData = this.layerManager.layerCanvases.get(layer.id);
      if (layerData) {
        this.ctx.save();
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.drawImage(layerData.canvas, 0, 0);
        this.ctx.restore();
      }
    });
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
    
    // Save layer state for undo BEFORE drawing
    this.saveLayerStateForUndo();
    
    this.updatePressureIndicator(pressure);
    this.startStroke(x, y, pressure);
    
    console.log('Pointer down:', e.pointerType, 'at', x, y, 'pressure:', pressure);
  }
  
  saveLayerStateForUndo() {
    const activeLayer = this.layerManager.getActiveLayer();
    if (!activeLayer) return;
    
    const layerData = this.layerManager.layerCanvases.get(activeLayer.id);
    if (!layerData) return;
    
    // Save a snapshot of the active layer's canvas (BEFORE state)
    const beforeSnapshot = document.createElement('canvas');
    beforeSnapshot.width = layerData.canvas.width;
    beforeSnapshot.height = layerData.canvas.height;
    const beforeCtx = beforeSnapshot.getContext('2d');
    beforeCtx.drawImage(layerData.canvas, 0, 0);
    
    // Create the undo entry - after state will be filled when stroke ends
    const undoEntry = {
      type: 'layer_snapshot',
      layerId: activeLayer.id,
      beforeSnapshot: beforeSnapshot,
      afterSnapshot: null  // Will be captured when stroke ends
    };
    
    // Store reference to capture after state later
    this.pendingUndoEntry = undoEntry;
    
    // Push to undo stack
    this.strokes.push(undoEntry);
    
    // Manage memory
    this.manageStrokeHistory();
  }
  
  finalizeUndoEntry() {
    if (!this.pendingUndoEntry) return;
    
    const activeLayer = this.layerManager.getActiveLayer();
    if (!activeLayer) {
      this.pendingUndoEntry = null;
      return;
    }
    
    const layerData = this.layerManager.layerCanvases.get(activeLayer.id);
    if (!layerData) {
      this.pendingUndoEntry = null;
      return;
    }
    
    // Save the AFTER state
    const afterSnapshot = document.createElement('canvas');
    afterSnapshot.width = layerData.canvas.width;
    afterSnapshot.height = layerData.canvas.height;
    const afterCtx = afterSnapshot.getContext('2d');
    afterCtx.drawImage(layerData.canvas, 0, 0);
    
    this.pendingUndoEntry.afterSnapshot = afterSnapshot;
    this.pendingUndoEntry = null;
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
    
    // Finalize the undo entry with the AFTER state
    if (this.currentStroke.length > 0) {
      this.finalizeUndoEntry();
      this.layerManager.renderLayersList();
    }
    
    this.currentStroke = [];
    this.updatePressureIndicator(0);
    
    // End the path
    const layerCtx = this.layerManager.getActiveContext();
    if (layerCtx) layerCtx.beginPath();
    
    console.log('Pointer up. Undo states:', this.strokes.length);
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
    const layerCtx = this.layerManager.getActiveContext();
    if (!layerCtx) return;
    
    layerCtx.beginPath();
    layerCtx.moveTo(x, y);
    
    // Use tool manager for drawing
    const size = this.usePressure 
      ? this.brushSize * (0.2 + pressure * 0.8) 
      : this.brushSize;
    
    this.toolManager.draw(layerCtx, x, y, pressure, size, this.hexToRgba(this.color, this.opacity), this.opacity);
    
    // Store last draw point for spacing calculations
    this.toolManager.lastDrawPoint = { x, y };
    this.toolManager.lastDrawTime = Date.now();
    
    // Re-render all layers to show the change
    this.renderAllLayers();
  }
  
  draw(x, y, pressure) {
    const layerCtx = this.layerManager.getActiveContext();
    if (!layerCtx) return;
    
    const size = this.usePressure 
      ? this.brushSize * (0.2 + pressure * 0.8) 
      : this.brushSize;
    
    const tool = this.toolManager.getCurrentTool();
    const spacing = (tool.spacing / 100) * size;
    
    // Interpolate points based on tool spacing
    if (this.toolManager.lastDrawPoint) {
      const lastX = this.toolManager.lastDrawPoint.x;
      const lastY = this.toolManager.lastDrawPoint.y;
      const dist = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
      
      if (dist >= spacing) {
        const steps = Math.floor(dist / spacing);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const ix = lastX + (x - lastX) * t;
          const iy = lastY + (y - lastY) * t;
          this.toolManager.draw(layerCtx, ix, iy, pressure, size, this.hexToRgba(this.color, this.opacity), this.opacity);
        }
        this.toolManager.lastDrawPoint = { x, y };
        
        // Re-render all layers to show the change
        this.renderAllLayers();
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
    
    // Load button
    document.getElementById('loadBtn').addEventListener('click', () => {
      this.loadImage();
    });
    
    // File input for loading images
    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileLoad(e);
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
    if (!this.layerManager) return;
    
    // Save state for undo BEFORE clearing
    const activeLayer = this.layerManager.getActiveLayer();
    if (activeLayer && !activeLayer.isBackground) {
      const layerData = this.layerManager.layerCanvases.get(activeLayer.id);
      if (layerData) {
        // Save before state
        const beforeSnapshot = document.createElement('canvas');
        beforeSnapshot.width = layerData.canvas.width;
        beforeSnapshot.height = layerData.canvas.height;
        beforeSnapshot.getContext('2d').drawImage(layerData.canvas, 0, 0);
        
        // Clear the layer
        layerData.ctx.clearRect(0, 0, layerData.canvas.width, layerData.canvas.height);
        
        // Save after state (empty canvas)
        const afterSnapshot = document.createElement('canvas');
        afterSnapshot.width = layerData.canvas.width;
        afterSnapshot.height = layerData.canvas.height;
        
        // Push to undo stack
        this.strokes.push({
          type: 'layer_snapshot',
          layerId: activeLayer.id,
          beforeSnapshot: beforeSnapshot,
          afterSnapshot: afterSnapshot
        });
        
        this.manageStrokeHistory();
      }
    }
    
    this.renderAllLayers();
    this.layerManager.renderLayersList();
    console.log('Canvas cleared');
    this.showNotification('Canvas cleared');
  }
  
  manageStrokeHistory() {
    // Limit stroke history to prevent memory issues
    if (this.strokes.length > this.MAX_STROKES) {
      // Remove oldest 20% of strokes
      const removeCount = Math.floor(this.MAX_STROKES * 0.2);
      this.strokes.splice(0, removeCount);
      console.log(`Memory management: Removed ${removeCount} old strokes`);
    }
    
    // Also limit redo stack
    if (this.redoStack.length > 100) {
      this.redoStack.splice(0, this.redoStack.length - 100);
    }
  }
  
  undo() {
    if (this.strokes.length === 0) {
      this.showNotification('Nothing to undo');
      return;
    }
    
    const lastStroke = this.strokes.pop();
    this.redoStack.push(lastStroke);
    
    // Restore the layer from the BEFORE snapshot
    if (lastStroke.type === 'layer_snapshot' && lastStroke.beforeSnapshot) {
      const layerData = this.layerManager.layerCanvases.get(lastStroke.layerId);
      if (layerData) {
        layerData.ctx.clearRect(0, 0, layerData.canvas.width, layerData.canvas.height);
        layerData.ctx.drawImage(lastStroke.beforeSnapshot, 0, 0);
      }
    }
    
    // Re-render and update UI
    this.renderAllLayers();
    this.layerManager.renderLayersList();
    console.log('Undo performed. States left:', this.strokes.length);
    this.showNotification('Undo');
  }
  
  redo() {
    if (this.redoStack.length === 0) {
      this.showNotification('Nothing to redo');
      return;
    }
    
    const stroke = this.redoStack.pop();
    this.strokes.push(stroke);
    
    // Restore the layer from the AFTER snapshot
    if (stroke.type === 'layer_snapshot' && stroke.afterSnapshot) {
      const layerData = this.layerManager.layerCanvases.get(stroke.layerId);
      if (layerData) {
        layerData.ctx.clearRect(0, 0, layerData.canvas.width, layerData.canvas.height);
        layerData.ctx.drawImage(stroke.afterSnapshot, 0, 0);
      }
    }
    
    // Re-render and update UI
    this.renderAllLayers();
    this.layerManager.renderLayersList();
    console.log('Redo performed. States:', this.strokes.length);
    this.showNotification('Redo');
  }
  
  redrawCanvas() {
    // With layers, we just re-render all layers
    this.renderAllLayers();
  }
  
  saveImage() {
    // Render all layers first to ensure we have the latest
    this.renderAllLayers();
    
    const link = document.createElement('a');
    link.download = `penpal-draw-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
    console.log('Image saved');
    this.showNotification('Image saved!');
  }
  
  loadImage() {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
  }
  
  handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      this.showNotification('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.layerManager.loadImageToNewLayer(img);
        this.showNotification('Image loaded to new layer');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    event.target.value = '';
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
      
      // Render all layers first to get the actual visible color
      this.renderAllLayers();
      
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

// Help System
class HelpSystem {
  constructor() {
    this.modal = document.getElementById('helpModal');
    this.searchInput = document.getElementById('helpSearch');
    this.links = document.querySelectorAll('.help-link');
    this.sections = document.querySelectorAll('.help-section');
    this.searchDebounceTimer = null;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Open help button
    document.getElementById('helpBtn').addEventListener('click', () => {
      this.open();
    });
    
    // Close button
    document.getElementById('closeHelp').addEventListener('click', () => {
      this.close();
    });
    
    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    
    // Navigation links
    this.links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href').substring(1);
        this.showSection(target);
        this.setActiveLink(link);
      });
    });
    
    // Search functionality with debouncing
    this.searchInput.addEventListener('input', () => {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.performSearch(this.searchInput.value);
      }, 300);
    });
    
    // Keyboard shortcut for help (F1)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        this.open();
      }
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });
  }
  
  open() {
    this.modal.classList.add('active');
    this.searchInput.focus();
  }
  
  close() {
    this.modal.classList.remove('active');
    // Clear search
    this.searchInput.value = '';
    this.clearHighlights();
  }
  
  showSection(sectionId) {
    this.sections.forEach(section => {
      section.classList.remove('active');
      if (section.id === sectionId) {
        section.classList.add('active');
      }
    });
  }
  
  setActiveLink(activeLink) {
    this.links.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
  }
  
  performSearch(query) {
    if (!query.trim()) {
      this.clearHighlights();
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    let foundSection = null;
    
    // Search through all sections
    this.sections.forEach(section => {
      const text = section.textContent.toLowerCase();
      if (text.includes(lowerQuery)) {
        if (!foundSection) foundSection = section.id;
        
        // Highlight matching text
        this.highlightText(section, lowerQuery);
      } else {
        // Remove highlights if no match
        this.removeHighlights(section);
      }
    });
    
    // Show first matching section
    if (foundSection) {
      this.showSection(foundSection);
      // Update active link
      const activeLink = document.querySelector(`.help-link[href="#${foundSection}"]`);
      if (activeLink) this.setActiveLink(activeLink);
    }
  }
  
  highlightText(element, query) {
    // Sanitize query to prevent XSS
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    
    textNodes.forEach(node => {
      const text = node.textContent.toLowerCase();
      if (text.includes(query) && node.parentNode.className !== 'highlight') {
        try {
          const regex = new RegExp(`(${sanitizedQuery})`, 'gi');
          const parts = node.textContent.split(regex);
          
          // Create document fragment to safely build DOM
          const fragment = document.createDocumentFragment();
          parts.forEach((part, i) => {
            if (regex.test(part)) {
              const highlight = document.createElement('span');
              highlight.className = 'highlight';
              highlight.textContent = part; // Safe: textContent escapes HTML
              fragment.appendChild(highlight);
            } else {
              fragment.appendChild(document.createTextNode(part));
            }
          });
          
          node.parentNode.replaceChild(fragment, node);
        } catch (e) {
          // Invalid regex, skip this node
          console.warn('Invalid search pattern:', e);
        }
      }
    });
  }
  
  removeHighlights(section) {
    const highlights = section.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
  }
  
  clearHighlights() {
    this.sections.forEach(section => {
      this.removeHighlights(section);
    });
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('PenPal Draw initializing...');
  const app = new DrawingApp();
  window.penpalApp = app; // Expose for debugging
  
  // Initialize help system
  const helpSystem = new HelpSystem();
  window.helpSystem = helpSystem;
  
  console.log('PenPal Draw ready! Open browser console (F12) for debug info.');
  console.log('Press F1 for Help');
});
