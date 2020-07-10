const { assert } = require('chai');

const {
  getUserByEmail,
  urlsForUser
} = require('../helpers.js');

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
    password: "password1"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "password2"
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "user3@example.com",
    password: "password3"
  }
};

//================================== TESTS ===========================================//

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail(users, "user@example.com");
    const expectedOutput = "userRandomID";
    assert.equal(user.id, expectedOutput);
  });

  it('should return undefined with an invalid email', function() {
    const user = getUserByEmail(users, "usage@example.com");
    const expectedOutput = undefined;
    assert.equal(user.id, expectedOutput);
  });
});

describe('urlsForUser', function() {
  it('should return urls with valid user id', function() {
    const actual = urlsForUser(urlDatabase, "userRandomID");
    const expected = { b2xVn2: "http://www.lighthouselabs.ca" };
    assert.deepEqual(expected, actual);
  });
  
  it('should return empty array with invalid user id', function() {
    const user = urlsForUser(urlDatabase, "userRandomID4");
    assert.isEmpty(user);
  });
});