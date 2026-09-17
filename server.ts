import express from "express";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotEnv from "dotenv";
import { createServer as createViteServer } from "vite";

dotEnv.config();

const PORT = 3000;

async function bootstrap() {
  const app = express();

  // Increase request size limit for base64 image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Create local uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve local uploads folder statically
  app.use("/uploads", express.static(uploadsDir));

  // Route to check server status and configurations
  app.get("/api/config-status", (req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isCloudinaryConfigured = !!(
      cloudName &&
      cloudName !== "YOUR_CLOUD_NAME_HERE" &&
      cloudName.trim() !== "" &&
      apiKey &&
      apiSecret
    );

    res.json({
      cloudinaryConfigured: isCloudinaryConfigured,
      cloudName: isCloudinaryConfigured ? cloudName : null,
      fallbackToLocal: !isCloudinaryConfigured
    });
  });

  // Main upload handler
  app.post("/api/upload", async (req, res) => {
    try {
      const { file, name } = req.body;
      if (!file) {
        return res.status(400).json({ error: "No image file data provided." });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      // Check if Cloudinary is configured
      const isCloudinaryConfigured = !!(
        cloudName &&
        cloudName !== "YOUR_CLOUD_NAME_HERE" &&
        cloudName.trim() !== "" &&
        apiKey &&
        apiSecret
      );

      if (isCloudinaryConfigured) {
        // Configure Cloudinary library dynamically
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret
        });

        // Upload base64 encoded string directly to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(file, {
          folder: "pizza_cafe_menu",
          resource_type: "image",
        });

        return res.json({
          success: true,
          url: uploadResponse.secure_url,
          source: "cloudinary",
          publicId: uploadResponse.public_id,
          format: uploadResponse.format
        });
      } else {
        // Local Server Storage Fallback
        const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return res.status(400).json({ error: "Invalid base64 image data format." });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        // Guess extension
        let extension = ".png";
        const mimeToExt: Record<string, string> = {
          "image/jpeg": ".jpg",
          "image/jpg": ".jpg",
          "image/png": ".png",
          "image/gif": ".gif",
          "image/webp": ".webp",
          "image/svg+xml": ".svg",
        };
        if (mimeToExt[mimeType]) {
          extension = mimeToExt[mimeType];
        }

        // Generate clean unique filename
        const cleanName = name
          ? name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
          : "menu_item";
        const filename = `${cleanName}_${Date.now()}${extension}`;
        const filePath = path.join(uploadsDir, filename);

        fs.writeFileSync(filePath, buffer);

        // Determine Server base URL correctly
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
        const fileUrl = `${baseUrl.replace(/\/$/, "")}/uploads/${filename}`;

        return res.json({
          success: true,
          url: fileUrl,
          source: "local_storage",
          filename: filename
        });
      }
    } catch (error: any) {
      console.error("Upload error details:", error);
      return res.status(500).json({
        error: "Failed to upload image. " + (error?.message || error || "")
      });
    }
  });

  // Vite middleware setup for assets and SPA router
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

  // Bind to 0.0.0.0 and Port 3000 as strictly requested
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Critical server bootstrapping error:", err);
});
