import { tool } from "langchain"
import Order from "../mongo/order.js"
import z from "zod"
import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import Cart from "../mongo/cart.monog.js"
import product from "../mongo/product.mongo.js"
import mongoose from "mongoose"
import User from "../mongo/user.mongo.js"
import Cupon from "../mongo/cupon.monog.js"

dotenv.config()

export const searchproduct = tool(
    async ({ keyword, price, condition }) => {

        console.log("tool called")
        console.log(keyword)
        console.log(price)
        console.log(condition)
        let query = {}

        if (keyword) {
            query.name = {
                $regex: keyword,
                $options: "i"
            }
        }

        if (price != undefined) {

            if (condition == "greater") {
                query.price = { $gt: price }
            }
            else if (condition == "greater_than equal") {
                query.price = { $gte: price }
            }
            else if (condition === "less") {
                query.price = { $lt: price }
            }
            else if (condition == "less_than equal") {
                query.price = { $lte: price }
            }
        }

        console.log("mongo query", query)

        const products = await product.find(query)
        console.log(products.length)
        return JSON.stringify(products)
    },
    {
        name: "searchproduct",
        description: "Search products by their NAME and optionally filter by price range (greater than, less than, equal). Use this when user mentions a specific product name or asks about price filtering.",
        schema: z.object({
            keyword: z.string().optional(),
            price: z.number().optional(),
            condition: z.enum(["less", "less_than equal", "greater", "greater_than equal", "equal"]).optional()
        })
    }
)
export const productstatus = (userid) =>
    tool(
        async ({ orderid }) => {

            console.log("USER ID:", userid);
            console.log("ORDER ID:", orderid);

            if (!mongoose.Types.ObjectId.isValid(orderid)) {
                return "Invalid order ID";
            }
            const find = await Order.findOne({
                _id: orderid,
                user: userid
            })

            console.log("ORDER:", find)

            if (!find) {
                return "Order not found"
            }

            console.log("STATUS:", find.status)

            return find.status
        },
        {
            name: "productstatus",
            description: `
            Get the status of the user's order.
            Use this tool when the user asks about order status,
            delivery, shipping, or where their order is.
            The user must provide an order ID.
            `,
            schema: z.object({
                orderid: z.string()
            })
        }
    );


export const productlist = tool(
    async ({ keyword }) => {
        const findproduct = await product.find({ type: { $regex: keyword, $options: "i" } })
        if (!findproduct) {
            return ("not availble this types of products")
        }
        return JSON.stringify(findproduct)
    },
    {
        name: "allproduct",
        description: "Search products by their CATEGORY or TYPE (e.g. shoes, walking shoes, sneakers, jackets). Use this when the user asks if a certain category or type of product is available in stock.",
        schema: z.object({
            keyword: z.string()
        })
    }
)


export const viewcart = (userid) => tool(
    async () => {
        try {
            console.log(userid)
            const findcart = await Cart.findOne({ user: userid })
            if (!findcart) {
                return ("your cart is empty")
            }
            const discountage = await findcart.totalamount()

            return JSON.stringify({
                items: findcart.items.map((item) => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),

                subtotal: discountage.subtotal,
                discount: discountage.discount,
                discountage: discountage.discountage,
                finaltotal: discountage.finaltotal
            })
        }
        catch (error) {
            console.log(error)
            return `error retrieving :${error.message}`
        }
    },
    {
        name: "viewcart",
        description: ` Get the current user's cart.

        Use this tool when the user asks:
        - show my cart
        - what's in my cart
        - view my cart
        - what products have I added

        Do not use this tool to add, remove, or modify products.
      `,
        schema: z.object({})
    }
)

export const cartorder = (userid) => tool(
    async ({ cartproduct, quantity }) => {
        try {

            let finduser = await User.findById(userid)
            if (!finduser) {
                return ("plaese login to add cart")
            }

            let newcart = await Cart.findOne({ user: userid })
            const findproduct = await product.findOne({ name: cartproduct })
            if (!findproduct) {
                return ("your product is not find")
            }
            const cupon = await Cupon.findOne()
            if (!newcart) {
                newcart = new Cart({
                    user: userid,
                    items: [{
                        product: findproduct._id,
                        name: findproduct.name,
                        quantity: quantity,
                        price: findproduct.price
                    }],
                    cupon: cupon._id
                })
            }
            else {
                newcart.items.push({
                    product: findproduct._id,
                    name: findproduct.name,
                    quantity: quantity,
                    price: findproduct.price
                })
            }

            await newcart.save()
            return JSON.stringify(newcart)
        }
        catch (error) {
            throw new Error(error.message)
        }
    }, {
    name: "usercart",
    description: "when user say this product add in cart and give quantity",
    schema: z.object({
        cartproduct: z.string(),
        quantity: z.number()
    })
}

)

export const removecart = (userid) => tool(
    async ({ productname }) => {

        const finduser = await Cart.findOne({ user: userid })
        if (!finduser) {
            return ("your cart is empty")
        }
        const findproduct = await product.findOne({ name: productname })
        if (!findproduct) {
            return ("this product is not find")
        }

        const index = finduser.items.findIndex((item) => item.product.toString() === findproduct._id.toString())

        if (index == -1) {
            return ("this product is not in your cart")
        }
        finduser.items.splice(index, 1)
        finduser.save()
        return JSON.stringify(finduser)
    },
    {
        name: "delcart",
        description: "when user say delete this product from my cart and he give product name or product id ",
        schema: z.object({
            productname: z.string()
        })
    }
)

export const updatecart = (userid) => tool(
    async ({ productname, quantityuser }) => {

        const finduser = await Cart.findOne({ user: userid })
        if (!finduser) {
            return ("user not find in cart")
        }
        console.log("userid", userid)
        console.log("CART ID:", finduser._id)
        console.log("CART ITEMS:", finduser.items)
        console.log("product", productname)
        console.log("product user quanitty", quantityuser)
        const findproduct = finduser.items.findIndex((item) => item.name == productname)
        console.log("before update product", findproduct)
        if (findproduct == -1) {
            return ("your cart not have this product")
        }
        finduser.items[findproduct].quantity = quantityuser
        await finduser.save()
        const update = await Cart.findOne({ user: userid })
        console.log("UPDATED CART ID:", update._id)
        console.log("UPDATED ITEMS:", update.items)
        return JSON.stringify(update.items)
    },
    {
        name: "updatequnatity",
        description: "when user say change my product qunatiy in cart and qive qunaity number ",
        schema: z.object({
            productname: z.string(),
            quantityuser: z.number()
        })
    }
)

export const shipai = (userid) => tool(
    async ({ city, code, street, country }) => {
        try {
            console.log(userid)
            const finduser = await Cart.findOne({ user: userid })
            if (!finduser) {
                return JSON.stringify("your cart cant find")
            }
            finduser.shipping = {
                street: street,
                city: city,
                postalcode: code,
                country: country
            }
            await finduser.save()
        }
        catch (eror) {
            console.log(eror.message)
            return JSON.stringify(eror)
        }
    },
    {
        name: "shippingaddres",
        description: `when user give you addresa and say its my shiiping addres
         country nmae
         postal code
         street name
         city name
        `,
        schema: z.object({
            city: z.string(),
            code: z.string(),
            street: z.string(),
            country: z.string()
        })
    }
)