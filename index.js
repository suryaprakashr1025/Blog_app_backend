const express = require("express")
const cors = require("cors")
//const bodyParser = require("body-parser")
const nodemailer = require("nodemailer")
const mongodb = require("mongodb")
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv").config()
const bcrypt = require("bcryptjs")
const URL = process.env.DB
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET
//USING THIS URL IN GENERATE ALPHANUMERIC NUMBER (https://www.gigacalculator.com/randomizers/random-alphanumeric-generator.php)
const app = express()

app.use(cors({
    // origin: "http://localhost:3000",
    // origin:"https://harmonious-rugelach-13c182.netlify.app",
    origin: "*",
}))
app.use(express.json())


//POST = blogger REGISTER PAGE
app.post("/blogger/register", async (req, res) => {
    try {
        //connect the database
        const connection = await mongoClient.connect(URL)

        //select the database
        const db = connection.db("Blog_app")

        //hasing password
        var salt = await bcrypt.genSalt(10) //secret key
        //console.log(salt)
        var hash = await bcrypt.hash(req.body.password, salt) //hash the password
        //console.log(hash)
        req.body.password = hash;

        //select the collection
        //Do operation
        const checkUsername = await db.collection("blogger").find({ username: req.body.username }).toArray()
        console.log(checkUsername.length)

        if (checkUsername.length === 0) {
            const checkEmail = await db.collection("blogger").find({ email: req.body.email }).toArray()
            console.log(checkEmail.length)
            if (checkEmail.length === 0) {
                const blogger = await db.collection("blogger").insertOne(req.body)
                console.log(blogger)
                res.status(200).json({ message: "blogger created" })
            } else {
                res.json({ message: "username,email and password is already exists" })
            }

        } else {
            res.json({ message: "username,email and password is already exists" })
        }

        //close the connection
        await connection.close()

    } catch (error) {
        res.status(401).json({ message: "unauthorized" })
    }
})

//POST = blogger LOGIN PAGE
app.post("/blogger/login", async (req, res) => {
    try {
        //connect the database
        const connection = await mongoClient.connect(URL)

        //select the database
        const db = connection.db("Blog_app")

        //select the collection
        //Do operation
        const blogger = await db.collection("blogger").findOne({ username: req.body.username })
        console.log(blogger)

        if (blogger) {
            //create token
            const token = jwt.sign({ _id: blogger._id }, JWT_SECRET, { expiresIn: "5m" })
            console.log(token)
            const compare = await bcrypt.compare(req.body.password, blogger.password) //req.body.password is automatic hasing === blogger.password already hasing
            console.log(compare) //return boolean value
            if (compare) {
                res.status(200).json({ message: "success", token })
            } else {
                res.json({ message: "username and password is incorrect" })
            }
        } else {
            res.json({ message: "username and password is incorrect" })
        }
        //close the connection
        await connection.close()


    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
    }
})

//POST = USER REGISTER PAGE
app.post("/user/register", async (req, res) => {
    try {
        //connect the database
        const connection = await mongoClient.connect(URL)

        //select the database
        const db = connection.db("Blog_app")

        //select the collection
        //Do operation
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(req.body.password, salt)
        req.body.password = hash;

        const checkUsername = await db.collection("user").findOne({ username: req.body.username })
        console.log(checkUsername)

        if (!checkUsername) {
            const checkEmail = await db.collection("user").find({ email: req.body.email }).toArray()
            console.log(checkEmail.length)

            if (checkEmail.length === 0) {
                const user = await db.collection("user").insertOne(req.body)
                console.log(user)
                res.status(200).json({ message: "user created" })
            } else {
                res.json({ message: "username,email and password is already exists" })
            }

        } else {
            res.json({ message: "username,email and password is already exists" })
        }

        //close the connection
        await connection.close()



    } catch (error) {
        res.status(401).json({ message: "something went wrong" })
    }
})

