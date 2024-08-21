## How to run

To run the Puppeteer script, you'll need to follow these steps:

### 1. Install Node.js
If you haven't already installed Node.js, download and install it from the [official website](https://nodejs.org/). This will also install `npm`, the Node.js package manager.

### 2. Install Dependencies
Navigate to the directory where your script is located and install the required Node.js packages by running the following command:

```bash
npm install puppeteer googleapis minimist
```

This command will install Puppeteer, Google APIs, and Minimist, which are required for the script.

### 3. Set Up Google Drive API
To interact with Google Drive, you need to set up the Google Drive API:

1. **Create a Project in Google Cloud Console:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project.

2. **Enable Google Drive API:**
   - In your project, search for "Google Drive API" and enable it.

3. **Create OAuth 2.0 Credentials:**
   - Go to the **Credentials** page.
   - Click **Create Credentials** and select **OAuth 2.0 Client ID**.
   - Configure the consent screen and select **Desktop App** for the application type.
   - Download the `credentials.json` file.

4. **Place `credentials.json` in Your Project Directory:**
   - Save the `credentials.json` file in the same directory as your script.

### 4. Run the Script
To run the script, use the following command in your terminal:

```bash
node your-script.js --email "your-email@example.com" --password "your-password" --form-type "form-type-number" --parent-folder-id "Google-Drive-folder-id"
```

- Replace `your-script.js` with the actual name of your script file.
- Replace `"your-email@example.com"` and `"your-password"` with your login credentials.
- Replace `"form-type-number"` with the appropriate form type number.
- Replace `"Google-Drive-folder-id"` with the parent folder ID from Google Drive where you want to store the PDFs.

### 5. Authentication (First-Time Setup)
When you run the script for the first time, it will prompt you to authenticate with Google. You will need to open the provided URL in a browser, authorize the app, and paste the resulting code back into the terminal.

### 6. Check Outputs
- **PDF Files:** Check the `/path/to/downloads/` folder (as specified in the script) for the saved PDFs.
- **Google Drive:** Verify that the PDFs are uploaded to the specified folders in Google Drive.

### 7. Troubleshooting
If you encounter any issues:
- Ensure that all dependencies are installed correctly.
- Verify your Google Drive credentials and ensure the `credentials.json` file is in the correct location.
- Check for Puppeteer errors, such as missing dependencies, by inspecting the console logs.

### Example Command:
```bash
node myscript.js --email "john.doe@example.com" --password "mypassword" --form-type "3" --parent-folder-id "1a2b3c4d5e6f"
```

This command runs the script, logging into the website with the specified credentials, navigating to the required pages, saving PDFs, and uploading them to Google Drive.

