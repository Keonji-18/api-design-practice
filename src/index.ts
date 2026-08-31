import "source-map-support/register.js";
import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import { Buffer } from "node:buffer";
import cookieParser from "cookie-parser";
import logger from "./middleware/logger.js";
import rateLimiter from "./middleware/rateLimiter.js";
import validateSchema from "./middleware/validateSchema.js";
import errorHandler from "./middleware/errorHandler.js";
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken'
import validateToken from "./middleware/validateToken.js";
import {OrderRouter} from "./rotues/orderRoutes.js"



const port: number = Number(process.env.PORT)


type productType = {
    id: number,
    name: string,
    category: string,
    price: number,
    inStock: boolean
}

type userType = {

    name: string,
    emailId: string,
    hashPassword: string
}

interface userPayload extends JwtPayload {
    emailId: string
}

export const products: productType[] = [
    { id: 1, name: "Pen", category: "Stationery", price: 20, inStock: true },
    { id: 2, name: "Notebook", category: "Stationery", price: 80, inStock: true },
    { id: 3, name: "Backpack", category: "Bags", price: 1200, inStock: true },
    { id: 4, name: "Water Bottle", category: "Kitchen", price: 350, inStock: false },
    { id: 5, name: "Headphones", category: "Electronics", price: 1500, inStock: true },
    { id: 6, name: "Keyboard", category: "Electronics", price: 900, inStock: true },
    { id: 7, name: "Mouse", category: "Electronics", price: 600, inStock: false },
    { id: 8, name: "USB Cable", category: "Electronics", price: 250, inStock: true },
    { id: 9, name: "Power Bank", category: "Electronics", price: 1200, inStock: true },
    { id: 10, name: "Mobile Phone", category: "Electronics", price: 18000, inStock: false },
    { id: 11, name: "Laptop", category: "Electronics", price: 55000, inStock: true },
    { id: 12, name: "Tablet", category: "Electronics", price: 22000, inStock: true },
    { id: 13, name: "Desk Lamp", category: "Home", price: 700, inStock: true },
    { id: 14, name: "Wrist Watch", category: "Accessories", price: 2500, inStock: false },
    { id: 15, name: "Wallet", category: "Accessories", price: 800, inStock: true },
    { id: 16, name: "Umbrella", category: "Accessories", price: 500, inStock: true },
    { id: 17, name: "Calculator", category: "Stationery", price: 450, inStock: false },
    { id: 18, name: "Coffee Mug", category: "Kitchen", price: 300, inStock: true },
    { id: 19, name: "T-Shirt", category: "Clothing", price: 700, inStock: true },
    { id: 20, name: "Jeans", category: "Clothing", price: 1800, inStock: false },
    { id: 21, name: "Running Shoes", category: "Footwear", price: 2500, inStock: true },
    { id: 22, name: "Sunglasses", category: "Accessories", price: 1200, inStock: true }
];

const users: userType[] = []

const revokedRefreshToken: string[] = []

const app: Express = express()

app.use(rateLimiter(10, 10000))
app.use(logger)
app.use(cookieParser())
app.use(express.json())


app.use('/products', OrderRouter)

app.get('/', (req, res) => {
    res.send("You are in home page")
})



app.post('/signup', async (req: Request, res: Response) => {

    const { name, emailId, password } = req.body
    const saltRounds = 10

    const hashPassword: string = await bcrypt.hash(password, saltRounds)
    users.push({ name, emailId, hashPassword })

    console.log(users);

    res.status(201).json({ message: "User created" })

})

app.post('/login', async (req: Request, res: Response) => {
    const { emailId, password } = req.body

    const idx: number = users.findIndex(user => user.emailId === emailId)

    const isUserPresent = await bcrypt.compare(password, users[idx].hashPassword)

    if (!idx && !isUserPresent) {
        return res.status(400).json({ message: "wrong email or password" })
    }

    const userPayload = {
        emailId: users[idx].emailId
    }

    const access_token = jwt.sign(userPayload, process.env.ACCESS_TOKEN_SECRET as string)
    const refresh_token = jwt.sign(userPayload, process.env.REFRESH_TOKEN_SECRET as string)


    res.cookie('access_token', access_token, { expires: new Date(Date.now() + 60000), httpOnly: true })
    res.cookie('refresh_token', refresh_token, { expires: new Date(Date.now() + 24 * 60 * 60 * 1000), httpOnly: true })

    res.status(201).json({ message: "User loggedIn" })

})

app.get('/me', validateToken, (req: Request, res: Response) => {

    const user = users.find(user => user.emailId === req.userEmail)

    console.log(user);

    res.status(200).json(user)
})

