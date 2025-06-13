let currentData = [];
let previousData = null;
let nextData = null;

// File input handling
document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    document.getElementById('file-name').textContent = `Selected: ${file.name}`;
    document.getElementById('show-numbers').disabled = false; // Enable toggle
    if(document.getElementById('show-numbers').checked){
      document.getElementById('show-numbers').checked = false;
    }
    removeColumnNumbering();
    previousData = currentData.length > 0 ? [...currentData] : null;
    parseCSV(file);
  }
});


//ColumnNumbering
document.getElementById('show-numbers').addEventListener('change', () => {
  if (document.getElementById('show-numbers').checked) {
    addcolumnNumbering();
  } else {
    removeColumnNumbering(); // optional
  }
});


//AddColumnNumbering
function addcolumnNumbering() {
  const table = document.querySelector('.csv-table');
  if (!table) return;

  const rows = table.querySelectorAll('tr');

  rows.forEach((row, index) => {
    const numberCell = document.createElement(row.parentElement.tagName === 'THEAD' || index === 0 ? 'th' : 'td');
    numberCell.textContent = index === 0 ? '#' : index;
    numberCell.className = 'numbered';
    row.insertBefore(numberCell, row.firstChild);
  });
}

// RemoveColumnNumbering
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

  
  
// CSV parsing function
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
      

      td.contentEditable = false;
      td.addEventListener('dblclick', () => {
        td.contentEditable = true;
        td.focus();
      });
      td.addEventListener('blur', () => {
        td.contentEditable = false;
        saveCellEdit(td);
      });
      


      td.dataset.column = key;
      td.dataset.row = index;

      let editTimeout;
      td.addEventListener('input', () => {
        clearTimeout(editTimeout);
        editTimeout = setTimeout(() => {
          saveCellEdit(td);
        }, 500);
      });

      td.addEventListener('blur', () => {
        clearTimeout(editTimeout);
        saveCellEdit(td);
      });

      tr.appendChild(td);
    });

    rowsFragment.appendChild(tr);
  });

  table.appendChild(rowsFragment);
  fragment.appendChild(table);
  tableContainer.innerHTML = '';
  tableContainer.appendChild(fragment);
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

