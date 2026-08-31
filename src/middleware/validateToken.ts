import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import 'dotenv/config'


declare global {
  namespace Express {
    interface Request {

      userEmail: string
    }
  }
}

interface UserPayload extends JwtPayload {
  emailId: string
}


export default function validateToken(req: Request, res: Response, next: NextFunction) {
  try {

    const access_token = req.cookies.access_token
    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET as string) as UserPayload

    req.userEmail = decoded.emailId
    console.log(req.userEmail);

    next()
  } catch (error) {

    res.status(401).json({ message: "Unauthorized" })

  }
}