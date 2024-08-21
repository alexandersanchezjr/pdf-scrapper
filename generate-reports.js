const puppeteer = require('puppeteer');
const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { log } = require('console');

// Base URL of the website
const baseUrl = "https://programaintegraldefruticultura.com.co";

// Logging setup
function logInfo(message) {
    console.log(`${new Date().toISOString()} - INFO - ${message}`);
}

function logError(message) {
    console.error(`${new Date().toISOString()} - ERROR - ${message}`);
}

// Function to ensure directory existence
function existsFolder(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
        console.log(`Created directory: ${dirname}`);
    }
}

// Google Drive setup
async function setupGoogleDrive() {
    try {
        const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
        const TOKEN_PATH = 'token.json';
        const credentials = JSON.parse(fs.readFileSync('gdrive-credentials.json'));
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        if (fs.existsSync(TOKEN_PATH)) {
            const token = fs.readFileSync(TOKEN_PATH);
            oAuth2Client.setCredentials(JSON.parse(token));
        } else {
            // Get new token and save it
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
            });
            console.log('Authorize this app by visiting this url:', authUrl);
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            const code = await new Promise(resolve => rl.question('Enter the code from that page here: ', resolve));
            rl.close();
            const token = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(token.tokens);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token.tokens));
        }
        return google.drive({version: 'v3', auth: oAuth2Client});
    } catch (e) {
        logError(`Failed to authenticate with Google Drive: ${e}`);
        throw e;
    }
}

// Create a folder in Google Drive if it doesn't exist
async function createFolder(drive, parentFolderId, folderName) {
    try {
        const fileMetadata = {
            name: folderName,
            parents: [parentFolderId],
            mimeType: 'application/vnd.google-apps.folder',
        };
        const file = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        logInfo(`Created folder '${folderName}' in Google Drive.`);
        return file.data.id;
    } catch (e) {
        logError(`Failed to create folder '${folderName}': ${e}`);
        throw e;
    }
}

// Save PDF to Google Drive
async function savePdfToDrive(drive, filePath, folderId) {
    try {
        const fileMetadata = {
            name: path.basename(filePath),
            parents: [folderId],
        };
        const media = {
            mimeType: 'application/pdf',
            body: fs.createReadStream(filePath),
        };
        await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });
        logInfo(`Uploaded PDF '${filePath}' to Google Drive.`);
    } catch (e) {
        logError(`Failed to upload PDF '${filePath}': ${e}`);
        throw e;
    }
}

// Main function
async function main(email, password, formType, parentFolderId) {
    let browser;
    try {
        // Launch Puppeteer browser
        browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        logInfo("Initialized Puppeteer.");

        // Login to the website
        const loginUrl = `${baseUrl}/login`;
        await page.goto(loginUrl);
        await page.type('input[name=email]', email);  // Update if necessary
        await page.type('input[name=password]', password);  // Update if necessary
        await page.click('button[type=submit]');  // Update if necessary
        logInfo("Logging in to the website...");
        // await page.waitForNavigation({ timeout: 60000 });
        logInfo("Logged in to the website.");

        // Association ID to Name mapping
        const associationDict = {
            1: "AGRODEVIFLO", 2: "APRHOSEPAS", 3: "ASOACBA", 5: "ASOAGROPBICOL", 6: "ASOAIRES",
            7: "ASOALBECIA", 8: "ASOBONANZA", 9: "ASOCFRUTEROS", 10: "ASOFRUNIDOS", 11: "ASOFRUTIFLOR",
            12: "ASOMUEVER", 13: "ASOPLAYBA", 14: "ASOPROACAM", 16: "ASOTATAMÁ", 17: "ASPROCAMPO",
            18: "ASPROPLATCA", 19: "CORPOVERSALLES", 20: "NASAFRUT", 21: "NAVISA", 22: "PRAMAN",
            23: "TRANSFORMADORES DE VIDA"
        };

        // const drive = await setupGoogleDrive();

        // Create the base folder for {form_type} inside Google Drive
        // const baseFolderId = await createFolder(drive, parentFolderId, formType);

        // Iterate through association IDs
        for (const [associationId, associationName] of Object.entries(associationDict)) {
            if ([4, 15].includes(parseInt(associationId))) {
                logInfo(`Skipping association ID ${associationId}.`);
                continue;
            }

            // Create a folder for each association under the base folder
            // const pdfFolderId = await createFolder(drive, baseFolderId, associationName);

            // Navigate to the route containing the association ID and form type
            const reportUrl = `${baseUrl}/report-pdf/${associationId}/${formType}`;
            await page.goto(reportUrl);
            logInfo(`Navigated to report URL: ${reportUrl}`);

            // Wait for the td element to be present
            // await page.waitForSelector('td');

            const tdElements = await page.$$('td');
            if (tdElements.length === 0) {
                logInfo(`No <td> elements found for the current page.`);
                logInfo(`No valid number values found for association ID ${associationId}.`);
                continue; // Exit the function or skip to the next iteration
            }

            // Extract the number values from the HTML table
            const idValues = await page.evaluate(() =>
                Array.from(document.querySelectorAll('td'))
                    .map(td => td.textContent.trim())
                    .filter(text => /^\d+\/\d+$/.test(text))
            );

            if (!idValues.length) {
                logInfo(`No valid number values found for association ID ${associationId}.`);
                continue;
            }

            for (const idValue of idValues) {
                // Navigate to the new route
                const surveyUrl = `${baseUrl}/survey-pdf/${idValue}`;
                await page.goto(surveyUrl);
                logInfo(`Navigated to survey URL: ${surveyUrl}`);

                // // Trigger the print method
                // await page.waitForSelector('#print-button');
                // await page.click('#print-button');
                // logInfo("Triggered print dialog.");

                // Save the PDF
                const pdfPath = `C:/Reports/${formType}/${associationName}/${await page.title()}.pdf`;
                existsFolder(pdfPath);
                await page.pdf({path: pdfPath, format: 'Letter'});
                logInfo(`Saved PDF to '${pdfPath}'.`);

                // Upload the PDF to Google Drive
                // await savePdfToDrive(drive, pdfPath, pdfFolderId);
            }
        }
    } catch (e) {
        logError(`An error occurred: ${e}`);
    } finally {
        if (browser) {
            await browser.close();
            logInfo("Closed Puppeteer.");
        }
    }
}

// Run the script
const args = require('minimist')(process.argv.slice(2));
main(args.email, args.password, args['form-type'], args['parent-folder-id']);
