import queu from "../queu.js";
import redis from "ioredis"


export const queutest = async (req, res) => {
    try {

        await redis.set

        const key = `ali${Date.now()}`
        console.log("ADDING JOB");

        const job = await queu.add(
            "email queu",
            {
                email: "aliahad420cheema@gmail.com",
                key
            },
            {
                jobId: `email-${key}`
            }
        );

        console.log("ENQUEUED JOB:", job.id)

        res.status(202).json({
            orderis: job.id,
            email: job.email
        })
    }
    catch (error) {
        res.status(500).json(error.message)
    }
}
