import mongoose from "mongoose";


const productschema = new mongoose.Schema({
    name: String,
    type: String,
    stock: Number,
    price: Number,
    description: String,
    image: String

}, { timestamps: true })

productschema.index({ name: 1 })
productschema.index({ type: 1, createdAt: -1, price: 1 })

const product = mongoose.model("product", productschema)

export default product