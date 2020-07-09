const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
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
  res.send("Hello!");
});

// use res.render to load up an ejs view file
// urls_index page 
app.get('/urls', function(req, res) {
  if(req.cookies.user_id){
    let templateVars = { username: users[req.cookies.user_id], urls: urlsForUser(urlDatabase, req.cookies.user_id) };
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
  if(req.cookies.user_id) {
    templateVars.username = users[req.cookies.user_id]
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// Route to get new template of shortURL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { username: users[req.cookies.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

//Redirect Short URLs
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = { username: users[req.cookies.user_id]};
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
    userID: req.cookies.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

// Delete the shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  let userLinks = urlsForUser(urlDatabase, req.cookies.user_id);
  let shortURL = req.params.shortURL;
  if (userLinks[shortURL]) {
  delete urlDatabase[shortURL];
  res.redirect('/urls');
} else {
  res.send("You are not authorized to delete this.");
}
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
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


