//================================== HELPER FUNCTIONS ===========================================//

// A function that returns a string of 6 random alphanumeric characters
const generateRandomString = function() {
  return Math.random().toString(36).substr(2,8);
};

const getUserByEmail = function(users, email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

const urlsForUser = (urlDatabase, id) => {
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
  urlsForUser,
};