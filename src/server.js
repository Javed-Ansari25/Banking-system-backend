import app from "./app.js";
import dotenv from "dotenv";
import connectDb from "./config/db.js";

dotenv.config();

connectDb()
.then(() => {
    app.listen(process.env.PORT || 5000, () => {
        console.log(`SERVER RUNNING ON ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO_DB CONNECTION FIELD", err);
})
