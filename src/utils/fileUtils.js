const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Ensure that a directory exists; create it if it does not.
 * @param {string} filePath - The file path to ensure directory for.
 */
function existsFolder(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
        logger.info(`Created directory: ${dirname}`);
    }
    logger.info(`Directory exists: ${dirname}`);
}

module.exports = { existsFolder };