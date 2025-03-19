const express = require("express");
const cluster = require("cluster");
const os = require("os");
const { Worker } = require("worker_threads");
const path = require("path");

const numCPUs = os.cpus().length;
const PORT = 3000;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork(); // Create a worker process for each CPU
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  const app = express();

  app.get("/resize", (req, res) => {
    const { width, height } = req.query;

    if (!width || !height) {
      return res.status(400).json({ error: "Width and height are required" });
    }

    const inputPath = path.join(__dirname, "input.jpg");
    const outputPath = path.join(__dirname, `output-${width}x${height}.jpg`);

    const worker = new Worker(path.join(__dirname, "worker.js"));
    worker.postMessage({
      inputPath,
      outputPath,
      width: parseInt(width),
      height: parseInt(height),
    });

    worker.on("message", (msg) => {
      if (msg.status === "done") {
        res.json({ success: true, outputPath: msg.outputPath });
      } else {
        res.status(500).json({ error: msg.error });
      }
    });

    worker.on("error", (err) => res.status(500).json({ error: err.message }));
  });

  app.listen(PORT, () =>
    console.log(`Worker ${process.pid} started on port ${PORT}`)
  );
}
