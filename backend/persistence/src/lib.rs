use actix_web::web;
use sqlx::PgPool;
use std::env;

pub mod users;
pub mod recommendation;
pub mod catalog;
pub mod clothing_photos;



pub async fn get_id_from_creds(db_pool: web::Data<PgPool>, email: &str, password: &str) -> Result<i32, sqlx::Error> {
    let user = users::get_user_from_creds(db_pool, email, password).await?;

    Ok(user.id)
}

#[macro_use]
extern crate lazy_static;
lazy_static! {
    pub static ref DATABASE_URL: String = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be defined in the .env file (needed by sqlx).");
    pub static ref DATABASE_URL_TEST: String = env::var("DATABASE_URL_TEST")
        .expect("DATABASE_URL_TEST must be defined in the .env file (needed by sqlx for test).");
}