app.post('/refresh', (req: Request, res: Response, next: NextFunction) => {
    try {

        const refreshToken = req.cookies.refresh_token

        const isRevoked = revokedRefreshToken.includes(refreshToken)
        if (isRevoked) {
            return res.status(400).json({ message: "Your refresh token expired" })
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as userPayload

        if (!decoded) {
            return res.status(400).json({ message: "No refresh token found" })
        }
        const userPayload = {
            emailId: decoded.emailId
        }

        const access_token = jwt.sign(userPayload, process.env.ACCESS_TOKEN_SECRET as string)
        res.cookie('access_token', access_token, { expires: new Date(Date.now() + 60000), httpOnly: true })

        console.log(req.cookies.access_token);

        res.status(201).json({ message: "Access token generated" })

    } catch (error) {
        next(error)
    }
})

app.post('/logout', (req: Request, res: Response, next: NextFunction) => {

    const refresh_token = req.cookies.refresh_token

    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    revokedRefreshToken.push(refresh_token)

    res.status(201).json({ message: "Logged Out" })

})



app.get('/products',validateToken, (req: Request, res: Response) => {

    // Filtering 
    const allowedFilters: string[] = ["category", "inStock"]
    const category: string | undefined = req.query.category ? String(req.query.category) : undefined

    let inStock: boolean | undefined = req.query.inStock ? (req.query.inStock === "true" ? true : false) : undefined

    setTimeout(() => { }, 5000)
    let filteredData: productType[] = [];

    if (category && allowedFilters.includes("category")) {
        filteredData = products.filter(product => product.category.toLocaleLowerCase() === category.toLocaleLowerCase())
    } else {
        filteredData = products;
    }

    if (inStock !== undefined && allowedFilters.includes("inStock")) {
        filteredData = filteredData.filter(product => product.inStock === inStock)
    }

    // minPrice and maxPrice
    const minPrice: number = Number(req.query.minPrice) || 0
    const maxPrice: number = Number(req.query.maxPrice) || Infinity

    if (minPrice !== undefined || maxPrice !== undefined) {
        filteredData = filteredData.filter(product => product.price > minPrice && product.price < maxPrice)
    }



    // Sorting
    const sortAllowed: string[] = ["name", "price"]
    const sortBy: string | undefined = req.query.sortBy ? String(req.query.sortBy) : undefined
    const orderBy: string | undefined = (req.query.orderBy) ? String(req.query.orderBy).toLocaleLowerCase() : undefined


    let sortedData: productType[] = [...filteredData];

    if (sortBy !== undefined && sortAllowed.includes(sortBy)) {
        if (orderBy === "desc" || orderBy === "descending") {

            if (sortBy === "name") {
                sortedData = filteredData.toSorted((a, b) => b.name.localeCompare(a.name) || b.id - a.id);
            } else {
                sortedData = filteredData.toSorted((a, b) => b.price - a.price || b.id - a.id);
            }
        } else {
            if (sortBy === "name") {
                sortedData = filteredData.toSorted((a, b) => a.name.localeCompare(b.name) || b.id - a.id);
            } else {
                sortedData = filteredData.toSorted((a, b) => a.price - b.price || b.id - a.id);
            }
        }


    } else {
        sortedData = filteredData.sort((a, b) => a.id - b.id || a.price - b.price)
    }

    // Pagination
    const page: number = Number(req.query.page)
    const limit: number = Number(req.query.limit) || 10
    const totalProducts: number = sortedData.length
    const totalPages: number = Math.ceil(totalProducts / limit)

    const startIndex: number = (page - 1) * limit
    const endIndex: number = page * limit

    const paginatedData: productType[] = sortedData.slice(startIndex, endIndex)
    if (!Number.isNaN(page)) {
        return res.status(200).json({ productsList: paginatedData, page, limit, total: totalProducts, totalPages })
    }
    // Cursor based pagination
    const encoded: string = req.query.cursor ? String(req.query.cursor) : "undefined"
    let idx: number = 0;
    if (encoded === "undefined") {
        //pass
    } else {
        const decodedCursor = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'))

        idx = sortedData.findIndex(product => product.id === decodedCursor.id) + 1
    }

    const cursorPaginatedData: productType[] = sortedData.slice(idx, idx + limit)
    let lastElement = cursorPaginatedData.slice(-1)[0]

    const lastElementString: string = JSON.stringify(lastElement)


    const cursor = Buffer.from(`${lastElementString}`, 'utf-8').toString('base64')


    res.status(200).json({ productsList: cursorPaginatedData, cursor, limit, total: totalProducts, totalPages })

})

app.get('/products/search',validateToken, (req: Request, res: Response) => {
    const search = req.query.q as string

    type matchCountType = {
        id: number,
        matchCount: number
    }
    const numberMatches: matchCountType[] = []
    products.forEach((product) => {
        const matches: string[] = [...product.name].filter((char) => search.includes(char))
        numberMatches.push({ id: product.id, matchCount: matches.length })
    })

    numberMatches.sort((a, b) => b.matchCount - a.matchCount)


    const searchResult: productType[] = []

    numberMatches.forEach((match) => {

        const idx = products.findIndex(product => product.id === match.id)
        searchResult.push(products[idx])
    })

    const limit: number = Number(req.query.limit) || 10

    const encoded: string = req.query.cursor ? String(req.query.cursor) : "undefined"
    let idx: number = 0;
    if (encoded === "undefined") {
        // pass

    } else {

        const decodedCursor = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'))


        idx = searchResult.findIndex(product => product.id === decodedCursor.id) + 1
    }

    const cursorPaginatedData: productType[] = searchResult.slice(idx, idx + limit)
    let lastElement = cursorPaginatedData.slice(-1)[0]

    const lastElementString: string = JSON.stringify(lastElement)

    const cursor = Buffer.from(`${lastElementString}`, 'utf-8').toString('base64')

    res.status(200).json({ productsList: cursorPaginatedData, cursor, limit, total: products.length, pages: Math.ceil(products.length / limit) })

})

app.post('/products', validateSchema, (req: Request, res: Response) => {

    const productId: number = req.body.id
    products.push(req.body)
    res.status(201).json({ message: "Created Success", data: products[-1] })

})

app.use(errorHandler)

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);

})