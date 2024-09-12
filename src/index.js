const { launchBrowser, savePageAsPdf } = require('./puppeteer/puppeteerUtils');
const { setupGoogleDrive, createFolder, savePdfToDrive } = require('./utils/gdriveUtils');
const { existsFolder } = require('./utils/fileUtils');
const { getSpanishMonth, generateMonths } = require('./utils/dateUtils');
const { getAssociations, getForms } = require('./utils/dictUtils');
const logger = require('./utils/logger');
const minimist = require('minimist');
const path = require('path');

// Base URL of the website
const baseUrl = "https://programaintegraldefruticultura.com.co";

async function main(email, password, year, startMonth, endMonth, formType, parentFolderId) {
    let browser;
    try {
        // Load dictionaries
        const associations = getAssociations();
        const forms = getForms();

        // Launch Puppeteer browser
        browser = await launchBrowser();
        const page = await browser.newPage();
        logger.info("Initialized Puppeteer.");

        // Login to the website
        const loginUrl = `${baseUrl}/login`;
        await page.goto(loginUrl);
        await page.type('input[name=email]', email);  // Update if necessary
        await page.type('input[name=password]', password);  // Update if necessary
        await page.click('button[type=submit]');  // Update if necessary
        logger.info("Logging in to the website...");
        logger.info("Logged in to the website.");

        // Determine date range based on passed parameters
        const months = generateMonths(startMonth, endMonth);

        // Determine form types to generate if not passed
        const formTypes = formType ? [formType] : Object.keys(forms).map(Number);

        // Setup Google Drive
        const drive = await setupGoogleDrive();

        // Iterate through each month and form type
        for (const month of months) {
            for (const form of formTypes) {
                const spanishMonth = getSpanishMonth(month);
                const formName = forms[form];

                // Iterate through association IDs
                for (const [associationId, associationName] of Object.entries(associations)) {
                    if ([4, 15].includes(parseInt(associationId))) {
                        logger.info(`Skipping association ID ${associationId}.`);
                        continue;
                    }

                    // Navigate to the route containing the association ID, form type, and month-year
                    const reportUrl = `${baseUrl}/report-pdf/${associationId}/${form}/${month}-${year}`;
                    await page.goto(reportUrl);
                    logger.info(`Navigated to report URL: ${reportUrl}`);

                    const tdElements = await page.$$('td');
                    if (tdElements.length === 0) {
                        logger.info(`No <td> elements found for association ID ${associationId} in ${spanishMonth} for form ${form}.`);
                        continue;
                    }

                    // Extract the number values from the HTML table
                    const idValues = await page.evaluate(() =>
                        Array.from(document.querySelectorAll('td'))
                            .map(td => td.textContent.trim())
                            .filter(text => /^\d+\/\d+$/.test(text))
                    );

                    if (!idValues.length) {
                        logger.info(`No valid number values found for association ID ${associationId}.`);
                        continue;
                    }

                    for (const idValue of idValues) {
                        const surveyUrl = `${baseUrl}/survey-pdf/${idValue}`;
                        await page.goto(surveyUrl);
                        logger.info(`Navigated to survey URL: ${surveyUrl}`);

                        // Define the PDF file path
                        const pdfPath = path.join(__dirname, 'pdfs', associationName, `${formName}-${spanishMonth}-${year}.pdf`);
                        existsFolder(pdfPath);

                        // Save the PDF
                        await savePageAsPdf(page, pdfPath);

                        // Upload PDF to Google Drive
                        const folderId = await createFolder(drive, parentFolderId, associationName);
                        await savePdfToDrive(drive, pdfPath, folderId);
                    }
                }
            }
        }
    } catch (e) {
        logger.error(`An error occurred: ${e.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Command line argument parsing
const args = minimist(process.argv.slice(2));
const { email, password, year, startMonth, endMonth, formType, parentFolderId } = args;

// Validate required parameters
if (!email || !password || !year) {
    logger.error("Required parameters: --email, --password, --year");
    process.exit(1);
}

// Execute main function
main(email, password, year, startMonth, endMonth, formType, parentFolderId);
