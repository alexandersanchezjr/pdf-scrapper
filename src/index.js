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
        await page.setDefaultNavigationTimeout(60000); 
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
                    try {
                        await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 60000 });
                    } catch (error) {
                        logger.error(`An error occurred while navigating to report URL: ${reportUrl}. Retrying...`);
                        await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 60000 });
                    }
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
                        try {
                            await page.goto(surveyUrl, { waitUntil: 'networkidle0', timeout: 60000 });
                        } catch (error) {
                            logger.error(`The error ${error} occurred while navigating to survey URL: ${surveyUrl}. Retrying...`);
                            await page.goto(surveyUrl, { waitUntil: 'networkidle0', timeout: 60000 });
                        }
                        logger.info(`Navigated to survey URL: ${surveyUrl}`);

                        const folderPath = `${year.toString()}/${spanishMonth}/${formName}/${associationName}`;
                        var filename = await page.title();
                        logger.info(`Original Title: ${filename}`);
                        filename = filename.replace(/\//g, '_');
                        logger.info(`Modified Title: ${filename}`);

                        // Define the PDF file path
                        const pdfPath = path.join(__dirname, 'pdfs', folderPath, `${filename}.pdf`);
                        existsFolder(pdfPath);

                        // Save the PDF
                        await savePageAsPdf(page, pdfPath);

                        // Upload PDF to Google Drive
                        const folderId = await createFolder(drive, parentFolderId, folderPath);
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

// Parse command-line arguments using minimist with default values and aliases
const args = minimist(process.argv.slice(2), {
    alias: {
        e: 'email',
        p: 'password',
        f: 'form-type',
        y: 'year',
        s: 'month-start',
        m: 'month-end',
        i: 'parent-folder-id'
    },
    default: {
        'form-type': null,  // If no form type is passed, generate for all types
        'year': new Date().getFullYear(),  // Default to the current year
        'month-start': 1,  // Default start month is January
        'month-end': 12  // Default end month is December
    }
});

// Normalize arguments and validate them
function normalizeArguments(args) {
    logger.info(`Received arguments: ${JSON.stringify(args)}`);

    const email = args.email;
    const password = args.password;
    const formType = args['form-type'];
    const year = parseInt(args.year);
    const startMonth = parseInt(args['month-start']);
    const endMonth = parseInt(args['month-end']);
    const parentFolderId = args['parent-folder-id'];

    if (!email || !password) {
        logger.error("Email and password are required.");
        process.exit(1);
    }

    if (startMonth > endMonth) {
        logger.error("Start month cannot be greater than end month.");
        process.exit(1);
    }

    logger.info(`Running script with the following parameters:
    \t\t\t\tEmail: ${email}
    \t\t\t\tPassword: [HIDDEN]
    \t\t\t\tForm Type: ${formType}
    \t\t\t\tYear: ${year}
    \t\t\t\tStart Month: ${startMonth}
    \t\t\t\tEnd Month: ${endMonth}
    \t\t\t\tParent Folder ID: ${parentFolderId || 'None provided'}`);
    
    return { email, password, formType, year, startMonth, endMonth, parentFolderId };
}

// Extract and normalize arguments
const { email, password, formType, year, startMonth, endMonth, parentFolderId } = normalizeArguments(args);

// Execute main function
main(email, password, year, startMonth, endMonth, formType, parentFolderId)
    .then(() => logger.info("Script execution finished successfully."))
    .catch(error => logger.error(`Script failed with error: ${error.message}`));