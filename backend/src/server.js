import express from "express";
import pg from "pg";
import { createClient } from "redis";
import client from "prom-client";

const app = express();
app.use(express.json());

const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "estateflow",
  user: process.env.DB_USER || "estateflow",
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 3000
});

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: { reconnectStrategy: false }
});

redis.on("error", err =>
  console.error("Redis error:", err.message)
);

client.collectDefaultMetrics();

const httpRequests = new client.Counter({
  name: "estateflow_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"]
});

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequests.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: String(res.statusCode)
    });
  });
  next();
});

app.get("/healthz", (_req, res) => {
  res.json({ status: "alive" });
});

app.get("/readyz", (_req, res) => {
  res.json({ status: "ready" });
});

app.get("/api/db-check", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ database: "reachable" });
  } catch (err) {
    console.error("Database check failed:", err.message);
    res.status(503).json({ error: "database unavailable" });
  }
});

app.get("/api/properties", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, city, price FROM properties ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Property query failed:", err.message);
    res.status(503).json({ error: "database unavailable" });
  }
});

app.post("/api/bookings", async (req, res) => {
  const propertyId = Number(req.body.property_id);
  const customer = req.body.customer_name;

  if (!Number.isInteger(propertyId) || propertyId < 1 ||
      typeof customer !== "string" || !customer.trim()) {
    return res.status(400).json({ error: "invalid booking request" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings(property_id, customer_name)
       VALUES ($1, $2)
       RETURNING id, property_id, customer_name, status`,
      [propertyId, customer.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Booking failed:", err.message);
    res.status(503).json({ error: "booking unavailable" });
  }
});

app.get("/api/cache-check", async (_req, res) => {
  try {
    if (!redis.isOpen) await redis.connect();
    await redis.ping();
    res.json({ redis: "reachable" });
  } catch (err) {
    console.error("Redis check failed:", err.message);
    res.status(503).json({ error: "cache unavailable" });
  }
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(8080, "0.0.0.0", () => {
  console.log("EstateFlow API listening on port 8080");
});
