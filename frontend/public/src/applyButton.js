//frontend/public/src/applyButton.js

/**
 * Detects if the response is executable pandas code
 * @param {string} code - The generated code from AI
 * @returns {boolean} - True if code should have apply button
 */
function isExecutableCode(code) {
    // Handle empty or null code
    if (!code || !code.trim()) return false;
    
    // Check for standard non-executable responses
    const nonExecutableResponses = [
        "Can you elaborate?",
        "This operation is not possible"
    ];
    if (nonExecutableResponses.some(response => code.includes(response))) {
        return false;
    }
    // Check if it starts with comment (error messages)
    if (code.trim().startsWith("#")) {
        return false;
    }
    // Must contain df. or pandas operations (basic validation)
    const hasDataFrameOperation = /df\s*[\.\[]/.test(code);
    const hasPandasOperation = /pd\./.test(code);
    return hasDataFrameOperation || hasPandasOperation;
}

/**
 * Creates and adds apply button to a message
 * @param {string} code - The pandas code to execute
 * @param {HTMLElement} messageElement - The message div to add button to
 */
function addApplyButton(code, messageElement, provider = 'Gemini') {
    // Check if button already exists (prevent duplicates)
    if (messageElement.querySelector('.button-container')) return;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Create button group
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';

    // Add API badge
    const apiBadge = document.createElement('div');
    apiBadge.className = 'api-badge';
    apiBadge.textContent = provider;

    // Add Apply button
    const applyButton = document.createElement('button');
    applyButton.className = 'apply-button';
    applyButton.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
        </svg>
        <span>Apply</span>
    `;
    
    // Store the code in the button for execution
    applyButton.dataset.code = code;
    
    // Add click handler
    applyButton.addEventListener('click', () => handleApplyClick(applyButton));
    
    // Assemble the UI
    buttonGroup.appendChild(applyButton);
    buttonContainer.appendChild(apiBadge);
    buttonContainer.appendChild(buttonGroup);
    messageElement.appendChild(buttonContainer);
}

/**
 * Handles the apply button click
 * @param {HTMLButtonElement} button - The clicked apply button
 */
async function handleApplyClick(button) {
    const code = button.dataset.code;
    
    // Disable button during execution
    button.disabled = true;
    button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2v4l-1.5-1.5M12 2v4l1.5-1.5M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </svg>
        Applying...
    `;
    
    try {
        // Check if currentData exists
        if (!currentData || currentData.length === 0) {
            throw new Error('No data to apply changes to. Please upload a CSV file first.');
        }
        // Execute the code (we'll implement this in Phase 2)
        await executeCode(code);
        // Show success state
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Applied ✓
        `;
        button.className = 'apply-button applied';
        // Display success message
        displayMessage('Changes applied successfully!', 'system-message success-message');
    } catch (error) {
        console.error('Error applying code:', error);
        // Show error state
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"/>
            </svg>
            Error
        `;
        button.className = 'apply-button error';
        // Display error message
        displayMessage(`Error applying changes: ${error.message}`, 'error-message');
        // Re-enable button after 3 seconds
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Retry Apply
            `;
            button.className = 'apply-button';
        }, 3000);
    }
}

/**
 * Placeholder for code execution - will be implemented with Pyodide in Phase 2
 * @param {string} code - The pandas code to execute
 */
async function executeCode(code) {
    // This is a placeholder - we'll implement Pyodide execution here
    console.log('Code to execute:', code);
    
    // For now, simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Throw error for demonstration
    throw new Error('Code execution not yet implemented. Please wait for Phase 2!');
}

// Export functions for use in main app.js
export { isExecutableCode, addApplyButton };