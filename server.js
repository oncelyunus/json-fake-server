import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Low, JSONFile } from 'lowdb';
import { customAlphabet } from "nanoid";
import jwt from "jsonwebtoken";
const nanoid = customAlphabet('1234567890', 18)

const adapter = new JSONFile('db.json');
const db = new Low(adapter);
await db.read()

db.data ||= { menus: [], users: [] }

const { menus } = db.data
const { users } = db.data
const app = express();
app.use(express.json())

app.use(cors())

const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers["Authorization"];
    if (bearerHeader !== undefined) {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.send({
            "status": "403",
            "title": "Token Not Found",
            "detail": "Token Not Found",
            "code": "auth-0002"
        })
    }
}

app.get('/menus', async (req, res) => {
    const post = menus;
    res.send(post)
})

app.post("/menus/parents", async (req, res) => {
    const requestBody = req.body;
    console.log("requestBody", requestBody, requestBody.parentId);
    const result = menus.filter((item) => item.parentId === requestBody.parentId)
    res.send(result)
})

app.get('/menus/:id', async (req, res) => {
    const post = menus.find((p) => p.id === req.params.id)
    res.send(post);
})

app.post('/menus/new', async (req, res, next) => {
    const newMenu = req.body;
    menus.push({
        ...newMenu, id: nanoid()
    })
    await db.write()
    res.send({ "success": true })
})

app.post("/login", async (req, res, next) => {
    const reqBody = req.body;
    const user = users.find((u) => u.email === reqBody.email && u.password === reqBody.password)
    if (!user) {
        res.send({
            "status": "404",
            "title": "Incorrect username or password.",
            "detail": "Authentication failed due to incorrect username or password.",
            "code": "auth-0001"
        })
    } else {
        user.response.id = nanoid()
        jwt.sign(user.response, "secretKey", (err, token) => {
            res.json({
                accessToken: token,
                user: user
            })
        })

    }
})

app.post("/me", verifyToken, async (req, res) => {
    jwt.verify(req.token, "secretKey", (err, authData) => {
        if (err) {
            res.send({
                "status": "403",
                "title": "Invalid Token",
                "detail": "Invalid Token",
                "code": "auth-0003"
            })
        } else {
            res.json({
                userData: authData
            })
        }
    })
})



app.listen(4000, () => {
    console.log("listening on 4000");
})