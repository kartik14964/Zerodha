const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { UserModel } = require("../model/UserModel");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          // Find the user
          const user = await UserModel.findOne({ email });
          if (!user) {
            return done(null, false, {
              message: "That email is not registered",
            });
          }

          // Compare the password
          const isMatch = await bcrypt.compare(password, user.password);
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Password incorrect" });
          }
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  //  puts the user's ID into the session cookie
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // reads the cookie and fetches the user from the database on every request
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
