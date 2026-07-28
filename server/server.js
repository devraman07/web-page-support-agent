import dotenv from "dotenv";
import express from "express";
import { ingestRouter } from "./src/routes/ingest.router.js";
import { chatRouter } from "./src/routes/chat.routes.js";
dotenv.config();


const websupportApp = express();
const PORT = 3000;

websupportApp.use(express.json());


websupportApp.get("/", (req, res) => {
    res.send("web support api running");
});

websupportApp.use("/api/v1/ingest", ingestRouter);
websupportApp.use("/api/v1/chat", chatRouter);


websupportApp.listen(PORT, () => {
    console.log(`server is running on http://localhost: ${PORT}`);
});