import "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
      // add other fields your user actually has
    }
  }
}
