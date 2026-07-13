passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails && profile.emails[0] && profile.emails[0].value;
                if (!email) {
                    return done(null, false, { message: 'No email returned from Google.' });
                }
                const user = await User.findOne({ email: email.toLowerCase() });

                if (!user) {
                    return done(null, false, {
                        message: 'No account found for this Google email. Please use your invite link to register.',
                    });
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);