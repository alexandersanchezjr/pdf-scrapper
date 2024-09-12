const puppeteer = require('puppeteer');

/**
 * Launch Puppeteer browser instance.
 * @returns {Promise<puppeteer.Browser>} - Puppeteer browser instance.
 */
async function launchBrowser() {
    return await puppeteer.launch({ headless: true });
}

/**
 * Save the page as a PDF.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {string} pdfPath - Path to save the PDF file.
 */
async function savePageAsPdf(page, pdfPath) {
    page.waitForSelector('#print-button');
    await page.pdf({ path: pdfPath, format: 'Letter' });
    console.log(`Saved PDF to '${pdfPath}'.`);
}

module.exports = { launchBrowser, savePageAsPdf };
