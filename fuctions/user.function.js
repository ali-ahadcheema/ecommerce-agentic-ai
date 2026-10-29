import User from "../mongo/user.mongo.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import product from "../mongo/product.mongo.js";
import Cart from "../mongo/cart.monog.js";
import Order from "../mongo/order.js";
import Cupon from "../mongo/cupon.monog.js";
import stripe from "../payment/user.payment.js";
import { createAgent, tool } from "langchain"
import { ChatGroq } from "@langchain/groq"
import { productstatus, searchproduct, productlist, shipai, viewcart, cartorder, removecart, updatecart } from "../ai-tools/agent.tools.js";
import redis from "../redis.js";



dotenv.config()
export const sign = async (req, res) => {

    try {
        const { name, email, password } = req.body

        const bcryptpassword = await bcrypt.hash(password, 10)
        if (!bcryptpassword) {
            res.status(400).json("password not hash")
        }

        const user = new User({ name, email, password: bcryptpassword })
        const expiretime = 30 * 24 * 60 * 60 * 1000

        const token = jwt.sign({ id: user.id }, process.env.secret, { expiresIn: "30d" })
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: expiretime
        })
        await user.save()

        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                age: user.age,
                usertype: user.usertype
            }
        })
    }
    catch (error) {
        if (error.code === 11000) {
            res.json("this email already register use difrent")
        }
        console.log(error)
    }

}

export const login = async (req, res) => {
    const { email, password } = req.body

    const userfind = await User.findOne({ email })
    if (!userfind) {
        return res.status(401).json("user ont find with this email")
    }

    console.log(userfind.email)
    console.log(userfind.password)
    console.log(password)
    const check = await bcrypt.compare(password, userfind.password)
    if (!check) {
        return res.status(401).json("password is incorect")
    }
    const expiretime = 30 * 24 * 60 * 60 * 1000

    const token = jwt.sign({ id: userfind._id }, process.env.secret, { expiresIn: "30d" })

    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: expiretime
    })

    res.status(200).json({
        user: {
            _id: userfind._id,
            name: userfind.name,
            usertype: userfind.usertype
        }
    })
}

export const getme = async (req, res) => {
    try {
        const token = req.cookies.token
        if (!token) {
            return res.status(403).json("not logged in")
        }
        const decoded = jwt.verify(token, process.env.secret)
        const user = await User.findById(decoded.id).select("-password")
        if (!user) {
            return res.status(403).json("user is not authrize")
        }
        res.status(200).json({ user })
    }
    catch (error) {
        res.status(500).json(error.message)
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",

        })
        res.status(200).json({ messge: "logout succesful" })
    }
    catch (error) {
        res.status(500).json(error.message)
    }
}
export const add = async (req, res) => {
    try {
        const { name, type, quantity, price } = req.body
        if (!name && price) {
            console.log("name and price required")
        }
        const image = req.file?.path
        if (!image) {
            return res.json("please add picture")
        }

        const Product = new product({ name, type, quantity, price, image: image })

        await Product.save()
        res.status(201).json(Product)
    }

    catch (error) {
        console.log({ message: error.message })
    }
}

