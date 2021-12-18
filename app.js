const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const dbPath = path.join(__dirname, "tastykitchens.db");
const app = express();

app.use(express.json());

app.use(cors());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(process.env.PORT || 3004, () => {
      console.log("Server Running at http://localhost:3004/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(-1);
  }
};
initializeDBAndServer();

//User Register API
app.post("/signup/", async (req, res) => {
  const { username, email, password } = req.body;
  const isExist = await db.get(`
    select * from user where email = '${email}'
  `);
  if (isExist === undefined) {
    if (password.length < 5) {
      res.status(400);
      res.send({ error_msg: "Password is too short" });
      console.log("Password is too short");
    } else {
      const encryptedPass = await bcrypt.hash(password, 10);
      const addUser = await db.run(`
            insert into user (username,email,password) values ('${username}','${email}','${encryptedPass}');
        `);
      res.status(200);
      res.send("User created successfully");
      console.log("User created successfully");
    }
  } else {
    res.status(400);
    res.send("User already exists");
    console.log("User already exists");
  }
});

//User Login API
app.post("/login/", async (req, res) => {
  const { email, password } = req.body;
  const isUser = await db.get(`
  select * from user where email = '${email}'
  `);
  if (isUser === undefined) {
    res.status(400);
    res.send({ error_msg: "Invalid username" });
  } else {
    if (await bcrypt.compare(password, isUser.password)) {
      let payload = { username: isUser.username };
      console.log(`${isUser.username} is logged in`);
      let jwt_token = jwt.sign(payload, "SECRET_TOKEN");
      res.send({ jwt_token });
      res.status(200);
    } else {
      res.status(400);
      res.send({ error_msg: "Invalid password" });
    }
  }
});