//POST = USER LOGIN PAGE
app.post("/user/login", async (req, res) => {
    try {
        //connect the database
        const connection = await mongoClient.connect(URL)

        //select the database
        const db = connection.db("Blog_app")

        //select the collection
        //Do operation
        const loginUser = await db.collection("user").findOne({ username: req.body.username })
        console.log(loginUser)

        if (loginUser) {
            const token = jwt.sign({ _id: loginUser._id }, JWT_SECRET, { expiresIn: "5m" })
            console.log(token)
            const compare = await bcrypt.compare(req.body.password, loginUser.password)
            console.log(compare)
            if (compare) {
                res.json({ message: "success", token })
            } else {
                res.json({ message: "username and password is incorrect" })
            }
        } else {
            res.json({ message: "username and password is incorrect" })
        }

        //close connection
        await connection.close()
    } catch (error) {
        res.status(401).json({ message: "something went wrong" })
    }
})

//PUT = blogger PASSWORD CHANGE
app.put("/blogger/:username", async (req, res) => {
    try {
        //connect the database
        const connection = await mongoClient.connect(URL)

        //select the database
        const db = connection.db("Blog_app")

        const checkUsername = await db.collection("blogger").findOne({ username: req.params.username })
        console.log(checkUsername)
        delete req.body._id
        delete req.body.username
        if (checkUsername) {
            const compare = await bcrypt.compare(req.body.currentPassword, checkUsername.password)
            console.log(compare)
            delete req.body.currentPassword
            if (compare) {
                const salt = await bcrypt.genSalt(10)
                const hash = await bcrypt.hash(req.body.password, salt)
                req.body.password = hash
                const changePassword = await db.collection("blogger").updateOne({ username: req.params.username }, { $set: req.body })
                console.log(changePassword)
                res.status(200).json({ message: "password changed successfully" })

                //new password : $2a$10$R93EwsoTAUHjHKnW0RLuAezBADRO8dCN3xtoczaLdOtTb6hKr7AW2

                //current password : $2a$10$HXslJD2SeumtwAbuAJ.DCOTesmiHEBUB3wQIdfnBx8LptQjE2tSyG
            } else {
                res.json({ message: "username and current password is incorrect" })
            }
        } else {
            res.json({ message: "username and current password is incorrect" })
        }

        //connection close
        await connection.close()
    } catch (error) {
        res.status(401).json({ message: "unauthorized" })
    }
})

//PUT = USER PASSWORD CHANGE
app.put("/user/:username", async (req, res) => {
    try {
        //connect the database
        const connection = await mongoClient.connect(URL)

        //select the database
        const db = connection.db("Blog_app")

        const checkUsername = await db.collection("user").findOne({ username: req.params.username })
        console.log(checkUsername)

        delete req.body._id
        delete req.body.username

        if (checkUsername) {
            const compare = await bcrypt.compare(req.body.currentPassword, checkUsername.password)
            console.log(compare)
            delete req.body.currentPassword

            if (compare) {
                const salt = await bcrypt.genSalt(10)
                const hash = await bcrypt.hash(req.body.password, salt)
                req.body.password = hash
                const changePassword = await db.collection("user").updateOne({ username: req.params.username }, { $set: req.body })
                console.log(changePassword)
                res.status(200).json({ message: "password changed successfully" })
            } else {
                res.json({ message: "username and password is incorrect" })
            }

        } else {
            res.json({ message: "username and password is incorrect" })
        }

        //connection close
        await connection.close()
    } catch (error) {
        res.status(401).json({ message: "unauthorized" })
    }
})

