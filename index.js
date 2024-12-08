const axios = require("axios");
const fs = require("fs");
const path = require("path");
const withFiles = false;
const URL = `https://trasul.gph.gov.sa`;
const downloadFile = async (url, destination) => {
  try {
    // Ensure the destination directory exists
    createDirectoryIfNotExists(path.dirname(destination));

    const writer = fs.createWriteStream(destination);
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading file from ${url}: ${error.message}`);
    if (fs.existsSync(destination)) {
      fs.unlinkSync(destination); // Remove incomplete file
    }
  }
};

const createDirectoryIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const writeFileSafely = (filePath, content) => {
  createDirectoryIfNotExists(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
};

const fetchAndProcessSteps = async (stepIds) => {
  let steps = [];

  for (const id of stepIds) {
    const { data: stepData } = await axios.get(
      `${URL}/haram-api/public/api/vss/TawafSteps/${id}`
    );
    steps = [...steps, ...stepData["Steps"]];
  }

  for (const step of steps) {
    const { data: fileData } = await axios.get(
      `${URL}/haram-api/public/api/vss/TawafDoaa/${step.id}`
    );

    if (fileData["Doaa"]) {
      const stepDir = path.join("steps");
      createDirectoryIfNotExists(stepDir);

      for (const doaa of fileData["Doaa"]) {
        if (doaa.audioNumber) {
          const audioPath = path.join(
            `${stepDir}/${step.id}`,
            path.basename(doaa.audioNumber)
          );
          if (withFiles) {
            console.log(`Downloading audio to: ${audioPath}`);
            await downloadFile(
              `${URL}/apps/public/doaaFileMaster/${doaa.audioNumber}`,
              audioPath
            );
          }
        }
      }

      // Write the JS file for this step in its specific directory
      const jsFilePath = path.join(stepDir, `file_${step.id}.js`);
      writeFileSafely(
        jsFilePath,
        `export const data = ${JSON.stringify(fileData["Doaa"], null, 2)};`
      );
    }
  }
};

const fetchAndSaveLocations = async () => {
  const { data } = await axios.get(
    `${URL}/haram-api/public/api/vss/TawafLocations`
  );

  writeFileSafely(
    "metadata/addressesData.js",
    `export const addresses = ${JSON.stringify(data, null, 2)};`
  );
};

const fetchAndSaveStepsData = async (stepIds) => {
  let steps = [];

  for (const id of stepIds) {
    const { data: stepData } = await axios.get(
      `${URL}/haram-api/public/api/vss/TawafSteps/${id}`
    );
    steps = { ...steps, [id]: stepData["Steps"] };
  }

  writeFileSafely(
    "metadata/stepsData.js",
    `export const stepsData = ${JSON.stringify(steps, null, 2)};`
  );
};

const main = async () => {
  try {
    // Ensure the base directory for steps exists
    createDirectoryIfNotExists("steps");

    await fetchAndSaveLocations();
    await fetchAndProcessSteps([1, 2]);
    await fetchAndSaveStepsData([1, 2]);
    console.log("Data processing completed successfully.");
  } catch (error) {
    console.error(`Error in main execution: ${error.message}`);
  }
};

main();
