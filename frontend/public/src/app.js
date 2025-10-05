//frontend/public/src/app.js
import { getCurrentContextAndInstruction } from './contextBuilder.js';
import { isExecutableCode, addApplyButton } from './applyButton.js';

// ============= THEME MANAGEMENT =============
function initializeTheme() {
  const savedTheme = localStorage.getItem('csvCleanerTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('csvCleanerTheme', newTheme);
  showToast(`Switched to ${newTheme} mode`, 'info');
}

// Initialize theme on page load
initializeTheme();

// Add click handler to title for theme toggle
document.getElementById('toolbar-heading').addEventListener('click', toggleTheme);

// ============= STATE MANAGEMENT =============
let currentData = [];
let historyStack = []; // [state1, state2, state3, current]
let historyIndex = -1; // Points to current position in history
const MAX_HISTORY = 50; // Limit history to prevent memory issues

// ============= HISTORY FUNCTIONS =============
function saveToHistory(data) {
  // Remove any future states if we're not at the end
  if (historyIndex < historyStack.length - 1) {
    historyStack = historyStack.slice(0, historyIndex + 1);
  }
  
  // Add new state
  historyStack.push(JSON.parse(JSON.stringify(data))); // Deep copy
  
  // Limit history size
  if (historyStack.length > MAX_HISTORY) {
    historyStack.shift();
  } else {
    historyIndex++;
  }
  
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = historyIndex >= historyStack.length - 1;
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    currentData = JSON.parse(JSON.stringify(historyStack[historyIndex]));
    renderTable(currentData);
    updateUndoRedoButtons();
    showToast('Undo successful', 'success');
  }
}

function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    currentData = JSON.parse(JSON.stringify(historyStack[historyIndex]));
    renderTable(currentData);
    updateUndoRedoButtons();
    showToast('Redo successful', 'success');
  }
}

// ============= TOAST NOTIFICATION SYSTEM =============
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Add icon based on type
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============= EXPOSE API FOR APPLY BUTTON =============
window.csvCleanerApp = {
  getCurrentData: () => currentData,
  getPreviousData: () => historyIndex > 0 ? historyStack[historyIndex - 1] : null,
  updateData: (newData) => {
    currentData = newData;
    saveToHistory(currentData);
  },
  renderTable: renderTable,
  showToast: showToast
};

// ============= FILE INPUT HANDLING =============
document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    clearChat();
    document.getElementById('file-name').textContent = `Selected: ${file.name}`;
    document.getElementById('show-numbers').disabled = false;
    if (document.getElementById('show-numbers').checked) {
      document.getElementById('show-numbers').checked = false;
      removeColumnNumbering();
    }
    parseCSV(file);
  }
});

// ============= COLUMN NUMBERING =============
document.getElementById('show-numbers').addEventListener('change', () => {
  if (document.getElementById('show-numbers').checked) {
    addColumnNumbering();
  } else {
    removeColumnNumbering();
  }
});

function addColumnNumbering() {
  const table = document.querySelector('.csv-table');
  if (!table) return;
  const rows = table.querySelectorAll('tr');
  rows.forEach((row, index) => {
    if (row.firstElementChild && row.firstElementChild.classList.contains('numbered')) return;
    const cell = document.createElement(index === 0 ? 'th' : 'td');
    cell.textContent = index === 0 ? '#' : index;
    cell.className = 'numbered';
    row.insertBefore(cell, row.firstChild);
  });
}

function removeColumnNumbering() {
  const table = document.querySelector('.csv-table');
  if (!table) return;
  const rows = table.querySelectorAll('tr');
  rows.forEach(row => {
    const firstCell = row.firstElementChild;
    if (firstCell && firstCell.classList.contains('numbered')) {
      row.removeChild(firstCell);
    }
  });
}

// ============= CSV PARSING =============
function parseCSV(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const csvData = e.target.result;
    Papa.parse(csvData, {
      header: true,
      complete: (results) => {
        currentData = results.data;
        // Initialize history with first state
        historyStack = [JSON.parse(JSON.stringify(currentData))];
        historyIndex = 0;
        updateUndoRedoButtons();
        renderTable(currentData);
        showToast('CSV loaded successfully', 'success');
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        showError(`CSV Parsing Error: ${error.message}`);
      }
    });
  };
  reader.onerror = (error) => {
    console.error("Error reading file:", error);
    showError("File Read Error: Could not read file");
  };
  reader.readAsText(file);
}

// ============= CELL EDITING =============
function saveCellEdit(td) {
  const newValue = td.textContent;
  const column = td.dataset.column;
  const rowIndex = parseInt(td.dataset.row);
  
  // Only save to history if value actually changed
  const oldValue = currentData[rowIndex][column];
  if (oldValue !== newValue) {
    currentData[rowIndex][column] = newValue;
    saveToHistory(currentData);
    showToast('Cell updated', 'success');
  }
}

