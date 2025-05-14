// app.js
let currentData = null; // Store the current data

// Utility functions for table manipulation
function addRow(position = 'end') {
    if (!currentData || currentData.length === 0) return;
    
    const newRow = {};
    // Copy structure from first row
    Object.keys(currentData[0]).forEach(key => {
        newRow[key] = ''; // Empty value for new row
    });
    
    if (position === 'start') {
        currentData.unshift(newRow);
    } else {
        currentData.push(newRow);
    }
    
    renderTable(currentData);
    return currentData.length - 1; // Return the index of the new row
}

function removeRow(index) {
    if (!currentData || index < 0 || index >= currentData.length) return false;
    
    currentData.splice(index, 1);
    renderTable(currentData);
    return true;
}

function addColumn(name, position = 'end') {
    if (!currentData || currentData.length === 0) return;
    
    currentData.forEach(row => {
        if (position === 'start') {
            // Add to start of object
            const newRow = { [name]: '' };
            Object.keys(row).forEach(key => {
                newRow[key] = row[key];
            });
            Object.assign(row, newRow);
        } else {
            // Add to end of object
            row[name] = '';
        }
    });
    
    renderTable(currentData);
    return true;
}

function removeColumn(name) {
    if (!currentData || currentData.length === 0) return false;
    
    currentData.forEach(row => {
        delete row[name];
    });
    
    renderTable(currentData);
    return true;
}

// Example usage for AI agent:
// addRow('start'); // Add row at beginning
// addRow(); // Add row at end
// removeRow(0); // Remove first row
// addColumn('New Column', 'start'); // Add column at beginning
// addColumn('New Column'); // Add column at end
// removeColumn('Column Name'); // Remove specific column

document.getElementById('file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("File selected:", file.name);
      // Update UI to show filename
      document.getElementById('file-name').textContent = `Selected: ${file.name}`;
      // Parse the file (next step)
      parseCSV(file);
    }
});

// Add event listener for the checkbox
document.getElementById('show-numbers').addEventListener('change', (event) => {
    if (currentData) {
        renderTable(currentData);
    }
});

function parseCSV(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log("File loaded successfully");
      const csvData = e.target.result;
      console.log("CSV Data:", csvData.substring(0, 200) + "...");
      
      Papa.parse(csvData, {
        header: true,
        complete: (results) => {
          console.log("Parsed data:", results.data);
          console.log("Number of rows:", results.data.length);
          currentData = results.data; // Store the data
          renderTable(results.data);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
        }
      });
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
    
    console.log("Starting to read file...");
    reader.readAsText(file);
}

function renderTable(data) {
    console.log("Starting to render table...");
    const tableContainer = document.getElementById('table-container');
    const showNumbers = document.getElementById('show-numbers').checked;
    
    // Clear previous content
    tableContainer.innerHTML = '';
    
    if (data.length === 0) {
      console.log("No data to render");
      tableContainer.innerHTML = '<div class="empty-table-message">No data found</div>';
      return;
    }
    
    // Create a table element
    const table = document.createElement('table');
    table.setAttribute('role', 'grid');
    table.className = 'csv-table';
    
    // Add header row
    const headerRow = document.createElement('tr');
    
    // Add number column header if enabled
    if (showNumbers) {
        const numberHeader = document.createElement('th');
        numberHeader.textContent = '#';
        numberHeader.className = 'numbered';
        headerRow.appendChild(numberHeader);
    }
    
    Object.keys(data[0]).forEach(key => {
      const th = document.createElement('th');
      th.textContent = key;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Add data rows
    data.forEach((row, index) => {
      const tr = document.createElement('tr');
      
      // Add number column if enabled
      if (showNumbers) {
          const numberCell = document.createElement('td');
          numberCell.textContent = index + 1;
          numberCell.className = 'numbered';
          tr.appendChild(numberCell);
      }
      
      Object.entries(row).forEach(([key, value]) => {
        const td = document.createElement('td');
        td.textContent = value;
        td.contentEditable = true; // Make cell editable
        td.dataset.column = key; // Store column name for reference
        td.dataset.row = index; // Store row index for reference
        
        // Add event listeners for cell editing
        td.addEventListener('blur', (e) => {
            const newValue = e.target.textContent;
            const column = e.target.dataset.column;
            const rowIndex = parseInt(e.target.dataset.row);
            // Update the data
            currentData[rowIndex][column] = newValue;
            console.log(`Updated cell at row ${rowIndex}, column ${column} to: ${newValue}`);
        });
        
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    
    console.log("Table created, appending to container...");
    tableContainer.appendChild(table);
    console.log("Table rendering complete");
}
