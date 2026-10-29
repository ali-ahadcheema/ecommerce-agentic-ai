import mongoose from "mongoose";

const cartshcema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product"
            },
            name: {
                type: String
            },
            quantity: {
                type: Number
            },
            price: {
                type: Number
            }
        }
    ],
    shipping: {
        street: String,
        city: String,
        postalcode: String,
        country: String
    },
    cupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cupon"
    },

}, { timestamps: true })

cartshcema.methods.totalamount = async function () {
    let subtotal = 0
    for (let item of this.items) {
        subtotal += (item.quantity || 1) * (item.price || 1)
    }

    let discountage = 0
    console.log("cupon", this.cupon)
    if (this.cupon) {
        await this.populate("cupon")
        console.log("cupon discount", this.cupon.discount)
        if (this.cupon && this.cupon.discount) {
            discountage = this.cupon.discount
        }
    }
    let discount = (discountage * subtotal) / 100
    let finaltotal = subtotal - discount
    return {
        subtotal,
        discount,
        discountage,
        finaltotal
    }
}

cartshcema.methods.edit = async function (productId, newquantity) {
    try {

        const product = this.items.findIndex((item) => item.product.toString() == productId.toString())
        if (!product) {
            return res.json("product id not find")
        }

        if (product === -1) {
            throw new Error("product is not find")
        }
        else {
            if (newquantity > 1) {
                this.items[product].quantity = newquantity
            }
            else {
                this.items[product].quantity = 1
            }
            await this.save()
        }
    }
    catch (error) {
        throw error
    }
}

cartshcema.methods.cartdel = async function (id) {
    try {
        const itemindex = this.items.findIndex((item) => item.product.toString() === id.toString())
        if (itemindex === -1) {
            return res.json("item index is not find")
        }

        this.items = this.items.filter((item) => item.product.toString() != id.toString())
        await this.save()

    }
    catch (error) {
        throw new Error(error.message)
    }
}


const Cart = mongoose.model("Cart", cartshcema)

export default Cart