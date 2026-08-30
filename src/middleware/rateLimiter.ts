import express, { Request, Response, NextFunction } from 'express'

export default function rateLimiter(bucketSize: number = 50, rate: number = 10000) {

    let capactity: number = bucketSize

    setInterval(() => {
        capactity++

    }, rate);

    return (req: Request, res: Response, next: NextFunction) => {

        if (capactity > bucketSize) {
            capactity = bucketSize
        }

        if (capactity !== 0) {
            capactity--

            next()
        } else {

            res.status(429).json({ message: "Too many request try after some time" })
        }

    }
}