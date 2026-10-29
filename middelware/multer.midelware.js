import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import cloudinary from "../clodinary/user.cloudinary.js"

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,

    params: {
        folder: "2nd-ecomm-product",
        allowed_formats: ["jpg", "png", "jpeg", "webp"]
    }
})

const upload = multer({ storage })

export default upload