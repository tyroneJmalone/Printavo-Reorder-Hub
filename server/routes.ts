import type { Express } from "express";
import { type Server } from "http";
import { getOrdersBySearch, getStatuses } from "./printavo";
import { sendReorderEmail } from "./email";
import { reorderRequestSchema } from "@shared/schema";
import { log } from "./index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/statuses", async (_req, res) => {
    try {
      const statuses = await getStatuses();
      res.json(statuses);
    } catch (error: any) {
      log(`Error fetching statuses: ${error.message}`, "api");
      res.status(500).json({ message: "Failed to fetch order statuses" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const searchValue = req.query.q as string;
      const searchType = (req.query.type as string) === "company" ? "company" : "email";
      if (!searchValue || searchValue.trim().length < 1) {
        return res.status(400).json({ message: "Search value is required" });
      }
      if (searchType === "email" && !searchValue.includes("@")) {
        return res.status(400).json({ message: "Valid email is required" });
      }
      const orders = await getOrdersBySearch(searchValue, searchType);
      res.json(orders);
    } catch (error: any) {
      log(`Error fetching orders: ${error.message}`, "api");
      res.status(500).json({ message: "Failed to fetch orders from Printavo" });
    }
  });

  app.post("/api/reorder", async (req, res) => {
    try {
      const parsed = reorderRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid reorder request", errors: parsed.error.issues });
      }

      await sendReorderEmail(parsed.data);
      res.json({ success: true, message: "Reorder notification sent successfully" });
    } catch (error: any) {
      log(`Error processing reorder: ${error.message}`, "api");
      res.status(500).json({ message: error.message || "Failed to process reorder request" });
    }
  });

  return httpServer;
}
