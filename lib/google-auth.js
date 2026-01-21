const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { query } = require('./db');
const { v4: uuidv4 } = require('uuid');
const { setSession } = require('./sessions-hybrid');

// Configurar estratégia do Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;
    const displayName = profile.displayName;
    const avatarUrl = profile.photos?.[0]?.value;

    if (!email) {
      return done(new Error('Email não disponível na conta Google'));
    }

    // Verificar se usuário já existe pelo Google ID
    let userResult = await query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    let user;

    if (userResult.rows.length > 0) {
      // Usuário existe, atualizar informações
      user = userResult.rows[0];
      await query(
        `UPDATE users 
         SET email = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP
         WHERE google_id = $3`,
        [email, avatarUrl, googleId]
      );
    } else {
      // Verificar se email já está cadastrado
      const emailResult = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (emailResult.rows.length > 0) {
        // Email existe, vincular conta Google
        user = emailResult.rows[0];
        await query(
          `UPDATE users 
           SET google_id = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP
           WHERE email = $3`,
          [googleId, avatarUrl, email]
        );
      } else {
        // Criar novo usuário
        const userId = uuidv4();
        const username = email.split('@')[0]; // Usar parte antes do @ como username
        
        // Garantir username único
        let finalUsername = username;
        let counter = 1;
        while (true) {
          const exists = await query(
            'SELECT user_id FROM users WHERE username = $1',
            [finalUsername]
          );
          if (exists.rows.length === 0) break;
          finalUsername = `${username}${counter}`;
          counter++;
        }

        await query(
          `INSERT INTO users (user_id, username, email, google_id, avatar_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, finalUsername, email, googleId, avatarUrl]
        );

        user = {
          user_id: userId,
          username: finalUsername,
          email: email,
          google_id: googleId,
          avatar_url: avatarUrl,
        };
      }
    }

    return done(null, user);
  } catch (error) {
    console.error('Erro na autenticação Google:', error);
    return done(error, null);
  }
}));

// Serializar usuário para sessão
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

// Desserializar usuário da sessão
passport.deserializeUser(async (userId, done) => {
  try {
    const result = await query(
      'SELECT user_id, username, email, avatar_url, google_id FROM users WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(new Error('Usuário não encontrado'), null);
    }
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

