// custom.d.ts
import IUser from './src/types/IUser';
import { Request } from 'express';
declare global {
  namespace Express {
    interface Request {
      user?: any;  // Add optional user property to the Request interface
    }
  }
}

// declare module 'express' {
//   export interface Request {
//     user : IUser
//   }
// }