const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

let database = null
const dbPath = path.join(__dirname, "users.db")

const initializeDBAndServer = async () => {
    try {
        database = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })
        app.listen(3003, () => {
            console.log("Server is Running at http://localhost:3003/")
        })
    } catch (error) {
        console.log(`DB Error: ${error}`)
        process.exit(1)
    }
}

initializeDBAndServer()

app.post('/signup/', async (request, response) => {
    const {username, password, name, age, gender} = request.body
    const getUserQuery = `SELECT * FROM users WHERE username = "${username}"`
    const dbUser = await database.get(getUserQuery)
    const hashedPassword = await bcrypt.hash(password, 5)
    if (dbUser === undefined) {
        const getAddUserQuery = `INSERT INTO users (username, password, name, age, gender) VALUES ("${username}", "${hashedPassword}", "${name}", ${age}, "${gender}");`
        await database.run(getAddUserQuery)
        response.send("User Registered Successfully")
    } else {
        response.status = 400
        response.send("Username already exits")
    }
})

app.post('/login/', async (request, response) => {
    const {username, password} = request.body
    const getUserQuery = `SELECT * FROM users WHERE username = "${username}"`
    const dbUser = await database.get(getUserQuery)
    if (dbUser === undefined) {
        response.status = 400
        response.send("Invalid Username")
    } else {
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
        if (isPasswordMatched) {
            const payload = {username: username}
            const jwtToken = jwt.sign(payload, "Arjun")
            response.send({jwtToken})
        } else {
            response.status = 400
            response.send("Invalid Password")
        }
    }
})

app.get("/users/", async (request, response) => {
    const getUsersQuery = `SELECT * FROM users`
    const dbResponse = await database.all(getUsersQuery)
    response.send(dbResponse)
})

app.get("/users/:id", async (request, response) => {
    const {id} = request.params
    const getUsersQuery = `SELECT * FROM users WHERE id = ${id}`
    const dbResponse = await database.get(getUsersQuery)
    response.send(dbResponse)
})

app.put("/users/modify/:id/", async (request, response) => {
    const {id} = request.params
    const {password, name, age, gender} = request.body
    const hashedPassword = await bcrypt.hash(password, 5)
    const getModifyUserQuery = `UPDATE users SET password = '${hashedPassword}', name = '${name}', age = ${age}, gender = '${gender}' WHERE id = ${id};`
    await database.run(getModifyUserQuery)
    response.send("Update Successfully")
})

app.delete("/users/remove/:id/", async (request, response) => {
    const {id} = request.params
    const getRemoveUserQuery = `DELETE FROM users WHERE id = ${id};`
    await database.run(getRemoveUserQuery)
    response.send("Delete Successfully")
})
