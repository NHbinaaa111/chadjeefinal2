import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";

const app = express();

// Configure CORS for cross-origin requests
// IMPORTANT DEPLOYMENT NOTE: 
// When deployed to Render, the frontend and backend should be different services.
// The frontend will make CORS requests to the backend with credentials (cookies).
// These settings ensure that:
// 1. Only trusted domains can access the API
// 2. Credentials (cookies) are properly sent and accepted
// 3. Necessary headers are allowed for proper functioning

// Allow specific domains based on environment
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // Primary allowed origins - must include your frontend URL(s)
    const primaryDomains = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(domain => domain.trim())
      : [
          // Default allowed origins - MAKE SURE YOUR FRONTEND URL IS LISTED HERE
          'https://chadjee.onrender.com',
          'https://www.chadjee.onrender.com',
          'https://chadjee-frontend.onrender.com',
          'https://chadjee-app.onrender.com'
        ];
    
    // Log the allowed origins for debugging
    console.log('Allowed origins in production:', primaryDomains);
    
    // Allow other Render subdomains for testing and development
    // CRITICAL: This is more permissive but helps avoid CORS issues during development
    const renderDomainPattern = /^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/;
    
    return {
      // This function validates origin against allowed domains
      // Returns the origin if allowed, or false if not allowed
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
        // Allow requests with no origin (like mobile apps, curl requests, etc.)
        if (!origin) {
          console.log('Request has no origin, allowing for non-browser clients');
          return callback(null, true);
        }
        
        // Check if the origin exactly matches one of our primary domains
        if (primaryDomains.includes(origin)) {
          console.log(`✓ Origin ${origin} is explicitly allowed`);
          return callback(null, origin);
        }
        
        // More permissive check for Render domains during testing
        if (renderDomainPattern.test(origin)) {
          console.log(`✓ Origin ${origin} allowed via Render domain pattern`);
          return callback(null, origin);
        }
        
        // Enable localhost during development on Render
        if (origin.startsWith('http://localhost:')) {
          console.log(`✓ Allowing localhost origin: ${origin}`);
          return callback(null, origin);
        }
        
        // Enhanced debug logging for CORS issues
        console.error(`✗ Origin ${origin} denied - not in allowed list`);
        console.error('Allowed origins:', primaryDomains);
        console.error(`To fix: Add "${origin}" to ALLOWED_ORIGINS environment variable`);
        
        // In production, we'd deny this origin, but during development/testing
        // we'll allow it with a warning to help with troubleshooting
        if (process.env.NODE_ENV === 'production') {
          // Origin is not allowed - return specific error
          callback(new Error(`CORS error: ${origin} is not allowed by server configuration`));
        } else {
          console.warn(`WARNING: Allowing unauthorized origin ${origin} for testing purposes`);
          callback(null, origin);
        }
      },
      credentials: true, // REQUIRED for cookies/authentication across origins
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Auth-Token'],
      exposedHeaders: ['Set-Cookie', 'Date', 'Cache-Control', 'Content-Language'], // Expose critical headers
      maxAge: 86400, // Cache preflight requests for 24 hours
      optionsSuccessStatus: 204 // Some legacy browsers choke on 204
    };
  } else {
    // Development environment - use more permissive configuration
    return {
      // Allow both localhost and Replit preview URL
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
        console.log(`Development mode: allowing origin ${origin || 'unknown'}`);
        callback(null, origin || '*');
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Auth-Token'],
      exposedHeaders: ['Set-Cookie', 'Date', 'Cache-Control', 'Content-Language']
    };
  }
};

const corsOptions = getAllowedOrigins();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up logging middleware
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
  // Set up authentication before routes
  const { requireAuth } = setupAuth(app);
  
  // Debug endpoint to check auth status - helps with deployment troubleshooting
  // Always enable this for better debugging during deployment
  app.get("/api/debug/auth", (req, res) => {
    // Add more detailed debug information to help troubleshoot authentication issues
    const cookieHeader = req.headers.cookie || '';
    
    // Parse cookies to show partial info without revealing sensitive data
    const cookies = cookieHeader.split(';')
      .map(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        return {
          name,
          // Only include partial values for non-sensitive cookies
          value: name.includes('connect.sid') || name.includes('session') 
            ? '***[Session Cookie Present]***'
            : rest.join('=').substring(0, 3) + '...',
          httpOnly: false, // Can't detect this from request
        };
      });

    res.json({
      authenticated: req.isAuthenticated(),
      sessionID: req.sessionID ? req.sessionID.substring(0, 6) + '...' : null,
      user: req.user ? { id: (req.user as any).id } : null,
      cookies: cookies,
      cookieCount: cookies.length,
      hasCookieHeader: !!req.headers.cookie,
      hasSessionCookie: cookieHeader.includes('connect.sid'),
      origin: req.headers.origin || 'not provided',
      userAgent: req.headers['user-agent'],
      env: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
      corsEnabled: true
    });
    
    // Log session information on the server side
    console.log('Debug Auth Request | Session ID:', req.sessionID);
    console.log('Debug Auth Request | Authenticated:', req.isAuthenticated());
    console.log('Debug Auth Request | Has Session Object:', !!req.session);
    console.log('Debug Auth Request | Cookie Header:', !!req.headers.cookie);
  });
  
  // Register routes with auth middleware
  const server = await registerRoutes(app, requireAuth);

  // Global error handler with improved logging and response formatting
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    // Determine appropriate status code
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Additional error details (only included in development)
    const errorDetails = process.env.NODE_ENV !== 'production' ? {
      stack: err.stack,
      path: req.path,
      method: req.method
    } : undefined;
    
    // Production vs development error responses
    const errorResponse = process.env.NODE_ENV === 'production' 
      ? { error: message, success: false }
      : { error: message, success: false, details: errorDetails };
    
    // Enhanced error logging in production
    if (process.env.NODE_ENV === 'production') {
      console.error(`[ERROR] ${status} ${req.method} ${req.path} - ${message}`);
      // Log extra details that might help debugging while keeping sensitive info out of responses
      console.error(`Request IP: ${req.ip}`);
      console.error(`Request headers: ${JSON.stringify(req.headers)}`);
      console.error(`Error stack: ${err.stack}`);
    } else {
      console.error(err);
    }
    
    res.status(status).json(errorResponse);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