//POST = blogger FORGET PASSWORD
app.post("/blogger/forgetpassword", async (req, res) => {
    try {
        //connect the database
        const connection = await mongoClient.connect(URL)

        //select the datatbase
        const db = connection.db("Blog_app")
        // console.log("surya")
        //select the collection
        //Do operation
        const bloggerUsername = await db.collection("blogger").findOne({ username: req.body.username })
        console.log(bloggerUsername)
        delete req.body.username

        if (bloggerUsername) {
            const bloggerEmail = req.body.email
            console.log(bloggerEmail)

            if (bloggerEmail === bloggerUsername.email) {
                const salt = await bcrypt.genSalt(2)
                console.log(salt) //salt.length = 29

                const hash = await (await bcrypt.hash(req.body.email, salt)).slice(24, 36)
                console.log(hash) //this hash is sending mail code
                //req.body.email = hash

                //mail code again hash
                const hash1 = await bcrypt.hash(hash, salt)
                console.log(hash1)

                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.US,
                        pass: process.env.PS
                    }
                })

                const mailOptions = {
                    from: process.env.US,
                    to: req.body.email,
                    subject: "This is forget password mail and do not reply",
                    html: `<h1>This is your current password:</h1>
                    <span><h2>${hash}</h2></span>`
                }

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error)
                    } else {
                        console.log(info);
                        console.log("info:" + info.response)
                    }
                })

                transporter.close()

                delete req.body.email

                const changePassword = await db.collection("blogger").updateOne({ username: bloggerUsername.username }, { $set: { password: hash1 } })
                console.log(changePassword)

                res.json({ message: "mail sent successfully" })
            } else {
                res.json({ message: "username and email is incorrect" })
            }

        } else {
            res.json({ message: "username and email is incorrect" })
        }

        //close the connection
        await connection.close()

    } catch (error) {
        res.status(401).json({ message: "unauthorized" })
    }
})

//POST = USER FORGET PASSWORD
app.post("/user/forgetpassword", async (req, res) => {
    try {
        //connect the database
        const connection = await mongoClient.connect(URL)

        //select the database
        const db = connection.db("Blog_app")

        //select the collection
        //Do operation
        const userForget = await db.collection("user").findOne({ username: req.body.username })
        console.log(userForget)
        delete req.body.username
        if (userForget) {
            //const userEmail = await db.collection("user").findOne({ email: req.body.email} )
            const userEmail = req.body.email
            console.log(userEmail)
            if (userForget.email === userEmail) {
                const salt = await bcrypt.genSalt(2)
                console.log(salt)
                console.log(salt.length)

                const hash = await (await bcrypt.hash(req.body.email, salt)).slice(25, 35)
                console.log(hash)
                const hash1 = await bcrypt.hash(hash, salt)
                console.log(hash1)

                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.US,
                        pass: process.env.PS
                    }
                })

                const mailOptions = {
                    from: process.env.US,
                    to: req.body.email,
                    subject: "This is forget password mail and do not reply",
                    html: `<h1>This is your current password:</h1>
                <h1>${hash}</h1>`
                }

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error)
                    } else {
                        console.log(info)
                        console.log(info.response)
                    }
                })

                transporter.close()
                delete req.body.email;

                const changePassword = await db.collection('user').updateOne({ username: userForget.username }, { $set: { password: hash1 } })
                console.log(changePassword)

                res.status(200).json({ message: "mail sent successfully" })

            } else {
                res.json({ message: "username and email is incorrect" })
            }

        } else {
            res.json({ message: "username and email is incorrect" })
        }

        //connection close
        await connection.close()

    } catch (error) {
        res.status(401).json({ message: "unauthorized" })
    }
})


//BLOG DETAILS
//CREATE BLOG
app.post("/createblog",async(req,res)=>{
    try{
        const connection = await mongoClient.connect(URL)
        const db= connection.db("Blog_app")
        const currentDate = new Date()
        const date = currentDate.getDate()
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()
        req.body.publish_date = `${date}-${month}-${year}`
        console.log(req.body.publish_date)

        const bloglength = await db.collection("blog").find().toArray()
        console.log(bloglength.length)
        req.body.blogid = bloglength.length + 1

        const blog = await db.collection("blog").insertOne(req.body)
        res.json({message:"Blog created"})
        await connection.close()
    }catch(error){
        res.status(500).json({message:"Createblog error"})
    }
})


