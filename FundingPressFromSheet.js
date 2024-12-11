const API_TOKEN = 'imk8ljyds81hzobrnlc4cq4ccpfj2jtg'; // Replace with your real API token
const URL_LIST_NAME = 'TechEUURLs';
const CRAWL_NAME = 'EEddeeeee';
const APP_NAME = 'TechEU'; // Adjust if necessary
const MAX_ATTEMPTS = 20; // Maximum attempts to check crawl status
const WAIT_TIME = 60000; // 1 minute in milliseconds

function initiateCrawl() {
  try {
    createURLList();
    startCrawl();
    checkCrawlStatusAndPopulateResults();
  } catch (error) {
    Logger.log("Error during the crawl process: " + error.message);
  }
}

function createURLList() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const urls = sheet.getRange("B2:B" + sheet.getLastRow()).getValues().flat().filter(url => url);

  if (urls.length === 0) {
    throw new Error("No URLs found in Column B.");
  }

  const url = `https://api.80legs.com/v2/urllists/${URL_LIST_NAME}`;
  const options = {
    method: 'put',
    contentType: 'application/json',
    payload: JSON.stringify(urls),
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode(API_TOKEN + ':')
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 403) {
    throw new Error("Authorization failed. Verify your API token and user account.");
  }

  const rawResult = response.getContentText();
  try {
    const processedResult = JSON.parse(rawResult);
    Logger.log("URL List created: " + JSON.stringify(processedResult));
  } catch (error) {
    Logger.log("Error parsing JSON: " + error.message);
  }
}

function startCrawl() {
  const url = `https://api.80legs.com/v2/crawls/${CRAWL_NAME}`;
  const options = {
    method: 'put',
    contentType: 'application/json',
    payload: JSON.stringify({
      urllist: URL_LIST_NAME,
      app: APP_NAME,
      max_depth: 0,
      max_urls: 1000
    }),
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode(API_TOKEN + ':')
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 403) {
    throw new Error("Crawl initiation failed. Verify your API token or crawl parameters.");
  }

  const rawResult = response.getContentText();
  try {
    const processedResult = JSON.parse(rawResult);
    Logger.log("Crawl started: " + JSON.stringify(processedResult));
  } catch (error) {
    Logger.log("Error parsing JSON: " + error.message);
  }
}

function checkCrawlStatusAndPopulateResults(attempt = 0) {
  if (attempt > MAX_ATTEMPTS) {
    Logger.log("Max attempts reached. Crawl may still be running.");
    return;
  }

  const url = `https://api.80legs.com/v2/crawls/${CRAWL_NAME}`;
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode(API_TOKEN + ':')
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 403) {
    throw new Error("Failed to fetch crawl status. Verify API token or crawl ID.");
  }

  const rawResult = response.getContentText();
  try {
    const data = JSON.parse(rawResult.replace(/\\'/g, "'").replace(/\\"/g, '"'));
    if (data.status === 'COMPLETED') {
      Logger.log("Crawl completed. Fetching results.");
      fetchAndPopulateResults();
    } else {
      Logger.log(`Crawl still running (Attempt ${attempt + 1}).`);
      Utilities.sleep(WAIT_TIME);
      checkCrawlStatusAndPopulateResults(attempt + 1);
    }
  } catch (error) {
    Logger.log("Error parsing JSON: " + error.message);
  }
}

function fetchAndPopulateResults() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const inputRange = sheet.getRange("B2:B" + sheet.getLastRow());
  const inputURLs = inputRange.getValues().flat().filter(url => url);

  const resultURLAPI = `https://api.80legs.com/v2/results/${CRAWL_NAME}`;
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode(API_TOKEN + ':')
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(resultURLAPI, options);
  if (response.getResponseCode() === 403) {
    throw new Error("Failed to fetch result URLs. Verify API token or crawl ID.");
  }

  let resultURLs;
  try {
    resultURLs = JSON.parse(response.getContentText());
    Logger.log("Crawler Results (URLs): " + JSON.stringify(resultURLs));
  } catch (error) {
    Logger.log("Error parsing JSON for result URLs: " + error.message);
    Logger.log("Raw response: " + response.getContentText());
    return; // Exit function since parsing failed
  }

  const urlToDataMap = {};

  // Process each result file URL
  resultURLs.forEach(resultFileURL => {
    if (!resultFileURL) {
      Logger.log("Result file URL is missing or invalid.");
      return;
    }

    Logger.log("Fetching result file from URL: " + resultFileURL);

    const resultResponse = UrlFetchApp.fetch(resultFileURL, { muteHttpExceptions: true });

    if (resultResponse.getResponseCode() !== 200) {
      Logger.log("Failed to fetch result file, response code: " + resultResponse.getResponseCode());
      Logger.log("Error response: " + resultResponse.getContentText());
      return;
    }

    Logger.log("Successfully fetched result file. Processing data...");

    try {
      const resultData = resultResponse.getContentText();

      if (!resultData || resultData.trim() === "") {
        Logger.log("The result file is empty. No data to process.");
        return;
      }

      Logger.log("Fetched Raw Data: " + resultData);

      // Parse JSON response for each result
      const parsedResultData = JSON.parse(resultData);

      parsedResultData.forEach(item => {
        try {
          const parsedItem = JSON.parse(JSON.parse(item.result)); // Double parse the `result` field
          const url = parsedItem.url || null;

          if (url) {
            urlToDataMap[url] = { result: item.result }; // Store the full `result` field
          } else {
            Logger.log("URL missing in parsed result item: " + JSON.stringify(parsedItem));
          }
        } catch (error) {
          Logger.log("Error parsing individual result item: " + error.message);
          Logger.log("Raw item: " + JSON.stringify(item));
        }
      });
    } catch (error) {
      Logger.log("Error parsing result data: " + error.message);
      Logger.log("Raw response: " + resultResponse.getContentText());
    }
  });

  Logger.log("Mapped URL to Data: " + JSON.stringify(urlToDataMap));

  // Write results to the sheet
  inputURLs.forEach((url, index) => {
    const row = index + 2; // Adjust for header row
    const data = urlToDataMap[url] || {};
    const result = data.result || "No result";

    Logger.log(`Writing data for URL: ${url} (Result: ${result})`);

    sheet.getRange(row, 3).setValue(url); // Column C: URL
    sheet.getRange(row, 4).setValue(result); // Column D: Full Result
  });

  Logger.log("Results written to sheet.");
}

