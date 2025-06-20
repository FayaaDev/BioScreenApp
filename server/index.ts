import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.64.87.218:5173',
    'http://192.64.87.218:5000',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost'
    
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory with explicit MIME types
app.use(express.static('public', {
  setHeaders: (res, path) => {
    console.log('Serving static file:', path);
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript; charset=utf-8');
      console.log('Set Content-Type to application/javascript for:', path);
    } else if (path.endsWith('.mjs')) {
      res.set('Content-Type', 'application/javascript; charset=utf-8');
    } else if (path.endsWith('.css')) {
      res.set('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'health-screening-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  
  // Force production mode if we're running the built server
  const isBuiltServer = import.meta.dirname.includes('/dist');
  const isProduction = process.env.NODE_ENV === "production" || isBuiltServer;
  
  console.log(`Environment check:`, {
    NODE_ENV: process.env.NODE_ENV,
    expressEnv: app.get("env"),
    isBuiltServer,
    isProduction,
    dirname: import.meta.dirname
  });
  
  if (!isProduction && app.get("env") === "development") {
    console.log("Setting up Vite dev server");
    await setupVite(app, server);
  } else {
    console.log("Setting up static file serving for production");
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port} and accessible from network`);
  });
})();
