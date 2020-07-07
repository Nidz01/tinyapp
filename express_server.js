const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs"); //Setting ejs as the view engine.
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true})); //The body-parser library will convert the request body from a Buffer into string that we can read. It will then add the data to the req(request) object under the key body. 

// A function that returns a string of 6 random alphanumeric characters
const generateRandomString = function() {
  return Math.random().toString(36).substr(2,8);
};


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "6smtxA": "http://www.example.edu"
};

// homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// use res.render to load up an ejs view file
// urls_index page 
app.get('/urls', function(req, res) {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});


// adding routes
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Add a GET Route to Show the Form of adding new URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Route to get new template of shortURL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

//Redirect Short URLs
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  console.log(longURL);
  res.redirect(longURL);
});


// response containing html code
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


//add a new URL taken by the previous get method on /urls/new 
app.post("/urls", (req, res) => {
  // call randomString to generate short URL
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {              // the shortURL-longURL key-value pair are saved to the urlDatabase S
    longURL: req.body.longURL
  };
  res.redirect(`/urls/${shortURL}`);
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

// Delete the shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
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
