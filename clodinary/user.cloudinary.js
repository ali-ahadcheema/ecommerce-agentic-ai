import { v2 as cloudinary } from "cloudinary"
import dotenv from "dotenv"

dotenv.config()

cloudinary.config({
    cloud_name: process.env.cloudinary_name,
    api_key: process.env.cloudinary_api,
    api_secret: process.env.cloudinary_secret
})

export default cloudinary