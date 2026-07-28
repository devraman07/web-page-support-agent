import { ingestWebsite } from "../services/ingest.service.js";

export const ingestController = async (req, res) => {
  try {
    const { url } = req.body;

    const result = await ingestWebsite(url);

    return res.status(200).json({
      success: true,
      message: "website inndexed successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to ingest website.",
      error: error.message,
    });
  }
};
