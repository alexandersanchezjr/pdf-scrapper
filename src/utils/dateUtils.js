const logger = require('./logger');

/**
 * Convert month number to Spanish name.
 * @param {number} monthNumber - The month number (1-12).
 * @returns {string} - The Spanish name of the month.
 */
function getSpanishMonth(monthNumber) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
        'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNumber - 1];
}

/**
 * Generate an array of months based on provided parameters.
 * @param {number} startMonth - The starting month (1-12).
 * @param {number} endMonth - The ending month (1-12).
 * @returns {number[]} - An array of months.
 */
function generateMonths(startMonth, endMonth) {
    const months = [];
    logger.info(`Generating months from ${startMonth} to ${endMonth}.`);
    if (!startMonth && !endMonth) {
        for (let i = 1; i <= 12; i++) {
            months.push(i);
        }
    } else if (startMonth && endMonth) {
        for (let i = startMonth; i <= endMonth; i++) {
            months.push(i);
        }
    } else {
        months.push(startMonth);
    }
    return months;
}

module.exports = { getSpanishMonth, generateMonths };
