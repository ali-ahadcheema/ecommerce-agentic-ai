import { Worker } from "bullmq";
import redis from "../redis.js";
import dotenv from "dotenv"
import { transporte } from "../mailer/node.mail.js";

const result = dotenv.config()
console.log("CWD:", process.cwd())
console.log("DOTENV ERROR:", result.error?.message)
console.log("DOTENV PARSED KEYS:", Object.keys(result.parsed || {}))



const worker = new Worker(
    "email queu",
    async (job) => {

        console.log("USER:", process.env.admin_gmail);
        console.log("PASS exists:", !!process.env.gmail_secret);
        const key = `email:${job.data.key}`
        try {
            console.log("JOB RECEIVED:", job.id);
            console.log("JOB DATA:", job.data);

            const result = await redis.set(key, "done", "EX", 86400, "NX")

            if (result === null) {
                console.log("Duplicate operation — skipping:", job.data.id);
                return { skipped: true };
            }
            const info = await transporte.sendMail({
                from: process.env.admin_gmail,
                to: job.data.email,
                subject: "your order has been shiipend",
                html: ` <p>Good news! Your order <b>${job.data.id}}</b> has been shipped.</p>`
            })

            return { success: true };
        }
        catch (error) {
            await redis.del(key)
            throw error
        }
    },
    { connection: redis }
);

worker.on("ready", () => console.log("WORKER READY"));

worker.on("active", (job) => {
    console.log("JOB ACTIVE:", job.id);
});

worker.on("completed", (job, result) => {
    console.log("JOB COMPLETED:", job.id, result);
});

worker.on("failed", (job, err) => {
    console.log("JOB FAILED:", job?.id, err.message);
});

worker.on("error", (err) => {
    console.error("WORKER ERROR:", err);
});