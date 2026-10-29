import os from "os"
import cluster from "cluster"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"


const __dirname = path.dirname(fileURLToPath(import.meta.url))
const result = dotenv.config({ path: path.join(__dirname, "../.env") })

if (cluster.isPrimary) {
    if (result.error) {
        console.log(".env load nahi hui:", result.error.message)
        process.exit(1)
    }

    console.log("am primary", process.pid)

    for (let i = 0; i < os.availableParallelism(); i++) {
        cluster.fork()
    }

    cluster.on("exit", (worker, code) => {
        console.log(`worker ${worker.process.pid} died with code ${code}`)
        if (code !== 0) return
        cluster.fork()
    })
} else {
    console.log("worker", process.pid)
    await import("../server.js")
}