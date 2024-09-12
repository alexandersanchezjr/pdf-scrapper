Here is an updated version of the `README.md` that includes the **association map**:

---

# Puppeteer + Google Drive Integration Script

This script automates the process of downloading reports in PDF format from a website using Puppeteer and uploading the downloaded reports to Google Drive using the Google Drive API. The reports are categorized by form type, association, and date (month/year). The script also supports generating reports for a specific month or a date range and uploading them into structured directories in Google Drive.

## Prerequisites

1. **Node.js**: Ensure you have [Node.js](https://nodejs.org/) installed on your machine.
2. **Google Cloud Project**: Set up a Google Cloud project with OAuth2 credentials and enable the Google Drive API.
3. **Puppeteer**: The script uses Puppeteer for headless browser automation.
4. **Google Drive API**: The script uses Google APIs for authentication and file uploads to Google Drive.
5. **Google API Credentials**: You must create OAuth 2.0 credentials and download the `credentials.json` file from the Google Cloud Console.

## Installation

1. Clone this repository:

    ```bash
    git clone https://github.com/programa-integral-de-fruticultura-5/pdf-scrapper.git
    cd pdf-scrapper
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Place your **Google API OAuth2 credentials** file named `credentials.json` in the root directory of the project.

## Configuration

The script expects two configuration files for Google Drive and Puppeteer settings:

1. **credentials.json**: This is the OAuth 2.0 client credentials downloaded from the Google Cloud Console. It should be placed in the root directory of your project.
2. **token.json**: Once you authenticate the first time, your OAuth tokens will be saved in this file for reuse in subsequent runs.

## Parameters

The script accepts several parameters for generating reports:

- **email** (required): The email to log in to the website.
- **password** (required): The password to log in to the website.
- **year** (required): The year to generate reports from.
- **month-start** (optional): The starting month (e.g., `01` for January). If this parameter is provided, the script will generate reports starting from this month.
- **month-end** (optional): The ending month (e.g., `12` for December). If provided along with `month-start`, the script will generate reports for the entire range.
- **form-type** (optional): The form type number to specify which reports to generate. If not passed, the script will generate all form types.
- **parent-folder-id** (required): The Google Drive folder ID where the reports will be uploaded.

### Association Map

The association IDs map to their corresponding association names as follows:

| Association ID | Association Name        |
|----------------|-------------------------|
| 1              | AGRODEVIFLO              |
| 2              | APRHOSEPAS               |
| 3              | ASOACBA                  |
| 5              | ASOAGROPBICOL            |
| 6              | ASOAIRES                 |
| 7              | ASOALBECIA               |
| 8              | ASOBONANZA               |
| 9              | ASOCFRUTEROS             |
| 10             | ASOFRUNIDOS              |
| 11             | ASOFRUTIFLOR             |
| 12             | ASOMUEVER                |
| 13             | ASOPLAYBA                |
| 14             | ASOPROACAM               |
| 16             | ASOTATAMÁ                |
| 17             | ASPROCAMPO               |
| 18             | ASPROPLATCA              |
| 19             | CORPOVERSALLES           |
| 20             | NASAFRUT                 |
| 21             | NAVISA                   |
| 22             | PRAMAN                   |
| 23             | TRANSFORMADORES DE VIDA  |

Associations with IDs 4 and 15 are skipped by the script.

### Form Types Mapping

When using the `form-type` parameter, the script supports the following form types:

| Form Number | Form Name                                      |
|-------------|------------------------------------------------|
| 1           | CARACTERIZACIÓN / ASISTENCIA ESPECIALIZADA     |
| 5           | ASISTENCIA TÉCNICA - VISITA DE SOSTENIMIENTO   |
| 7           | VISITA ENTREGA DE INSUMOS                      |
| 8           | VISITA TOMA DE MUESTRAS                        |
| 9           | VISITA CAPACITACIÓN                            |
| 10          | VISITA DOCUMENTO TENENCIA                      |
| 11          | ENTREGA DE PARCELA INNOVADORA CORPOVALLE       |
| 12          | ENTREGA DE INSUMOS - PARCELA INNOVADORA        |
| 13          | ENTREGA DE CASA MALLA TIPO ESPACIAL            |
| 14          | ENTREGA DE INSUMOS - CASA MALLA TIPO ESPACIAL  |
| 15          | AT SOSTENIMIENTO - PARCELA INNOVADORA CORPOVALLE |
| 16          | AT SOSTENIMIENTO - CASA MALLA TIPO ESPACIAL    |

### Example Usage

Here are some example commands to run the script:

1. **Generate reports for all form types in a specific year (e.g., 2024):**

    ```bash
    node index.js --email "your-email@example.com" --password "your-password" --year 2024 --parent-folder-id "your-google-drive-folder-id"
    ```

2. **Generate reports for a specific form type (e.g., form type 5):**

    ```bash
    node index.js --email "your-email@example.com" --password "your-password" --year 2024 --form-type 5 --parent-folder-id "your-google-drive-folder-id"
    ```

3. **Generate reports for a specific month (e.g., March 2024):**

    ```bash
    node index.js --email "your-email@example.com" --password "your-password" --year 2024 --month-start 03 --parent-folder-id "your-google-drive-folder-id"
    ```

4. **Generate reports for a range of months (e.g., from March 2024 to July 2024):**

    ```bash
    node index.js --email "your-email@example.com" --password "your-password" --year 2024 --month-start 03 --month-end 07 --parent-folder-id "your-google-drive-folder-id"
    ```

### Directory Structure for Reports

The script will save PDF reports in the following directory structure:

```
C:/Reports/{Month in Spanish}/{Form Name}/{Association Name}/{Report Title}.pdf
```

Example:

```
C:/Reports/Marzo/CARACTERIZACIÓN / ASISTENCIA ESPECIALIZADA/AGRODEVIFLO/Report Title.pdf
```

- **{Month in Spanish}**: The month name is translated to Spanish, such as "Enero" for January, "Marzo" for March, etc.
- **{Form Name}**: The form name is based on the form type provided.
- **{Association Name}**: The association name is derived from the association mapping.

## Google Drive Integration

The script uses the **Google Drive API** to upload the generated PDF reports. It creates a folder structure in Google Drive as follows:

```
Google Drive/{Form Type}/{Association Name}/{Report Title}.pdf
```

## Authentication

The first time you run the script, it will prompt you to visit an authorization URL to authenticate the app with your Google account. You’ll need to paste the authorization code back into the terminal. This will generate a `token.json` file that contains your OAuth2 tokens. Subsequent runs will use this token without needing to reauthenticate.

## Logging

The script uses a logging service (like `winston` or `log4js`) to output log messages. You can track the progress and errors through these log messages.

## Error Handling

- The script handles errors when:
  - Authentication with Google fails.
  - No PDF reports are found for a given form type or month.
  - Any issues arise while generating or saving the PDF files.
  
  In case of errors, appropriate messages will be logged using the logging service.

## License

This project is licensed under the MIT License.

---

This `README.md` now includes the **association map** for reference. You can further customize it based on your project's requirements.