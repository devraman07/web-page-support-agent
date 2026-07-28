
import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { ingestSchema } from "../validators/ingest.validator.js";
import { ingestController } from "../controllers/ingest.controller.js";

export const ingestRouter = Router();


ingestRouter.post("/", validate(ingestSchema), ingestController);