import { Router, Request, Response, NextFunction } from "express";
import { UUID, randomUUID } from "node:crypto";

type orderType = {
    productName: string
    price: number
}


type cachedOrderType = {
    id: UUID
    order: orderType
}

const orders: orderType[] = []
const cachedOrders: cachedOrderType[] = []

export const OrderRouter = Router()

OrderRouter.post('/orders', (req: Request, res: Response, next: NextFunction) => {

    const { productName, price } = req.body

    const idempotentkey: string | undefined = req.header('Idempotency-Key')

    const cachedOrder = cachedOrders.find(cachedOrder => cachedOrder.id === idempotentkey)

    if (cachedOrder) {
        return res.status(201).json({ message: "Order created idemp", order: cachedOrder.order })
    }

    orders.push({ productName, price })

    const uuid = randomUUID()
    res.setHeader('Idempotency-Key', uuid as string)
    cachedOrders.push({ id: uuid, order: { productName, price } })
    res.status(201).json({ message: "Order created", order: orders.slice(-1)})


})