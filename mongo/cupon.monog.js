import mongoose from "mongoose";

const cuponschema = mongoose.Schema({
    discount: Number,
    active: Boolean
})

const Cupon = new mongoose.model("Cupon", cuponschema)

export default Cupon