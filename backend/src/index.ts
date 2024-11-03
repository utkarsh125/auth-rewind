//ENTRY POINT OF THE APPLICATION

import express from "express";

const app = express();

app.get("/", (req, res) => {
    res.status(200).json({
        status: "Healthy"
    })
})

app.listen(4000, () =>{
    console.log("Listening on port 4000")
})