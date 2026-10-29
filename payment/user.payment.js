import { Stripe } from "stripe"
import dotenv from "dotenv"

dotenv.config()

const stripe = new Stripe(process.env.stripe_key)

export default stripe