export const dleteproduct = async (req, res) => {
    try {
        const { userId, productId } = req.body
        const findproduct = await product.findByIdAndDelete(productId)
        if (!findproduct) {
            return res.json("product not find and dlete")
        }
        res.status(200).json("product dlete")
    }
    catch (error) {
        return res.status(500).json(error.message)
    }
}
export const addcart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body

        let findproduct = await product.findById(productId)
        if (!findproduct) {
            res.status(203).json("product not find ")
        }
        let finduser = await User.findById(userId)
        if (!finduser) {
            return res.json("userid not find in cart")
        }
        let newcart = await Cart.findOne({ user: userId })

        if (!newcart) {
            newcart = new Cart({ user: userId, items: [] })
        }

        let exititem = newcart.items.find(
            item => item.product.toString() === productId
        )

        if (exititem) {
            exititem.quantity += quantity
        }
        else {
            newcart.items.push({
                product: productId,
                name: findproduct.name,
                quantity,
                price: findproduct.price
            })
        }

        await newcart.save()
        res.status(200).json(newcart)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const editcart = async (req, res) => {
    try {

        const token = req.cookies.token
        if (!token) {
            return res.json("user is not authorize")
        }

        const decode = jwt.verify(token, process.env.secret)
        if (!decode) {
            return res.json("user is not authorizr")
        }

        const cartuser = await Cart.findOne({ user: decode.id })

        const { productId, newquantity } = req.body

        await cartuser.edit(productId, newquantity)
        return res.status(200).json("cart is edit", cartuser)
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const allcart = async (req, res) => {
    try {
        const token = req.cookies.token
        if (!token) {
            return res.json("user have not token")
        }

        const decoded = jwt.verify(token, process.env.secret)
        if (!decoded) {
            return res.json("user is unathorize")
        }
        const cart = await Cart.findOne({ user: decoded.id }).populate("items.product")
        if (!cart) {
            return res.json("user have not products incart")
        }
        res.status(200).json(cart)
    }
    catch (error) {
        res.status(500).json(error.message)
    }
}

export const delcart = async (req, res) => {
    try {
        const token = req.cookies.token
        if (!token) {
            return res.json("token not avialble")
        }
        const decode = jwt.verify(token, process.env.secret)
        if (!decode) {
            return res.json("token is not authorize")
        }

        const cartuser = await Cart.findOne({ user: decode.id })

        const { productId } = req.body
        await cartuser.cartdel(productId)
        res.status(200).json("items dleted")
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}
export const addorder = async (req, res) => {
    try {
        const { userId, shipping, productId, quantity } = req.body

        let orderitems = []
        let totalamount = 0

        if (productId) {
            const findproduct = await product.findById(productId)
            if (!findproduct) {
                return res.status(404).json({ message: "product not found" })
            }
            orderitems.push({
                product: productId,
                quantity: quantity || 1,
                price: findproduct.price
            })
            totalamount = findproduct.price * (quantity || 1)
        }
        else {
            const cartuser = await Cart.findOne({ user: userId })
            if (!cartuser || cartuser.items.length === 0) {
                return res.status(400).json({ message: "cart is empty" })
            }

            orderitems = cartuser.items
            const cartresult = await cartuser.totalamount()
            totalamount = cartresult.finaltotal

            cartuser.items = []
            await cartuser.save()
        }

        const neworder = new Order({
            user: userId,
            items: orderitems,
            totalamount,
            shipping
        })

        await neworder.save()

        res.status(200).json(neworder)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}
export const createpayment = async (req, res) => {
    try {
        const { orderId } = req.body

        const findorder = await Order.findById(orderId)
        if (!findorder) {
            return res.status(203).json("order not find")
        }

        const payment = await stripe.paymentIntents.create({
            amount: Math.round(findorder.totalamount * 100),
            currency: "usd",
            metadata: {
                user: findorder.user?.name,
                orderId: findorder._id.toString()
            }
        })

        findorder.stripepayment = payment.id
        await findorder.save()
        res.status(200).json({ clientsecret: payment.client_secret })
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const paymenthook = async (req, res) => {
    const sign = req.headers["stripe-signature"]
    let event
    try {
        event = stripe.webhooks.constructEvent(req.body, sign, process.env.stripe_webhook_secret)

    }
    catch (error) {
        return res.status(400).json({ message: error.message })
    }

    if (event.type == "payment_intent.succeeded") {
        const paymentintent = event.data.object
        const relatedata = paymentintent.metadata.orderId

        const findorder = await Order.findById(relatedata)
        findorder.payment = "paid"
        await findorder.save()
    }
    if (event.type == "payment_intent.payment_failed") {
        const paymentintent = event.data.object
        const relatedata = paymentintent.metadata.orderId

        const findorder = await Order.findById(relatedata)

        findorder.payment = "failed"
        await findorder.save()
    }

    res.status(200).json({ received: true })

}

export const allproducts = async (req, res) => {
    try {
        const products = await product.find().limit(20)
        if (!products) {
            res.status(400).json("products not find")
        }
        res.status(200).json(products)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}


export const ai = async (req, res) => {
    try {

        const model = new ChatGroq({
            model: "openai/gpt-oss-20b",
            apiKey: process.env.GROQ_API_KEY,
            temperature: 0
        })

        const token = req.cookies.token;

        const decode = jwt.verify(
            token,
            process.env.secret
        );

        const userid = decode.id;

        const searchstatus = productstatus(userid);
        const searchcart = viewcart(userid)
        const ordercart = cartorder(userid)
        const delcart = removecart(userid)
        const cartupdate = updatecart(userid)
        const ship = shipai(userid)

        const agent = createAgent({
            model,
            tools: [searchproduct, searchstatus, ship, productlist, searchcart, ordercart, delcart, cartupdate],
            systemPrompt: `
You are an ecommerce shopping assistant.

IMPORTANT RULES:

1. Whenever the user asks about a product, product availability,
   stock, price, product name, or asks whether a product exists,
   ALWAYS use the searchproduct tool.

2. NEVER answer product availability from your own knowledge.

3. If the user mentions a product name such as:
   "women bag"
   "oxford shoes"
   "stylish bag"
   "white sneakers"

   extract the product name and pass it as the keyword
   to searchproduct.

4. If searchproduct returns products, answer using the returned
   database information.

5. If searchproduct returns an empty array, tell the user that
   the product was not found.

6. Do not make up products, prices, stock quantities, or images.

7. For product questions, database information from searchproduct
   is the source of truth.

8. If the user asks for a product, include useful information such
   as product name, price, and available stock.

9. If the tool returns an image, preserve the product information
   from the tool response.
`
        });

        const { prompt } = req.body

        const response = await agent.invoke({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        })

        const finalmessage = response.messages[response.messages.length - 1].content
        let image = null
        for (const check of response.messages) {
            if (check.role === "tool" || check._getType() === "tool") {
                try {
                    const parsed = JSON.parse(check.content)
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].image) {
                        image = parsed[0].image
                        break
                    }
                    if (parsed.image) {
                        image = parsed.image
                        break
                    }

                }
                catch (error) {
                    return res.status(401).json({ message: error.message })
                }
            }
        }
        res.status(200).json({ text: finalmessage, image: image })
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const allorders = async (req, res) => {
    try {
        const { payment, status } = req.query
        let filter = {}

        if (payment) {
            filter.payment = payment
        }
        if (status) {
            filter.status = status
        }
        const orders = await Order.find(filter)
        res.status(200).json(orders)
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const shiproute = async (req, res, next) => {
    try {
        const { id } = req.body

        const check = await Order.findById(id)
        console.log(check._id)
        if (!check) {
            return res.status(404).json({ message: "Order not found in database" });
        }


        const shipemail = await Order.shiproute(id)
        req.orderInfo = {
            orderid: check._id,
            toemail: shipemail
        }
        next()
    }
    catch (error) {
        res.status(500).json(error.message)
    }
}

export const discountcupon = async (req, res) => {
    try {
        const { discount } = req.body

        const addiscount = new Cupon({ discount })
        await addiscount.save()
        return res.status(200).json(addiscount)
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const catogry = async (req, res) => {
    try {
        const { type, price } = req.query

        const validPrice = price && !isNaN(price) ? Number(price) : null

        const cachkey = `categry:${type || "all"}:${validPrice ?? "any"}`
        const cached = await redis.get(cachkey)
        if (cached) {
            return res.json(JSON.parse(cached))
        }

        const filter = {}
        if (validPrice !== null) filter.price = { $lte: validPrice }
        if (type) filter.type = type

        const find = await product.find(filter)

        await redis.set(cachkey, JSON.stringify(find), "EX", 300)
        res.status(200).json(find)
    }
    catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
}
