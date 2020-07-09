const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
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
const PORT = process.env.PORT || 3001; 
app.set("view engine", "ejs"); //Setting ejs as the view engine.
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true})); //The body-parser library will convert the request body from a Buffer into string that we can read. It will then add the data to the req(request) object under the key body. 

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
  if (user && bcrypt.compareSync(user.password === password)) {
    return user.id;
  } else {
    return false;
  }
};

const urlsForUser = (data, id) => {
  const results = {};
  for (let [key, value] of Object.entries(data)) {
    if (value["userID"] === id) {
      results[key] = value["longURL"];
    }
  }
  return results;
};

// homepage
app.get("/", (req, res) => {
  res.json(users);
});

// use res.render to load up an ejs view file
// urls_index page 
app.get('/urls', function(req, res) {
  if(req.session.user_id){
    let templateVars = { username: req.currentUser, urls: urlsForUser(urlDatabase, req.session.user_id) };
    res.render('urls_index', templateVars);
  } else {
    res.send('You need to <a href="/login">log in</a> to see your shortened URLs.');
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
    res.redirect("/login");
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

//add a new URL taken by the previous get method on /urls/new 
app.post("/urls", (req, res) => {
  // call randomString to generate short URL
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {              // the shortURL-longURL key-value pair are saved to the urlDatabase S
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

// Edit URL and redirects to /urls page, if logged in user owns the URL.
// Otherwise simply redirects to same url page with a message (if user is not owner of URL)
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Delete the shortURL then redirects to url page(if owner of URL) 
// Otherwise simply redirects to same url page with a message (if user is not owner of URL)
app.post("/urls/:shortURL/delete", (req, res) => {
  let userLinks = urlsForUser(urlDatabase, req.session.user_id);
  let shortURL = req.params.shortURL;
  if (userLinks[shortURL]) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.send("You are not authorized to delete this.  <a href='/urls'>Back to Previous Page</a>");
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


