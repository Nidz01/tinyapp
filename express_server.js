//================================== MODULES ===========================================//
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser"); //Converts request body from buffer state to readable string
const cookieSession = require("cookie-session");
const {
  generateRandomString,
  getUserByEmail,
  authenticateUser,
  urlsForUser
} = require('./helpers'); //All helper functions are imported from our other js file.

//================================== MIDDLEWARE ===========================================//

app.set("view engine", "ejs"); //Setting ejs as the view engine.
app.use(bodyParser.urlencoded({extended: true})); 
app.use(
  cookieSession({
    name: "session",
    keys: ["hello"]
  })
);

app.use((req, res, next) => {
  req.currentUser = users[req.session['user_id']];
  next();
});

//const cookieParser = require('cookie-parser');
//app.use(cookieParser());

//================================== DATABASE ===========================================//

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" },
  "6smtxA": { longURL: "http://www.example.edu", userID: "user3RandomID"}
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("password1", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("password2", 10)
  },
  "user3RandomID": {
    id: "user3RandomID", 
    email: "user3@example.com", 
    password: bcrypt.hashSync("password3", 10)
  }
}

const PORT = process.env.PORT || 3001; 

//================================== GET METHODS ===========================================//

// homepage
app.get("/", (req, res) => {
  res.json({users, urlDatabase});
});

// use res.render to load up an ejs view file
// urls_index page 
app.get('/urls', function(req, res) {
  if(req.session.user_id){
    let templateVars = {
      username: req.currentUser, 
      urls: urlsForUser(req.session.user_id) 
    };
    console.log(templateVars);
    res.render('urls_index', templateVars);
  } else {
    res.send('You need to <a href="/login">log in</a> to see your shortened URLs.<br> If you do not have an account, you can <a href="/register">Register here.');
  }
});


// adding routes
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Add a GET Route to Show the Form of adding new URL
app.get("/urls/new", (req, res) => {
  let templateVars = { username: "", urls: urlDatabase };
  if(req.session.user_id) {
    templateVars.username = req.currentUser;
    res.render("urls_new", templateVars);
  } else {
    res.send('You need to <a href="/login">LogIn</a> to create new URL.<br> If you do not have an account, you can <a href="/register">Register here.</a>');
  }
});

// Route to get new template of shortURL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { username: req.currentUser, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

//Redirect Short URLs
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = { username: req.currentUser};
  res.render("register", templateVars);
});

// login page
app.get("/login", (req, res) => {
  let templateVars = { username: undefined};
    res.render("login", templateVars);
  });

//================================== POST METHODS ===========================================//

//Add a new URL taken by the previous get method on /urls/new 
app.post("/urls", (req, res) => {
  // call randomString to generate short URL
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {              // the shortURL-longURL key-value pair are saved to the urlDatabase S
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

// Edit URL and redirects to /urls page, if user is logged in.
// Otherwise simply redirects to same login page with a message (if user is not logged in)
app.post("/urls/:id", (req, res) => {
  let userLinks = urlsForUser(req.session.user_id);
  if(userLinks) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
  } else {
    res.send("You are not authorized to edit this. Please <a href='/login'>Login first. <br> If you do not have an account, you can <a href='/register'>Register here.</a>");
  }
});

// Delete the shortURL then redirects to url page(if owner of URL) 
// Otherwise simply redirects to same url page with a message (if user is not owner of URL)
app.post("/urls/:shortURL/delete", (req, res) => {
  let userLinks = urlsForUser(req.session.user_id);
  console.log(userLinks);
  let shortURL = req.params.shortURL;
  if (userLinks[shortURL]) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.send("You are not authorized to delete this.  <a href='/urls'>Back to Previous Page.<br> If you do not have an account, you can <a href='/register'>Register here.</a>");
  }
});
// Register a new user with unique email and assign a unique user_id
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Please enter email and password to proceed.");
    res.redirect("/register");
  }
  if (getUserByEmail(req.body.email)) {
    res.status(400).send("Please enter a unique email.");
    res.redirect("/register");
  }
  let id = generateRandomString();
  users[id] = {
    id: id,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = id;
  res.redirect("/urls");
});

// Login a User, give error if incorrect credentials
app.post("/login", (req, res) => {
  const userId = authenticateUser(req.body.email, req.body.password);
  if(userId) {
    req.session.user_id = userId;
  res.redirect('/urls'); 
  } else {
    res.status(403).send("Incorrect username or password");
  }
});

// Logout a user, clear cookie and redirect to home page 
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/'); 
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


