const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const express = require('express');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = 'token.json';

/**
 * Setup Google Drive API authentication.
 * @returns {Promise<google.drive_v3.Drive>} - Google Drive API client.
 */
async function setupGoogleDrive() {
    try {
        const credentials = JSON.parse(fs.readFileSync('credentials.json'));
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        if (fs.existsSync(TOKEN_PATH)) {
            const token = fs.readFileSync(TOKEN_PATH);
            oAuth2Client.setCredentials(JSON.parse(token));
        } else {
            await getAccessToken(oAuth2Client);
        }
        return google.drive({ version: 'v3', auth: oAuth2Client });
    } catch (e) {
        logger.error(`Failed to authenticate with Google Drive: ${e}`);
        throw e;
    }
}

/**
 * Get a new access token, automatically opens the authorization URL in a Puppeteer-controlled browser,
 * and saves the token to `token.json`. Once the token is saved, the browser is closed.
 *
 * @param {OAuth2Client} oAuth2Client - The OAuth2 client initialized with client_id, client_secret, and redirect URIs.
 * @returns {Promise<void>} - This function does not return any value.
 */
async function getAccessToken(oAuth2Client) {
    // Generate an authorization URL for the user to visit and grant access.
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Get a refresh token for long-term access.
        scope: SCOPES, // Define the scope of access (e.g., Google Drive).
    });
    logger.info('Opening the browser for authorization...');

    // Dynamically import the 'open' ES module.
    const { default: open } = await import('open');

    // Open the URL in the default browser 
    await open(authUrl); 

    // Set up a local Express server to capture the authorization code.
    const app = express();
    const port = 3000;

    // Handle the OAuth2 callback when the user grants access.
    app.get('/', (req, res) => {
        const code = req.query.code; // Extract the authorization code from the URL query parameters.

        // If the code is not provided, return an error message to the user.
        if (!code) {
            res.send('Authorization failed. No code provided.');
            return;
        }

        // Exchange the authorization code for an access token.
        oAuth2Client.getToken(code, async (err, token) => {
            if (err) return console.error('Error retrieving access token', err);

            // Set the retrieved access token for the OAuth2 client.
            oAuth2Client.setCredentials(token);

            // Store the token in a local file (token.json) for future authentication.
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            logger.info('Token stored to ' + TOKEN_PATH);

            // Inform the user that the authorization was successful.
            res.send('Authorization successful! You can now close this tab.');

            // Close the Express server after token is saved and authorization is successful.
            server.close(() => {
                logger.info('Authorization process complete. Server closed.');
            });
        });
    });

    // Start the Express server to listen for OAuth2 callbacks on port 3000.
    const server = app.listen(port, () => {
        console.log(`Listening on port ${port}. Waiting for authorization callback...`);
    });
}

/**
 * Create a folder in Google Drive.
 * @param {google.drive_v3.Drive} drive - Google Drive API client.
 * @param {string} parentFolderId - Parent folder ID in Google Drive.
 * @param {string} folderName - Name of the folder to create.
 * @returns {Promise<string>} - The ID of the created folder.
 */
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
        logger.info(`Created folder '${folderName}' in Google Drive.`);
        return file.data.id;
    } catch (e) {
        logger.error(`Failed to create folder '${folderName}': ${e}`);
        throw e;
    }
}

/**
 * Upload a PDF file to Google Drive.
 * @param {google.drive_v3.Drive} drive - Google Drive API client.
 * @param {string} filePath - Local path of the PDF file.
 * @param {string} folderId - Google Drive folder ID to upload to.
 */
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
        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        logger.info(`Uploaded PDF '${filePath}' to Google Drive.`);

        // After successful upload, delete the file from local storage
        if (response.status === 200) {
            fs.unlinkSync(filePath);  // Delete the file
            logger.info(`Deleted local file '${filePath}' after successful upload.`);
        } else {
            logger.error(`Failed to upload file '${filePath}' to Google Drive.`);
        }
    } catch (e) {
        logger.error(`Failed to upload PDF '${filePath}': ${e}`);
        throw e;
    }
}

module.exports = { setupGoogleDrive, createFolder, savePdfToDrive };
