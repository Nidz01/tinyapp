const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080; // default port 8080
app.set("view engine", "ejs"); //Setting ejs as the view engine.
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true})); //The body-parser library will convert the request body from a Buffer into string that we can read. It will then add the data to the req(request) object under the key body. 

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "6smtxA": "http://www.example.edu"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

// A function that returns a string of 6 random alphanumeric characters
const generateRandomString = function() {
  return Math.random().toString(36).substr(2,8);
};

const getUserByEmail = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

// Check for correct login credential
const authenticateUser = (email, password) => {
  // Does the user with that email exist?
  const user = getUserByEmail(email);

  // check the email and passord match
  if (user && user.password === password) {
    return user.id;
  } else {
    return false;
  }
};


// homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// use res.render to load up an ejs view file
// urls_index page 
app.get('/urls', function(req, res) {
  let templateVars = { username: users[req.cookies.user_id], urls: urlDatabase };
  console.log(templateVars);
  console.log(users);
  res.render('urls_index', templateVars);
});


// adding routes
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Add a GET Route to Show the Form of adding new URL
app.get("/urls/new", (req, res) => {
  let templateVars = { username: users[req.cookies.user_id], urls: urlDatabase };
  res.render("urls_new", templateVars);
});

// Route to get new template of shortURL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { username: users[req.cookies.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

//Redirect Short URLs
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  console.log(longURL);
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = { username: users[req.cookies.user_id]};
  res.render("register", templateVars);
});

// login page
app.get("/login", (req, res) => {
  let templateVars = { username: users[req.cookies.user_id]};
  res.render("login", templateVars);
});

//add a new URL taken by the previous get method on /urls/new 
app.post("/urls", (req, res) => {
  // call randomString to generate short URL
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {              // the shortURL-longURL key-value pair are saved to the urlDatabase S
    longURL: req.body.longURL
  };
  res.redirect(`/urls/${shortURL}`);
});

// Delete the shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});
// Register a new user
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Please enter email AND password to proceed.");
    res.redirect("/register");
  }
  if (getUserByEmail(req.body.email, users)) {
    res.status(400).send("Please enter a unique email.");
    res.redirect("/urls");
  }
  let id = generateRandomString();
  users[id] = {
    id: id,
    email: req.body.email,
    password: req.body.password
  };
  req.cookies["user_id"] = id;
  res.redirect("/urls/");
});

// Login a User
app.post("/login", (req, res) => {
  const userId = authenticateUser(req.body.email, req.body.password);
  if(userId) {
    res.cookie("user_id" , userId);
  res.redirect('/urls'); 
  } else {
    res.status(403).send("Incorrect username or password");
  }
});

// Logout a user and clear cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.cookies["user_id"]);
  res.redirect('/urls'); 
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
