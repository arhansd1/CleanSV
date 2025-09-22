//frontend/public/src/app.js
import { getCurrentContextAndInstruction } from './contextBuilder.js';
import { isExecutableCode, addApplyButton } from './applyButton.js';

// State management variables
let currentData = [];
let previousData = null;
let nextData = null;

// File input handling
document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    // Clear chat when new file selected
    clearChat();
    document.getElementById('file-name').textContent = `Selected: ${file.name}`;
    document.getElementById('show-numbers').disabled = false;
    if (document.getElementById('show-numbers').checked) {
      document.getElementById('show-numbers').checked = false;
      removeColumnNumbering();
    }
    previousData = currentData.length > 0 ? [...currentData] : null;
    parseCSV(file);
  }
});

// Column numbering toggle
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

function parseCSV(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const csvData = e.target.result;
    Papa.parse(csvData, {
      header: true,
      complete: (results) => {
        currentData = results.data;
        renderTable(currentData);
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

function saveCellEdit(td) {
  const newValue = td.textContent;
  const column = td.dataset.column;
  const rowIndex = parseInt(td.dataset.row);
  currentData[rowIndex][column] = newValue;
}

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

// Chat logic with proper DOM-safe appending
// Chat state management
let isProcessing = false;

// Unified message handler for both click and Enter key
function handleSendMessage() {
  // Prevent multiple submissions while processing
  if (isProcessing) return;
  
  const input = document.getElementById('user-input');
  const text = input.value.trim();
  
  input.style.height = "auto"; // reset height after send

  // Don't send empty messages
  if (!text) return;
  
  // Set processing state and clear input
  isProcessing = true;
  input.value = '';
  document.getElementById('send-btn').disabled = true;
  
  // Display user message with preserved newlines
  displayMessage(text, 'user-message');

  // Get context and instruction data
  const { context, instruction, fullPrompt } = getCurrentContextAndInstruction(text, currentData);
  
  // For now, just log the data - you'll use this for API calls later
  console.log("Context:", context);
  console.log("Instruction:", instruction);
  console.log("Full Prompt:", fullPrompt);
  
  // Process and display system response
  processSystemResponse(text);
}

// Display message in chat
function displayMessage(text, className) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${className}`;
  // Replace newlines with <br> and preserve other HTML entities
  messageDiv.innerHTML = text.replace(/\n/g, '<br>');
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageDiv; // Return the element so we can add buttons to it
}

// Process system response
async function processSystemResponse(userText) {
  // Get the current context data
  const { context, instruction, fullPrompt } = getCurrentContextAndInstruction(userText, currentData);
  
  // Get selected API provider
  const apiProvider = document.getElementById('api-provider').value;
  
  try {
    // Show loading message
    const loadingMessage = displayMessage(`Processing with ${apiProvider.toUpperCase()}...`, 'system-message');
    
    // Send request to backend
    const response = await fetch('http://localhost:5000/ai-command', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        context, 
        instruction,
        api_provider: apiProvider  // Send selected API provider
      })
    });
    
    // Remove loading message
    loadingMessage.remove();
    
    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    // Parse JSON response
    const result = await response.json();
    
    if (result.status === 'success') {
      // Display the code
      const codeMessage = displayMessage(result.code, 'system-message');
      
      // Add apply button if this is executable code
      if (isExecutableCode(result.code)) {
        addApplyButton(result.code, codeMessage, apiProvider);
      }
      
    } else {
      // Display error from backend
      displayMessage(`Error: ${result.message}`, 'error-message');
    }
    
  } catch (error) {
    // Display network/processing errors
    console.error('API Error:', error);
    displayMessage(`Network Error: ${error.message}`, 'error-message');
  } finally {
    // Reset processing state
    isProcessing = false;
    document.getElementById('send-btn').disabled = false;
  }
}

// Handle revert events
window.addEventListener('revertToCode', (event) => {
  const code = event.detail.code;
  // Here you would implement the actual revert logic
  console.log('Reverting to code:', code);
  // For now, we'll just show an alert
  alert('Revert functionality will be implemented in Phase 2');
});

// Event listeners
document.getElementById('send-btn').addEventListener('click', handleSendMessage);

document.getElementById('user-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

// Auto-resize textarea up to 1/6 of chat-box height
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
  // Re-add welcome message
  displayMessage('Welcome to CSV Cleaner! Select an AI provider and type commands to edit your CSV data.', 'system-message');
}