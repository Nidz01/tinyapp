//================================== HELPER FUNCTIONS ===========================================//

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
  if (user && bcrypt.compareSync(password, user.password)) {
    return user.id;
  } else {
    return false;
  }
};

const urlsForUser = (id) => {
  const results = {};
  for (let [key, value] of Object.entries(urlDatabase)) {
    if (value["userID"] === id) {
      results[key] = value["longURL"];
    }
  }
  return results;
};


module.exports = {
  generateRandomString,
  getUserByEmail,
  authenticateUser,
  urlsForUser
};