// {
//     "publisher_name":"surya",
//     "title":"Javascript",
//     "image":"https://codedamn-blog.s3.amazonaws.com/wp-content/uploads/2022/05/09152309/js-logo.png",
//     "description":"JavaScript was invented by Brendan Eich in 1995. It was developed for Netscape 2, and became the ECMA-262 standard in 1997. After Netscape handed JavaScript over to ECMA, the Mozilla foundation continued to develop JavaScript for the Firefox browser. Mozilla's latest version was 1.8"
//  }

//READ BLOG
app.get("/readblog",async(req,res)=>{
    try{
        const connection = await mongoClient.connect(URL)
        const db= connection.db("Blog_app")
        const blog = await db.collection("blog").find().toArray()
        res.json(blog)
        await connection.close()
    }catch(error){
        res.status(500).json({message:"Createblog error"})
    }
})

//GET ONE BLOGGER BLOG
app.get("/onebloggerblog/:bloggername",async(req,res)=>{
    try{
        const connection = await mongoClient.connect(URL)
        const db= connection.db("Blog_app")
        const blog = await db.collection("blog").find({publisher_name:req.params.bloggername}).toArray()
        if(blog){
            res.json(blog)
        }else{
            res.json({message:"Bloggername is not found"})
        }
       
        await connection.close()
    }catch(error){
        res.status(500).json({message:"Createblog error"})
    }
})

//GET ONE BLOG
app.get("/oneblog/:blogid",async(req,res)=>{
    try{
        const connection = await mongoClient.connect(URL)
        const db= connection.db("Blog_app")
        const blog = await db.collection("blog").find({blogid:parseInt(req.params.blogid)}).toArray()
        console.log(blog.length)
        if(blog.length === 1){
            res.json(blog)
        }else{
            res.json({message:"Bloggername is not found"})
        }
       
        await connection.close()
    }catch(error){
        res.status(500).json({message:"Createblog error"})
    }
})

//UPDATE BLOG
app.put("/updateblog/:blogid",async(req,res)=>{
    try{
        const connection = await mongoClient.connect(URL)
        const db= connection.db("Blog_app")
      
        const findblog = await db.collection("blog").find({blogid:parseInt(req.params.blogid)}).toArray()
        console.log(findblog.length)
        if(findblog.length === 1){
            const updateblog = await db.collection("blog").updateOne({blogid:parseInt(req.params.blogid)},{$set:req.body})
            res.json({message:"Blog is updated successfully"})
        }else{
            res.json({message:"Blogid is not found"})
        }
       
        await connection.close()
    }catch(error){
        res.status(500).json({message:"Createblog error"})
    }
})

//BLOG REVIEWS
app.put("/reviewblog/:blogid",async(req,res)=>{
    try{
        const connection = await mongoClient.connect(URL)
        const db= connection.db("Blog_app")
        const blog = await db.collection("blog").findOne({blogid:parseInt(req.params.blogid)})
        if(blog){
            const reviewblog = await db.collection("blog").updateOne({blogid:parseInt(req.params.blogid)},{$push:{reviews:req.body}})
            res.json({message:"Reviewed the blog"})
        }else{
            res.json({message:"Blogid is not found"})
        }
       
        await connection.close()
    }catch(error){
        res.status(500).json({message:"Createblog error"})
    }
})

// {
   
//     "reader_name":"prakash",
//     "rating":"4",
//     "review":"content is good"
// }

//DELETE THE BLOG
app.delete("/deleteblog/:blogid",async(req,res)=>{
    try{
        const connection = await mongoClient.connect(URL)
        const db= connection.db("Blog_app")
        const deleteblog = await db.collection("blog").deleteOne({blogid:parseInt(req.params.blogid)})
        if(deleteblog){
            res.json({message:"Deleted the blog"})
        }else{
            res.json({message:"Blogid is not found"})
        }
       
        await connection.close()
    }catch(error){
        res.status(500).json({message:"Createblog error"})
    }
})


app.listen(3022)
