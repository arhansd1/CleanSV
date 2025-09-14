// pyodideExecutor.js - New file to create

let pyodide = null;
let isInitializing = false;

/**
 * Initialize Pyodide with pandas support
 * @returns {Promise<boolean>} - Success status
 */
async function initializePyodide() {
    if (pyodide) return true;
    if (isInitializing) {
        // Wait for existing initialization
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return !!pyodide;
    }
    
    isInitializing = true;
    
    try {
        console.log('Loading Pyodide...');
        
        // Load Pyodide from CDN
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
        });
        
        console.log('Loading pandas and numpy...');
        
        // Load required packages
        await pyodide.loadPackage(["pandas", "numpy"]);
        
        console.log('Pyodide initialized successfully!');
        
        // Set up Python environment
        pyodide.runPython(`
            import pandas as pd
            import numpy as np
            import warnings
            warnings.filterwarnings('ignore')
        `);
        
        return true;
        
    } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        pyodide = null;
        return false;
    } finally {
        isInitializing = false;
    }
}

/**
 * Convert JavaScript array of objects to pandas DataFrame
 * @param {Array} data - CSV data as array of objects
 * @returns {string} - Python code to create DataFrame
 */
function convertDataToPython(data) {
    if (!data || data.length === 0) {
        return "df = pd.DataFrame()";
    }
    
    // Convert to records format for Python
    const records = data.map(row => {
        const cleanRow = {};
        for (const [key, value] of Object.entries(row)) {
            // Handle different data types
            if (value === null || value === undefined || value === '') {
                cleanRow[key] = null;
            } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
                cleanRow[key] = parseFloat(value);
            } else {
                cleanRow[key] = String(value);
            }
        }
        return cleanRow;
    });
    
    // Convert to Python-compatible format
    const pythonData = JSON.stringify(records);
    return `
import json
data_json = '''${pythonData}'''
data = json.loads(data_json)
df = pd.DataFrame(data)
# Clean up any NaN values
df = df.where(pd.notnull(df), None)
    `.trim();
}

/**
 * Execute pandas code safely
 * @param {string} code - Pandas code to execute
 * @param {Array} currentData - Current CSV data
 * @returns {Promise<{success: boolean, result?: Array, error?: string}>}
 */
async function executePandasCode(code, currentData) {
    try {
        // Ensure Pyodide is initialized
        if (!pyodide && !(await initializePyodide())) {
            throw new Error('Failed to initialize Python environment');
        }
        
        // Set up the DataFrame
        const setupCode = convertDataToPython(currentData);
        pyodide.runPython(setupCode);
        
        // Validate the code one more time in JavaScript
        if (!isValidPandasCode(code)) {
            throw new Error('Code failed safety validation');
        }
        
        // Execute the user's code
        console.log('Executing code:', code);
        pyodide.runPython(`
# Store original df for comparison
original_df = df.copy()

# Execute user code
${code}

# Ensure df still exists
if 'df' not in locals():
    raise Exception("Code must maintain 'df' variable")
        `);
        
        // Get the result
        const resultDf = pyodide.runPython(`
# Convert result back to JSON
import json
result = df.to_dict('records')
json.dumps(result)
        `);
        
        const result = JSON.parse(resultDf);
        
        // Validate result
        if (!Array.isArray(result)) {
            throw new Error('Result is not a valid data structure');
        }
        
        console.log('Code executed successfully, result length:', result.length);
        
        return {
            success: true,
            result: result
        };
        
    } catch (error) {
        console.error('Error executing pandas code:', error);
        
        // Extract meaningful error message
        let errorMessage = error.message || 'Unknown error occurred';
        
        // Clean up Python traceback for user-friendly message
        if (errorMessage.includes('Traceback')) {
            const lines = errorMessage.split('\n');
            const lastLine = lines[lines.length - 1] || lines[lines.length - 2];
            if (lastLine && lastLine.includes(':')) {
                errorMessage = lastLine.split(':', 2)[1]?.trim() || errorMessage;
            }
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
}

/**
 * Basic code validation (duplicates your backend validation)
 * @param {string} code - Code to validate
 * @returns {boolean} - Whether code is safe
 */
function isValidPandasCode(code) {
    if (!code || !code.trim()) return false;
    
    // Check for dangerous patterns
    const blockedPatterns = [
        /import\s+/i,
        /__/,
        /os\./,
        /sys\./,
        /subprocess/i,
        /eval\s*\(/,
        /exec\s*\(/,
        /open\s*\(/,
        /pickle/i,
        /while\s+/,
        /for\s+(?!.*in\s+df)/,
        /lambda\s+/,
        /;/,
        /file/i,
        /write/i,
        /read_csv/i,
        /to_csv/i
    ];
    
    for (const pattern of blockedPatterns) {
        if (pattern.test(code)) {
            console.warn('Blocked pattern found:', pattern);
            return false;
        }
    }
    
    // Must contain DataFrame operations
    const allowedPatterns = [
        /df\s*[\.\[]/,
        /pd\./,
        /to_datetime/,
        /str\./,
        /fillna/,
        /drop/,
        /rename/,
        /apply/,
        /map/,
        /replace/,
        /astype/,
        /query/,
        /round/,
        /upper/,
        /lower/,
        /strip/,
        /dropna/,
        /isnull/,
        /value_counts/,
        /groupby/,
        /sort_values/
    ];
    
    return allowedPatterns.some(pattern => pattern.test(code));
}

/**
 * Check if Pyodide is ready for use
 * @returns {boolean} - Whether Pyodide is ready
 */
function isPyodideReady() {
    return !!pyodide;
}

/**
 * Get Pyodide initialization status
 * @returns {string} - Status message
 */
function getPyodideStatus() {
    if (pyodide) return 'Ready';
    if (isInitializing) return 'Initializing...';
    return 'Not initialized';
}

// Export functions
export { 
    initializePyodide, 
    executePandasCode, 
    isPyodideReady, 
    getPyodideStatus 
};