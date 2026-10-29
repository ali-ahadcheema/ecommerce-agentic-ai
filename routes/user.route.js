import { sign, login, add, dleteproduct, catogry, shiproute, editcart, allorders, discountcupon, ai, addcart, delcart, allcart, addorder, createpayment, allproducts, logout, paymenthook, getme } from "../fuctions/user.function.js";
import { queutest } from "../queu/email.js";
import express from "express"
import upload from "../middelware/multer.midelware.js";
import admin from "../middelware/admin.midelware.js";
import { mailsender } from "../mailer/node.mail.js";

const route = express.Router()


route.post("/qtest", queutest)
route.post("/sign", sign)
route.post("/login", login)
route.post("/logout", logout)
route.get("/category", catogry)
route.get("/me", getme)
route.post("/add", upload.single("image"), add)
route.delete("/delete", admin, dleteproduct)
route.post("/addcart", addcart)
route.post("/discount", admin, discountcupon)
route.put("/admin/ship", admin, shiproute, mailsender, (req, res) => {
    res.json("order status change and mail send")
})
route.delete("/delcart", delcart)
route.post("/edit", editcart)
route.post("/aicalling", ai)
route.get("/allcart", allcart)
route.post("/addorder", addorder)
route.get("/orders/admin", admin, allorders)
route.post("/payment/create", createpayment)

route.get("/products", allproducts)
route.get("/", (req, res) => {
    res.json("server a")
})

export default route