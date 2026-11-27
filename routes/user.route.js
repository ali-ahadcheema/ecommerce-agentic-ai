import { sign, googlecall, login, add, myorders, newarrival, productdtail, dleteproduct, skip, catogry, shiproute, editcart, allorders, discountcupon, ai, addcart, delcart, allcart, addorder, createpayment, allproducts, logout, paymenthook, getme } from "../fuctions/user.function.js";
import { queutest } from "../queu/email.js";
import "dotenv/config"
import express from "express"
import upload from "../middelware/multer.midelware.js";
import admin from "../middelware/admin.midelware.js";
import { mailsender } from "../mailer/node.mail.js";
import passport from "passport";
import redis from "../redis.js";
import Cart from "../mongo/cart.monog.js";
import jwt from "jsonwebtoken"


const route = express.Router()


route.get("/auth/googlesign",
    passport.authenticate("google", { scope: ["profile", "email"], session: false, prompt: "select_account" })
);
route.get("/auth/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "http://localhost:5173/login",
    }),
    googlecall
);
route.post("/qtest", queutest)
route.get("/prdetail/:id", productdtail)
route.get("/new", newarrival)
route.post("/sign", sign)
route.post("/login", login)
route.post("/logout", logout)
route.get("/category", catogry)
route.get("/skip", skip)
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
route.post("/aiconfirm", async (req, res) => {
    const { confirmId, accept } = req.body;

    const raw = await redis.get(`pending:${confirmId}`);
    if (!raw) return res.status(404).json({ message: "request expire ho gayi" });

    const pending = JSON.parse(raw);

    const token = req.cookies.token
    if (!token) {
        return res.status(401).json("login required")
    }

    const decode = await jwt.verify(token, process.env.JWT_SECRET)
    if (!decode) {
        return res.status(401).json("token is not verify")
    }


    if (pending.userid !== decode.id) {
        return res.status(403).json({ message: "not allowed" });
    }

    await redis.del(`pending:${confirmId}`);

    if (!accept) return res.json({ text: "Theek hai, cancel kar diya." });

    if (pending.action === "delcart") {
        await Cart.updateOne(
            { user: pending.userid },
            { $pull: { items: { product: pending.args.productId } } }
        );
    }

    res.json({ text: "product is deleted" });
});
route.get("/allcart", allcart)
route.post("/addorder", addorder)
route.get("/myorders", myorders)
route.get("/orders/admin", admin, allorders)
route.post("/payment/create", createpayment)

route.get("/products", allproducts)

export default route