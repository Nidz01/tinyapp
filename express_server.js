//================================== MODULES ===========================================//
const express = require("express");
const app = express();
const bcrypt = require("bcrypt"); // encryption module for passwords
const bodyParser = require("body-parser"); //Converts request body from buffer state to readable string
const cookieSession = require("cookie-session"); //encryption module for cookies
const {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
} = require('./helpers'); //All helper functions are imported from our other js file.

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
};

const PORT = process.env.PORT || 3001;

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
  req.currentUser = users[req.session['userId']];
  next();
});

//================================== GET METHODS ===========================================//

// Homepage
app.get("/", (req, res) => {
  if (req.session.userId)
    res.redirect("/urls");
  else
    res.redirect("/login");
});

// Page to List All Urls Of Logged-In USer.
app.get('/urls', function(req, res) {
  if (req.session.userId) {
    let templateVars = {
      username: req.currentUser,
      urls: urlsForUser(urlDatabase, req.session.userId)
    };
    res.render('urls_index', templateVars);
  } else {
    res.send('You need to <a href="/login">log in</a> to see your shortened URLs.<br> If you do not have an account, you can <a href="/register">Register here.');
  }
});

// Page to Add New URL
app.get("/urls/new", (req, res) => {
  let templateVars = { username: "", urls: urlDatabase };
  if (req.session.userId) {
    templateVars.username = req.currentUser;
    res.render("urls_new", templateVars);
  } else {
    res.send('You need to <a href="/login">LogIn</a> to create new URL.<br> If you do not have an account, you can <a href="/register">Register here.</a>');
  }
});

// Page That Shows URLs Of Logged-In User With URL Edit Option.
app.get("/urls/:id", (req, res) => {
  let templateVars = { username: "", shortURL: "", longURL: "" };
  if (req.session.userId) {
    templateVars.username = req.currentUser;
    if (req.session.userId === (urlDatabase[req.params.id].userID)) {
      templateVars.shortURL = req.params.id;
      templateVars.longURL = urlDatabase[req.params.id].longURL;
      res.render("urls_show", templateVars);
    } else {
      res.redirect("/urls");
    } res.send('You need to <a href="/login">log in</a> to see your shortened URLs.<br> If you do not have an account, you can <a href="/register">Register here.');
  }
});

// When User Clicks On ShortURL, It Redirects To The LongURL Website
app.get("/u/:id", (req, res) => {
  let longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// Page For New User Registration
app.get("/register", (req, res) => {
  let templateVars = { username: undefined, urls: urlDatabase };
  if (req.session.userId) {
    templateVars.username = req.currentUser;
    res.redirect("/urls");
  } else {
  res.render("register", templateVars);
  }
});

// Page to Log In
app.get("/login", (req, res) => {
  let templateVars = { username: undefined, urls: urlDatabase };
  if (req.session.userId) {
    templateVars.username = req.currentUser;
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

//================================== POST METHODS ===========================================//

//Create a New URL
app.post("/urls", (req, res) => {
  if (req.session.userId) {
    let shortURL = generateRandomString(); // call randomString to generate short URL
    urlDatabase[shortURL] = {              // the shortURL-longURL key-value pair are saved to the urlDatabase S
      longURL: req.body.longURL,
      userID: req.session.userId
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.send('You need to <a href="/login">LogIn</a> to create new URL.<br> If you do not have an account, you can <a href="/register">Register here.</a>');
  }
});

// Edit URL and redirects to /urls page, if user is logged in.
// Otherwise simply redirects to same login page with a message (if user is not logged in)
app.post("/urls/:id", (req, res) => {
  let userLinks = urlsForUser(urlDatabase,req.session.userId);
  if (userLinks) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.send("You are not authorized to edit this. Please <a href='/login'>Login first. <br> If you do not have an account, you can <a href='/register'>Register here.</a>");
  }
});

// Delete the shortURL then redirects to url page(if owner of URL)
// Otherwise simply redirects to same url page with a message (if user is not owner of URL)
app.post("/urls/:id/delete", (req, res) => {
  let userLinks = urlsForUser(urlDatabase,req.session.userId);
  let id = req.params.id;
  if (userLinks[id]) {
    delete urlDatabase[id];
    res.redirect('/urls');
  } else {
    res.send("You are not authorized to delete this.  <a href='/urls'>Back to Previous Page.<br> If you do not have an account, you can <a href='/register'>Register here.</a>");
  }
});

// Register a new user with unique email and assign a unique userId
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Please enter email and password to proceed. Please try again.<br><a href='/register'>Register Here.");
  }
  if (getUserByEmail(users, req.body.email)) {
    res.status(400).send("Please enter a unique email. Please try again.<br><a href='/register'>Register Here.");
  }
  let id = generateRandomString();
  users[id] = {
    id: id,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.userId = id;
  res.redirect("/urls");
});

// Login a User, Give Error If Incorrect Credentials
app.post("/login", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Please enter email AND password to proceed.Please try again.<br><a href='/login'>Login Here.");
  }
  const user = getUserByEmail(users, req.body.email);
  // check the email and passord match
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.userId = user.id;
    res.redirect('/urls');
  } else {
    res.status(403).send("Incorrect username or password");
  }
});

// Logout A User, Clear Cookie And Redirect To Home Page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
});

// Connect To Server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
