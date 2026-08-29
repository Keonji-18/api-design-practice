import "source-map-support/register.js";
import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import { Buffer } from "node:buffer";
import { toString } from 'node:ffi';
import { skip } from "node:test";
import logger from "./middleware/logger.js";
const port: number = Number(process.env.PORT)


type productType = {
    id: number,
    name: string,
    category: string,
    price: number,
    inStock: boolean
}

const products: productType[] = [
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


const app: Express = express()


app.use(logger)

app.get('/', (req, res) => {
    res.send("You are in home page")
})

app.get('/products', (req: Request, res: Response) => {

    // Filtering 
    const allowedFilters: string[] = ["category", "inStock"]
    const category: string | undefined = req.query.category ? String(req.query.category) : undefined

    let inStock: boolean | undefined = req.query.inStock ? (req.query.inStock === "true" ? true : false) : undefined

setTimeout(()=>{},5000)
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
        sortedData = filteredData.sort((a, b) => b.id - a.id)
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
        res.status(200).json({ productsList: paginatedData, page, limit, total: totalProducts, totalPages })

    }
    // Cursor based pagination
    const encoded: string = req.query.cursor ? String(req.query.cursor) : "undefined"
    let idx: number = 0;
    if (encoded === "undefined") {
        skip
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

app.get('/products/search', (req: Request, res: Response) => {
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
        skip

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


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);

})