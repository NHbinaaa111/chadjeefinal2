import 'express-session';

declare module 'express-session' {
  interface SessionData {
    passport?: { user: number };
    targetJeeYear?: string;
  }
}
