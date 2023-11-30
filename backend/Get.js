const mysql = require('mysql2')
const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

dotenv.config();
const app = express();
const corsOptions = {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Access-Control-Allow-Origin", "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    credentials: true
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());


function validate_input(inputString){
    const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '=', '{', '}', '[', ']', '|', '\\', ';', ':', '"', '\'', '<', '>', ',', '.', '/', '?'];

    // Replace each special character from the word list with an empty string
    specialChars.forEach(char => {
      inputString = inputString.split(char).join('');
    });
    return inputString
};

function verifyToken(req, res, next) {
    const token = req.cookies['token']
  
    if (!token) {
      return res.status(401).json({ auth: false, message: 'Not Allowed' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(500).json({ auth: false, message: 'Failed to authenticate token' });
      }
      if(typeof(decoded.id)==='number'){
        req.userId = decoded.id; // Store user ID from token in request object
      }else{
        return res.status(500).json({ message: 'Failed to authenticate token' });
      }
      next();
    });
  }

// database setup
const db = mysql.createPool({
    host: process.env.URL,
    port: '3306',
    user: process.env.SQL_USERNAME,
    password: process.env.CONNECTION_PASS,
    database: 'mydb'
}).promise();

app.post('/register', async (req, res) => {
    
    const { body } = req;

    if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    const username = body.username;
    const password = body.password;

    if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' });
    }
    if(username!==validate_input(username)){
        return res.status(409).json({ message: 'Username cannot contain special characters' });
    }
    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the saltRounds
    
    // Check if the username already exists in the database
    try{
        const existingUsers = await db.query('SELECT * FROM users WHERE users_name = ?', [username]);
        if (existingUsers[0].length > 0) {
            
            return res.status(409).json({ message: 'Username already exists' });
            
        }else {
            // If username is available, insert the new user into the database
            const adduser= await db.query('INSERT INTO users (users_name, users_password) VALUES (?, ?)', [username, hashedPassword]);
                
            const token = jwt.sign({ id: res.insertId }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Create JWT token
            res.cookie('token', token, { httpOnly: true, secure: true });
            return res.status(201);
                
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { body } = req;
    if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const username = body.username;
    const password = body.password;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' });
    }

    if(username!==validate_input(username)){
        
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    try{
        const existingUsers = await db.query('SELECT * FROM users WHERE users_name = ?', [username]);
        if(existingUsers[0].length===0){
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user=existingUsers[0][0]
        const passwordMatch = await bcrypt.compare(password, user.users_password)
        if (passwordMatch) {
            const token = jwt.sign({ id: user.users_id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Create JWT token
            res.cookie('token', token, { httpOnly: true, secure: true });
            return res.status(200).json({ message: 'Sucess' });
        }else{
  
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    }catch(error){
        return res.status(500).json({ error: 'Internal server error' });
    }
    
  });

app.post('/addlisting',verifyToken, async (req,res)=>{
    
    const { body } = req;

    if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const list_Name = body.list_Name;
    const list_description=body.list_description;
    const list_price= body.list_price;
    if(list_price.match(/^[0-9]+$/) === null){
        console.log(list_price.match(/^[0-9]+$/))
        return res.status(400).json({ error: 'Invalid request body' });
    }

    if (!list_Name || !list_description || !list_price) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try{
        
        // ADD listing
        const addListing= await db.query('INSERT INTO listings (list_Name, list_description,list_price,users_id_for_list) VALUES (?, ?, ?, ?)', [list_Name, list_description,list_price,req.userId]);
            
        
        return res.status(201).json({ message: 'sucsess' });
                
        
    }catch(error){
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' });
    }

});

app.get('/listings', async (req,res)=>{
    return res.status(200).json(await db.query('SELECT list_Name,list_price,list_description FROM listings'));

});
app.listen(4321,()=>{
    console.log("listening on 4321");
});