// ============= TABLE RENDERING =============
function renderTable(data) {
  const tableContainer = document.getElementById('table-container');
  const fragment = document.createDocumentFragment();

  if (data.length === 0) {
    const message = document.createElement('div');
    message.className = 'empty-table-message';
    message.textContent = 'No data found';
    fragment.appendChild(message);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(fragment);
    return;
  }

  const table = document.createElement('table');
  table.setAttribute('role', 'grid');
  table.className = 'csv-table';

  const headerRow = document.createElement('tr');
  Object.keys(data[0]).forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  const rowsFragment = document.createDocumentFragment();
  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    Object.entries(row).forEach(([key, value]) => {
      const td = document.createElement('td');
      td.textContent = value;
      td.tabIndex = 0;
      td.contentEditable = false;

      td.addEventListener('dblclick', () => {
        td.contentEditable = true;
        td.focus();
      });

      td.addEventListener('blur', () => {
        if (td.isContentEditable) {
          saveCellEdit(td);
        }
        td.contentEditable = false;
      });

      let editTimeout;
      td.addEventListener('input', () => {
        clearTimeout(editTimeout);
        editTimeout = setTimeout(() => {
          saveCellEdit(td);
        }, 500);
      });

      td.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          td.blur();
        }
      });

      td.dataset.column = key;
      td.dataset.row = index;
      tr.appendChild(td);
    });
    rowsFragment.appendChild(tr);
  });

  table.appendChild(rowsFragment);
  fragment.appendChild(table);
  tableContainer.innerHTML = '';
  tableContainer.appendChild(fragment);

  if (document.getElementById('show-numbers').checked) {
    addColumnNumbering();
  }
}

function showError(message) {
  const chatMessages = document.getElementById('chat-messages');
  const errorMsg = document.createElement('div');
  errorMsg.className = 'message error-message';
  errorMsg.textContent = message;
  chatMessages.appendChild(errorMsg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============= CHAT LOGIC =============
let isProcessing = false;

function handleSendMessage() {
  if (isProcessing) return;
  
  const input = document.getElementById('user-input');
  const text = input.value.trim();
  
  input.style.height = "auto";

  if (!text) return;
  
  isProcessing = true;
  input.value = '';
  document.getElementById('send-btn').disabled = true;
  
  displayMessage(text, 'user-message');

  const { context, instruction, fullPrompt } = getCurrentContextAndInstruction(text, currentData);
  
  console.log("Context:", context);
  console.log("Instruction:", instruction);
  console.log("Full Prompt:", fullPrompt);
  
  processSystemResponse(text);
}

function displayMessage(text, className) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${className}`;
  messageDiv.innerHTML = text.replace(/\n/g, '<br>');
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageDiv;
}

async function processSystemResponse(userText) {
  const { context, instruction, fullPrompt } = getCurrentContextAndInstruction(userText, currentData);
  const apiProvider = document.getElementById('api-provider').value;
  
  try {
    const loadingMessage = displayMessage(`Processing with ${apiProvider.toUpperCase()}...`, 'system-message');
    
    const response = await fetch('http://localhost:5000/ai-command', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        context, 
        instruction,
        api_provider: apiProvider
      })
    });
    
    loadingMessage.remove();
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      const codeMessage = displayMessage(result.code, 'system-message');
      
      if (isExecutableCode(result.code)) {
        addApplyButton(result.code, codeMessage, apiProvider);
      }
      
    } else {
      displayMessage(`Error: ${result.message}`, 'error-message');
    }
    
  } catch (error) {
    console.error('API Error:', error);
    displayMessage(`Network Error: ${error.message}`, 'error-message');
  } finally {
    isProcessing = false;
    document.getElementById('send-btn').disabled = false;
  }
}

// ============= EVENT LISTENERS =============
document.getElementById('send-btn').addEventListener('click', handleSendMessage);

document.getElementById('user-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

// Undo/Redo buttons
document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('redo-btn').addEventListener('click', redo);

// Export CSV button
document.getElementById('export-btn').addEventListener('click', () => {
  if (currentData.length === 0) {
    showToast('No data to export', 'error');
    return;
  }
  
  const csv = Papa.unparse(currentData);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cleaned_data.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported successfully', 'success');
});

// Auto-resize textarea
const userInput = document.getElementById("user-input");
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  const chatBoxHeight = document.querySelector(".chat-box").clientHeight;
  const maxHeight = chatBoxHeight / 6;
  userInput.style.height = Math.min(userInput.scrollHeight, maxHeight) + "px";
});

// Initial welcome message
displayMessage('Welcome to CSV Cleaner! Select an AI provider and type commands to edit your CSV data.', 'system-message');

function clearChat() {
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = '';
  displayMessage('Welcome to CSV Cleaner! Select an AI provider and type commands to edit your CSV data.', 'system-message');
}