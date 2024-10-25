use std::{collections::HashMap, env, str, sync::{Arc, Mutex, RwLock}};
type SessionStore = Arc<RwLock<HashMap<String, String>>>;
use base64::{Engine as _, engine::general_purpose};
use actix_web::{cookie::Cookie, web, HttpRequest};
use crate::user_session::save_user_cookie;
use rand_chacha::ChaCha8Rng;
use crate::user_session;
use super::ServerError;
use sqlx::PgPool;
use log::error;
use models::users::Claims;
use jsonwebtoken::{encode, Header, EncodingKey};
use chrono::Utc;

pub const COOKIE_NAME:&str = "sesion";


pub async fn create_login_cookie( random: web::Data<Arc<Mutex<ChaCha8Rng>>>,user_id: i32, store_sessions: web::Data<SessionStore>) -> Result<Cookie<'static>, ServerError>{
    // create session identifier: session identifier must be secure, not just a random token
    let session_id = user_session::create_session_id(random, store_sessions.clone());

    // TODO: define expiration date
    // build cookie
    let cookie = Cookie::build(COOKIE_NAME, session_id.to_string())
    .domain("localhost")
    .path("/")
    .secure(true)
    .same_site(actix_web::cookie::SameSite::None) // Configurar SameSite a None
    .http_only(true)
    .permanent()
    .finish();

    // save cookie in store_sessions (app status variable)
    save_user_cookie(session_id.to_string(), user_id.to_string(), store_sessions).await;

    Ok(cookie)
}

// for mobile sessions
pub async fn create_login_token_mobile(user_id: i32, store_sessions: web::Data<SessionStore>) -> Result<String, ServerError> {
       // define key for sign token
       let secret_key = env::var("SECRET_KEY").expect("SECRET_KEY must be defined in the .env file.");
       // define payload data
       let claims = Claims {
           sub: user_id.to_string(),
           exp: (Utc::now() + chrono::Duration::hours(1)).timestamp() as usize, // expires in 1 hour
       };
   
       // encodes the token
       match  encode(&Header::default(), &claims, &EncodingKey::from_secret(secret_key.as_bytes())) {
           Ok(token) => {
                // save cookie in store_sessions (app status variable)
                save_user_cookie(token.to_string(), user_id.to_string(), store_sessions).await;
                Ok(token)
           },
           Err(err) => {
               error!("Failed to generate token for mobile sessions: {}", err);
               Err(ServerError::GenerateTokenError)
           }
       }

   
}


pub async fn check_login(db_pool: web::Data<PgPool>, request: HttpRequest) -> Result<i32, ServerError> {
    let encoded_credentials = match get_creds_from_header(request) {
        Some(credentials) => credentials,
        None => return Err(ServerError::BadInput)
    };

    let (email, password)= get_username_password(&encoded_credentials)?;

    // check the syntax of the email address
    if !utils::is_email_valid(&email) { 
        error!("Error parsing email addresses");
        return Err(ServerError::InvalidEmailInput);
    }

    match persistence::get_id_from_creds(db_pool, &email, &password).await {
        Ok(result) => Ok(result), // verified user
        Err(_) => {
            return  Err(ServerError::UserNotVerified) 
        }
    }
}

// obtains the user's credentials from the header as specified in the RFC 7617 protocol 
pub fn get_creds_from_header(request: HttpRequest) -> Option<String> { 
    let value = request.headers().get("Authorization")?.to_str();

    let value = match value {
        Ok(result) => result,
        Err(_) => {
            return None
        }
    };
    let mut splitted = value.split(" ");
    if splitted.next()? != "Basic" {
        return None
    }

    Some(splitted.next()?.to_owned())
}

// decode the credentials obtained as specified in the RFC 7617 protocol
fn get_username_password(encoded_credentials: &str) -> Result<(String, String), ServerError> {

    let bytes = match general_purpose::STANDARD.decode(encoded_credentials) {
        Ok(result) => result,
        Err(_) => {
            return Err(ServerError::BadInput)
        }
    };
    let decoded = match str::from_utf8(&bytes) {
        Ok(result) => result,
        Err(_) => {
            return Err(ServerError::BadInput)
        }
    };

    let parts: Vec<&str> = decoded.split(":").collect();

    let email = match parts.get(0) {
        Some(email) => email,
        None => "",
    }.to_string();

    let password = match parts.get(1) {
        Some(password) => password,
        None => "",
    }.to_string();
    Ok((email, password))
}

