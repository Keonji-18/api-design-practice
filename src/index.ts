import "source-map-support/register.js";
import 'dotenv/config';
import express from 'express';
const port = process.env.PORT

const products = [
  { name: "Pen", category: "Stationery", price: 20, inStock: true },
  { name: "Notebook", category: "Stationery", price: 80, inStock: true },
  { name: "Backpack", category: "Bags", price: 1200, inStock: true },
  { name: "Water Bottle", category: "Kitchen", price: 350, inStock: false },
  { name: "Headphones", category: "Electronics", price: 1500, inStock: true },
  { name: "Keyboard", category: "Electronics", price: 900, inStock: true },
  { name: "Mouse", category: "Electronics", price: 600, inStock: false },
  { name: "USB Cable", category: "Electronics", price: 250, inStock: true },
  { name: "Power Bank", category: "Electronics", price: 1200, inStock: true },
  { name: "Mobile Phone", category: "Electronics", price: 18000, inStock: false },
  { name: "Laptop", category: "Electronics", price: 55000, inStock: true },
  { name: "Tablet", category: "Electronics", price: 22000, inStock: true },
  { name: "Desk Lamp", category: "Home", price: 700, inStock: true },
  { name: "Wrist Watch", category: "Accessories", price: 2500, inStock: false },
  { name: "Wallet", category: "Accessories", price: 800, inStock: true },
  { name: "Umbrella", category: "Accessories", price: 500, inStock: true },
  { name: "Calculator", category: "Stationery", price: 450, inStock: false },
  { name: "Coffee Mug", category: "Kitchen", price: 300, inStock: true },
  { name: "T-Shirt", category: "Clothing", price: 700, inStock: true },
  { name: "Jeans", category: "Clothing", price: 1800, inStock: false },
  { name: "Running Shoes", category: "Footwear", price: 2500, inStock: true },
  { name: "Sunglasses", category: "Accessories", price: 1200, inStock: true }
];


const app = express()



app.get('/',(req ,res)=>{
    res.send("You are in home page")
})

app.get('/products',(req, res)=>{

    
    res.status(200).json({productsList: products})
})
app.listen(port,()=>{
    console.log(`Server running at http://localhost:${port}`);
    
})
