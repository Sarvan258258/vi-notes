import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectToMongo } from "./db/mongo.js";

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const mongoUri = process.env.MONGO_URI ?? "mongodb://localhost:27017/vi-notes";

const startServer = async () => {
  await connectToMongo(mongoUri);
  const app = createApp();

  app.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
