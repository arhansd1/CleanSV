// State management variables
let currentData = []; // Holds the current CSV data as an array of objects
let previousData = null; // Placeholder for undo functionality (to be implemented later)
let nextData = null; // Placeholder for redo functionality (to be implemented later)

// Toggle visibility of numbered columns
function toggleNumberVisibility() {
  const showNumbers = document.getElementById('show-numbers').checked;
  const numberCells = document.querySelectorAll('.numbered');
  numberCells.forEach(cell => {
    cell.style.display = showNumbers ? '' : 'none';
  });
}

// File input handling
document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    // Update UI with filename
    document.getElementById('file-name').textContent = `Selected: ${file.name}`;
    
    // Store reference for undo/redo functionality
    previousData = currentData.length > 0 ? [...currentData] : null;
    
    // Parse the file
    parseCSV(file);
  }
});

// Show numbers toggle
document.getElementById('show-numbers').addEventListener('change', toggleNumberVisibility);

// CSV parsing function
function parseCSV(file) {
  const reader = new FileReader();
  
  // File loaded successfully
  reader.onload = (e) => {
    const csvData = e.target.result;
    
    Papa.parse(csvData, {
      header: true,
      complete: (results) => {
        // Store parsed data
        currentData = results.data;
        
        // Render table
        renderTable(currentData);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        showError(`CSV Parsing Error: ${error.message}`);
      }
    });
  };

  // File read error
  reader.onerror = (error) => {
    console.error("Error reading file:", error);
    showError("File Read Error: Could not read file");
  };
  
  // Start reading file
  reader.readAsText(file);
}

// Save cell edit to data model
function saveCellEdit(td) {
  const newValue = td.textContent;
  const column = td.dataset.column;
  const rowIndex = parseInt(td.dataset.row);
  currentData[rowIndex][column] = newValue;
}

// Main table rendering function
function renderTable(data) {
  const tableContainer = document.getElementById('table-container');
  const showNumbers = document.getElementById('show-numbers').checked;
  
  // Clear previous content using document fragment for better performance
  const fragment = document.createDocumentFragment();
  
  // Handle empty data with optimized fragment
  if (data.length === 0) {
    const message = document.createElement('div');
    message.className = 'empty-table-message';
    message.textContent = 'No data found';
    fragment.appendChild(message);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(fragment);
    return;
  }
  
  // Create table structure
  const table = document.createElement('table');
  table.setAttribute('role', 'grid');
  table.className = 'csv-table';
  
  // Create table header
  const headerRow = document.createElement('tr');
  
  // Add number column header if enabled
  if (showNumbers) {
    const numberHeader = document.createElement('th');
    numberHeader.textContent = '#';
    numberHeader.className = 'numbered';
    headerRow.appendChild(numberHeader);
  }
  
  // Add data headers
  Object.keys(data[0]).forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  
  table.appendChild(headerRow);
  
  // Create data rows using document fragment
  const rowsFragment = document.createDocumentFragment();
  
  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    
    // Add row number if enabled
    if (showNumbers) {
      const numberCell = document.createElement('td');
      numberCell.textContent = index + 1;
      numberCell.className = 'numbered';
      tr.appendChild(numberCell);
    }
    
    // Add data cells with debounced editing
    Object.entries(row).forEach(([key, value]) => {
      const td = document.createElement('td');
      td.textContent = value;
      td.contentEditable = true;
      td.dataset.column = key;
      td.dataset.row = index;
      
      // Debounced input handling
      let editTimeout;
      td.addEventListener('input', () => {
        clearTimeout(editTimeout);
        editTimeout = setTimeout(() => {
          saveCellEdit(td);
        }, 500); // 500ms delay before saving
      });
      
      // Immediate save on blur (when cell loses focus)
      td.addEventListener('blur', () => {
        clearTimeout(editTimeout); // Cancel the pending debounce
        saveCellEdit(td);
      });
      
      tr.appendChild(td);
    });
    
    rowsFragment.appendChild(tr);
  });
  
  table.appendChild(rowsFragment);
  fragment.appendChild(table);
  
  // Update DOM efficiently
  tableContainer.innerHTML = '';
  tableContainer.appendChild(fragment);
  
  // Set initial visibility of numbered columns
  toggleNumberVisibility();
}

// Error display function
function showError(message) {
  const chatMessages = document.getElementById('chat-messages');
  const errorMsg = document.createElement('div');
  errorMsg.className = 'message error-message';
  errorMsg.textContent = message;
  chatMessages.appendChild(errorMsg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
