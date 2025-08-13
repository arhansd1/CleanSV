// contextBuilder.js

// Function to extract CSV context (headers + first 3 rows)
export function getCSVContext(csvData) {
    if (!csvData || csvData.length === 0) return "";
    
    // Get headers
    const headers = Object.keys(csvData[0]).join(' | ');
    
    // Get first 3 rows
    const rows = csvData.slice(0, 3).map(row => {
        return Object.values(row).join(' | ');
    }).join('\n');
    
    return `${headers}\n${rows}`;
}

// Function to format the full prompt matching your training data
export function buildPromptForModel(context, instruction) {
    return `<|user|>\nContext:\n${context}\n\nInstruction: ${instruction}\n\n<|assistant|>`;
}

// Function to get current context and instruction
export function getCurrentContextAndInstruction(userInput, csvData) {
    const context = getCSVContext(csvData);
    const instruction = userInput;
    const fullPrompt = buildPromptForModel(context, instruction);
    
    return {
        context,
        instruction,
        fullPrompt
    };
}