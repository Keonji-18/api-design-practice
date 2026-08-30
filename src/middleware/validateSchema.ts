import { Request, Response, NextFunction } from 'express'
import { products } from '../index.js'

const productKeys = ['id', 'name', 'category', 'price', 'inStock']

export default function validateSchema(req: Request, res: Response, next: NextFunction) {

    try {
        const body = req.body

        const keys = Object.keys(body)
        const conatinAllKeys = productKeys.every(element => keys.includes(element))

        const isIdNumber = typeof body.id === 'number'
        const isNameString = typeof body.name === 'string'
        const isCategoryString = typeof body.category === 'string'
        const isPriceNumber = typeof body.price === 'number'
        const isInStockBool = typeof body.inStock === 'boolean'

        const idExists = products.find(element => element.id === body.id)
        if (idExists) {
            throw new Error("Id already exists")
        }
        if (conatinAllKeys) {
            if (isIdNumber && isNameString && isCategoryString && isPriceNumber && isInStockBool) {
                if (body.name.length < 3) {
                    throw new Error("Name must be of 3 or more character")
                }
                if (body.category.length < 3) {
                    throw new Error("Name must be of 3 or more charachters")
                }
            } else {
                throw new Error("Invalid Type")
            }
        } else {
            throw new Error("Any field is missing")
        }
        next()
    } catch (error: unknown) {
        console.log(error);
        if (error instanceof Error) {
            res.status(400).json({ messgae: "BAD REQUEST (InValid Schema)", errorMessage: error.message })
        } else {
            res.status(400).json({ messgae: "BAD REQUEST (InValid Schema)", errorMessage: error })
        }
    }
}