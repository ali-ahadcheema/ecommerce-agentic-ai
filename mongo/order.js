import express from "express"
import mongoose, { Types } from "mongoose"


const orderschema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    items: [{

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product"
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalamount: {
        type: Number,
        required: true
    },
    shipping: {
        street: String,
        city: String,
        postalcode: Number,
        country: String
    },
    payment: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },
    stripepayment: {
        type: String
    },
    status: {
        type: String,
        enum: ["processing", "shipped", "deliverd", "canceld"],
        default: "processing"
    }

}, {
    timestamps: true
})

orderschema.statics.shiproute = async function (id) {
    try {
        const find = await this.findById(id).populate("user")
        if (!find) {
            throw new Error("order not find ")
        }
        const usereamil = find.user.email
        find.status = "shipped"
        await find.save()
        return usereamil
    }
    catch (error) {
        throw new Error(error.message)
    }
}


const Order = new mongoose.model("Order", orderschema)

export default Order