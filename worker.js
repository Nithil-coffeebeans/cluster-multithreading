const sharp = require("sharp");
const { parentPort } = require("worker_threads");

parentPort.on("message", async ({ inputPath, outputPath, width, height }) => {
  try {
    await sharp(inputPath).resize(width, height).toFile(outputPath);
    parentPort.postMessage({ status: "done", outputPath });
  } catch (error) {
    parentPort.postMessage({ status: "error", error: error.message });
  }
});
