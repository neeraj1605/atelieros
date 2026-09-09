// AtelierFlow - Reactive State Manager & Financial Engine
import {
  initialProject,
  initialRooms,
  initialProducts,
  initialMoodboard,
  initialSamples,
  initialTimeline,
  initialTasks,
  initialSnags,
  initialConceptRenders,
  initialPurchaseOrders
} from '../data/initial-data.js';

const STORAGE_KEY = 'ATELIERFLOW_STATE_V1';

// Currency exchange rates relative to USD
export const CURRENCIES = {
  USD: { symbol: '$', rate: 1.0, name: 'US Dollar (USD)' },
  EUR: { symbol: '€', rate: 0.92, name: 'Euro (EUR)' },
  GBP: { symbol: '£', rate: 0.79, name: 'British Pound (GBP)' },
  INR: { symbol: '₹', rate: 84.0, name: 'Indian Rupee (INR)' },
  AUD: { symbol: 'A$', rate: 1.52, name: 'Australian Dollar (AUD)' }
};

class StateManager {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadInitialState();
  }

  loadInitialState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.project && parsed.products) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not restore from localStorage, using seed data', e);
    }

    return {
      activeView: 'overview', // 'overview' | 'discovery' | 'design' | 'commercial' | 'project-mgmt'
      selectedRoomId: 'all',
      selectedProductId: null,
      isClientMode: false, // In Client Mode, internal trade discounts and margins are hidden
      currentCurrency: 'USD',
      project: { ...initialProject },
      rooms: [...initialRooms],
      products: [...initialProducts],
      moodboard: JSON.parse(JSON.stringify(initialMoodboard)),
      samples: [...initialSamples],
      timeline: JSON.parse(JSON.stringify(initialTimeline)),
      tasks: JSON.parse(JSON.stringify(initialTasks)),
      snags: JSON.parse(JSON.stringify(initialSnags)),
      renders: JSON.parse(JSON.stringify(initialConceptRenders)),
      purchaseOrders: JSON.parse(JSON.stringify(initialPurchaseOrders))
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (e) {
        console.error('Error in state subscriber:', e);
      }
    }
  }

  // Navigation & View Controls
  setActiveView(viewName) {
    this.state.activeView = viewName;
    this.save();
  }

  setSelectedRoom(roomId) {
    this.state.selectedRoomId = roomId;
    this.save();
  }

  setSelectedProduct(productId) {
    this.state.selectedProductId = productId;
    this.save();
  }

  toggleClientMode() {
    this.state.isClientMode = !this.state.isClientMode;
    this.save();
  }

  setCurrency(currencyCode) {
    if (CURRENCIES[currencyCode]) {
      this.state.currentCurrency = currencyCode;
      this.state.project.currency = currencyCode;
      this.state.project.currencySymbol = CURRENCIES[currencyCode].symbol;
      this.save();
    }
  }

  // Financial Calculations & Formatting
  formatCurrency(amountUSD) {
    if (amountUSD == null || isNaN(amountUSD)) return '$0';
    const curr = CURRENCIES[this.state.currentCurrency] || CURRENCIES.USD;
    const converted = amountUSD * curr.rate;
    return `${curr.symbol}${Math.round(converted).toLocaleString()}`;
  }

  getFinancials() {
    let totalCostPrice = 0;
    let totalClientPrice = 0;
    let totalFreight = 0;
    let totalTax = 0;
    let totalCommittedPO = 0;

    this.state.products.forEach(p => {
      const qty = p.quantity || 1;
      const cost = (p.tradeCost || 0) * qty;
      const client = (p.clientPrice || (p.tradeCost * (1 + (p.markupPercent || 30) / 100))) * qty;
      
      totalCostPrice += cost;
      totalClientPrice += client;
    });

    this.state.purchaseOrders.forEach(po => {
      totalCommittedPO += (po.totalAmount || 0);
    });

    const grossMarginDollars = totalClientPrice - totalCostPrice;
    const grossMarginPercent = totalClientPrice > 0 ? (grossMarginDollars / totalClientPrice) * 100 : 0;
    const targetBudget = this.state.project.targetBudget || 485000;
    const budgetVariance = targetBudget - totalClientPrice;

    return {
      targetBudget,
      totalCostPrice,
      totalClientPrice,
      grossMarginDollars,
      grossMarginPercent,
      budgetVariance,
      totalCommittedPO,
      isUnderBudget: budgetVariance >= 0
    };
  }

  // Products & FF&E
  addProduct(product) {
    const newProduct = {
      id: `prod-${Date.now()}`,
      quantity: 1,
      markupPercent: 35,
      procurementStatus: 'Idea',
      sampleStatus: 'Requested',
      ...product
    };
    if (!newProduct.clientPrice && newProduct.tradeCost) {
      newProduct.clientPrice = Math.round(newProduct.tradeCost * (1 + newProduct.markupPercent / 100));
    }
    this.state.products.unshift(newProduct);
    this.save();
    return newProduct;
  }

  updateProduct(productId, changes) {
    const idx = this.state.products.findIndex(p => p.id === productId);
    if (idx !== -1) {
      const current = this.state.products[idx];
      const updated = { ...current, ...changes };
      // Recalculate client price if trade cost or markup changes
      if (changes.tradeCost != null || changes.markupPercent != null) {
        const cost = updated.tradeCost || 0;
        const markup = updated.markupPercent != null ? updated.markupPercent : 35;
        updated.clientPrice = Math.round(cost * (1 + markup / 100));
      }
      this.state.products[idx] = updated;
      this.save();
    }
  }

  deleteProduct(productId) {
    this.state.products = this.state.products.filter(p => p.id !== productId);
    // Also remove from moodboard items if linked
    this.state.moodboard.items = this.state.moodboard.items.filter(i => i.productId !== productId);
    this.save();
  }

  // Moodboard
  addMoodboardItem(item) {
    const newItem = {
      id: `mb-${Date.now()}`,
      x: 100,
      y: 100,
      width: 240,
      height: 200,
      rotation: 0,
      zIndex: this.state.moodboard.items.length + 1,
      ...item
    };
    this.state.moodboard.items.push(newItem);
    this.save();
    return newItem;
  }

  updateMoodboardItem(itemId, changes) {
    const item = this.state.moodboard.items.find(i => i.id === itemId);
    if (item) {
      Object.assign(item, changes);
      this.save();
    }
  }

  deleteMoodboardItem(itemId) {
    this.state.moodboard.items = this.state.moodboard.items.filter(i => i.id !== itemId);
    this.save();
  }

  addMoodboardPaletteColor(color) {
    this.state.moodboard.palette.push(color);
    this.save();
  }

  // Floorplan & Spatial Placement
  updateFloorplanPlacement(productId, floorplanData) {
    const product = this.state.products.find(p => p.id === productId);
    if (product) {
      product.floorplan = {
        ...(product.floorplan || {}),
        ...floorplanData
      };
      this.save();
    }
  }

  // 3D Concept Renders & Client Pins
  addRenderPin(renderId, pin) {
    const render = this.state.renders.find(r => r.id === renderId);
    if (render) {
      const newPin = {
        id: `pin-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: 'Open',
        role: this.state.isClientMode ? 'Client' : 'Architect',
        author: this.state.isClientMode ? this.state.project.client : this.state.project.leadArchitect,
        ...pin
      };
      render.pins.push(newPin);
      this.save();
      return newPin;
    }
  }

  // Project Management: Timeline, Tasks, Snags
  updateTimelineProgress(phaseId, progress) {
    const phase = this.state.timeline.find(p => p.id === phaseId);
    if (phase) {
      phase.progress = Math.min(100, Math.max(0, progress));
      if (phase.progress === 100) phase.status = 'Completed';
      else if (phase.progress > 0) phase.status = 'In Progress';
      else phase.status = 'Upcoming';
      this.save();
    }
  }

  toggleMilestone(phaseId, milestoneIndex) {
    const phase = this.state.timeline.find(p => p.id === phaseId);
    if (phase && phase.milestones[milestoneIndex]) {
      phase.milestones[milestoneIndex].done = !phase.milestones[milestoneIndex].done;
      // recalculate progress
      const total = phase.milestones.length;
      const completed = phase.milestones.filter(m => m.done).length;
      phase.progress = Math.round((completed / total) * 100);
      phase.status = phase.progress === 100 ? 'Completed' : phase.progress > 0 ? 'In Progress' : 'Upcoming';
      this.save();
    }
  }

  moveTask(taskId, newStatus) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = newStatus;
      this.save();
    }
  }

  addTask(taskData) {
    const newTask = {
      id: `task-${Date.now()}`,
      status: 'To Do',
      priority: 'Normal',
      subtasks: [],
      ...taskData
    };
    this.state.tasks.unshift(newTask);
    this.save();
    return newTask;
  }

  addSnag(snagData) {
    const newSnag = {
      id: `snag-${Date.now()}`,
      dateReported: new Date().toISOString().split('T')[0],
      status: 'Open',
      severity: 'Minor',
      reportedBy: this.state.isClientMode ? this.state.project.client : this.state.project.leadArchitect,
      ...snagData
    };
    this.state.snags.unshift(newSnag);
    this.save();
    return newSnag;
  }

  updateSnagStatus(snagId, newStatus) {
    const snag = this.state.snags.find(s => s.id === snagId);
    if (snag) {
      snag.status = newStatus;
      this.save();
    }
  }

  // Samples Tracker
  updateSampleStatus(sampleId, newStatus) {
    const sample = this.state.samples.find(s => s.id === sampleId);
    if (sample) {
      sample.status = newStatus;
      this.save();
    }
  }

  addSample(sampleData) {
    const newSample = {
      id: `smp-${Date.now()}`,
      dateRequested: new Date().toISOString().split('T')[0],
      status: 'Requested',
      ...sampleData
    };
    this.state.samples.unshift(newSample);
    this.save();
    return newSample;
  }

  // Purchase Orders
  createPurchaseOrder(poData) {
    const newPO = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${String(this.state.purchaseOrders.length + 1).padStart(3, '0')}`,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
      items: [],
      depositPaid: 0,
      balanceDue: poData.totalAmount || 0,
      ...poData
    };
    this.state.purchaseOrders.unshift(newPO);
    this.save();
    return newPO;
  }

  updatePOStatus(poId, newStatus) {
    const po = this.state.purchaseOrders.find(p => p.id === poId);
    if (po) {
      po.status = newStatus;
      if (newStatus.includes('Deposit Paid') && po.depositPaid === 0) {
        po.depositPaid = Math.round(po.totalAmount * 0.5);
        po.balanceDue = po.totalAmount - po.depositPaid;
      } else if (newStatus === 'Fulfilled' || newStatus === 'Delivered to Warehouse') {
        po.depositPaid = po.totalAmount;
        po.balanceDue = 0;
      }
      this.save();
    }
  }

  // JSON Export / Import / Reset
  exportProjectJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AtelierFlow_${this.state.project.code}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importProjectJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.project && parsed.products) {
        this.state = parsed;
        this.save();
        return { success: true };
      }
      return { success: false, message: 'Invalid project structure' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  resetToDemo() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
    this.save();
  }
}

export const stateManager = new StateManager();
