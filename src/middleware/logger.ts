import express, {Request, Response, NextFunction } from 'express'

export default function logger(req:Request,res:Response, next:NextFunction){
    const method = req.method
    const path = req.path
    const status = res.statusCode

    const start = process.hrtime.bigint();

     res.on('finish',()=>{
        const end = process.hrtime.bigint();
        const durationInMs = Number(end - start) / 1e6; 
        const status = res.statusCode
        console.log(`Request Method: ${method}, Request Path(ms): ${path}, Response Time: ${durationInMs}, Response Status: ${status}`);

     })

    // const resJson = res.status
    next()
    
}