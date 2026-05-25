import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes would go here (if needed)
  app.post("/api/create-order", async (req, res) => {
    try {
      console.log(`[API] Creating Razorpay order for amount: ${req.body.amount} ...`);
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      const options = {
        amount: req.body.amount, // amount in the smallest currency unit
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      console.log(`[API] Razorpay order created successfully: ${order.id}`);
      res.json({
        ...order,
        key_id: process.env.RAZORPAY_KEY_ID
      });
    } catch (error: any) {
      console.error("[API] Error creating Razorpay order:", error);
      res.status(500).json({ 
        error: "Error creating order", 
        details: error.message || String(error)
      });
    }
  });

  app.post("/api/verify-payment", (req, res) => {
    try {
      console.log("[API] Verifying Razorpay payment signature...", req.body);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
        console.log("[API] Payment signature verified successfully!");
        res.json({ success: true });
      } else {
        console.error("[API] Payment signature verification failed. Mismatch between expected and received signature.");
        res.status(400).json({ success: false, error: "Signature mismatch" });
      }
    } catch (error: any) {
      console.error("[API] Error verifying signature:", error);
      res.status(500).json({ 
        error: "Error verifying signature", 
        details: error.message || String(error) 
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
