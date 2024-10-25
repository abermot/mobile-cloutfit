use std::{collections::HashMap, sync::{Arc, Mutex, RwLock}};
use actix_web::{cookie::Cookie, web};
use rand_chacha::ChaCha8Rng;
use rand::RngCore;
use log::error;
type SessionStore = Arc<RwLock<HashMap<String, String>>>;

pub fn get_user_session_from_cookie(cookie: Option<Cookie<'static>>, store_sessions: web::Data<SessionStore>) -> Option<i32> {
    if let Some(cookie) = cookie {
        let map = store_sessions.read().expect("Some thread died while holding the mutex");
        if let Some(session) = map.get(cookie.value()) {
            Some(session.parse::<i32>().expect("Error during parse")) 
        } else {
            None
        }
    } else {
        None
    }
  
}


pub fn get_user_session_from_token(auth_header: Option<&actix_web::http::header::HeaderValue>, store_sessions: web::Data<SessionStore>) -> Option<i32> {
    if let Some(auth_header) = auth_header {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..]; // delete bearer
                let map = store_sessions.read().expect("Some thread died while holding the mutex");
                if let Some(session) = map.get(token) {
                    Some(session.parse::<i32>().expect("Error during parse")) 
                } else {
                    None
                }
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    }
}

pub async fn save_user_cookie(cookie: String, user_id: String, store_sessions: web::Data<SessionStore>) {
    let mut map = store_sessions.write().expect("Some thread died while holding the mutex");
    map.insert(cookie, user_id);
}

// comprueba si el usuario esta loggeado
pub fn is_logged_in(cookie: &str, store_sessions: web::Data<SessionStore>) -> bool {
    let map = store_sessions.read().expect("Some thread died while holding the mutex");

    match map.get(cookie) {
        Some(_) => true,
        None => false
    }
                
}

pub async fn logout_user(cookie: Option<Cookie<'static>>, store_sessions: web::Data<SessionStore>) {

    if let Some(cookie) = cookie {
        let cookie_value = cookie.value();
        let mut map = store_sessions.write().expect("Some thread died while holding the mutex");

        match map.get(cookie_value) {
            Some(_) => (), //the user is logged in
            None => return //not logged in
        };
        map.remove(cookie_value);
    } else {
        error!("Failure to obtain cookie value ");
    }
}

pub async fn logout_token(auth_header: Option<&actix_web::http::header::HeaderValue>, store_sessions: web::Data<SessionStore>) {
    if let Some(auth_header) = auth_header {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..]; // delete bearer
                let mut map = store_sessions.write().expect("Some thread died while holding the mutex");
                match map.get(token) {
                    Some(_) => (), //the user is logged in
                    None => return //not logged in
                };
                map.remove(token);
            } else {
                error!("No Bearer found in logout_token");
            }
        } else {
            error!("Failure to pasrse token to string in logout_token");
        }
    } else {
        error!("Failure to obtain auth_header value ");
    }
}

pub fn create_session_id(random: web::Data<Arc<Mutex<ChaCha8Rng>>>, store_sessions: web::Data<SessionStore>) -> u128 {
    let mut rng = random.lock().unwrap();

    let session_id = loop {
        let mut u128_pool = [0u8; 16];
        rng.fill_bytes(&mut u128_pool);
        let session_token = u128::from_le_bytes(u128_pool);
        // check if the generated token is unique 
        let  mut sessions = store_sessions.write().unwrap();
        if !sessions.contains_key(&session_token.to_string()) {
            sessions.insert(session_token.to_string(), String::new());
            break session_token;
        } else {
            error!("The session token already exists");
        }
    };
    session_id
}
