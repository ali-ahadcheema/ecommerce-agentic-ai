import mongoose from "mongoose"


const userschema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: String,
    age: Number,
    usertype: {
        type: String,
        default: "admin",
        enum: ["localuser", "admin"]
    },

}, {
    timestamps: true,
    autoIndex: true
})


const User = mongoose.model("User", userschema)

export default User