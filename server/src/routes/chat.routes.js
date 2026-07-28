

import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { chatSchema } from "../validators/chat.validator.js";
import { chatController } from "../controllers/chat.controller.js";

export const chatRouter = Router();


chatRouter.post("/", validate(chatSchema), chatController);