use chrono::NaiveDateTime;
use serde::Deserialize;
use serde::Serialize;


#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct UserInfo {
    pub id: i32,
    pub username: String,
    pub password: String,
    pub email: String,
    pub code: i16,
    pub creation_date: NaiveDateTime,
    pub is_verified: bool,
    pub preference: Option<String>
}

#[derive(Deserialize, Clone)]
pub struct UserRegistration {
    pub username: String,
    pub email: String,
    pub password: String,
}

// define token
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // subject, typically user id or email
    pub exp: usize,  // expiration time as a Unix timestamp
}
