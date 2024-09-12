const fs = require('fs');
const path = require('path');

/**
 * Load JSON dictionary from a file.
 * @param {string} filePath - Path to the JSON file.
 * @returns {Object} - The loaded dictionary.
 */
function loadDictionary(filePath) {
    const fullPath = path.resolve(__dirname, '..', 'data', filePath);
    const data = fs.readFileSync(fullPath);
    return JSON.parse(data);
}

/**
 * Get the association dictionary.
 * @returns {Object} - The association dictionary.
 */
function getAssociations() {
    return loadDictionary('associations.json');
}

/**
 * Get the form dictionary.
 * @returns {Object} - The form dictionary.
 */
function getForms() {
    return loadDictionary('forms.json');
}

module.exports = { getAssociations, getForms };
