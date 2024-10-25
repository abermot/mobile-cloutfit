use models::users::{UserInfo, UserRegistration};
use actix_web::web;
use argon2::Config;
use sqlx::PgPool;
use chrono::Utc;
use log::error;
use rand::Rng;

pub async fn find_user_by_code(db_pool: web::Data<PgPool>, user_code: i16) -> Result<UserInfo, sqlx::Error> {
    println!("{}",user_code);
    let user = sqlx::query_as!(UserInfo, r#"
                    SELECT id as "id!", username as "username!", password as "password!", email as "email!",  code as "code!",  creation_date as "creation_date!",  is_verified as "is_verified!", preference
                    FROM user_info
                    WHERE code = $1
                        "#, user_code)      
                .fetch_one(&**db_pool)
                .await?;

    Ok(user)
} 



pub async fn set_preference(db_pool: web::Data<PgPool>, id: i32, gender: String) -> Result<UserInfo, sqlx::Error> {

    let user = sqlx::query_as!(UserInfo, r#"
        UPDATE user_info SET
        preference = $1
        WHERE id = $2
        RETURNING id as "id!", username as "username!", password as "password!", email as "email!",  code as "code!",  creation_date as "creation_date!",  is_verified as "is_verified!", preference
        "#, gender, id)
    .fetch_one(&**db_pool)
    .await?;
    Ok(user)
 
}

pub async fn update_verification_email(db_pool: web::Data<PgPool>, user: UserInfo) -> Result<UserInfo, sqlx::Error> {

    let user = sqlx::query_as!(UserInfo, r#"
        UPDATE user_info SET
        is_verified = $1
        WHERE id = $2
        RETURNING id as "id!", username as "username!", password as "password!", email as "email!",  code as "code!",  creation_date as "creation_date!",  is_verified as "is_verified!", preference
        "#, true, user.id)
    .fetch_one(&**db_pool)
    .await?;
    Ok(user)
 
}

pub async fn get_user_by_id(db_pool: web::Data<PgPool>, id: i32) -> Result<UserInfo, sqlx::Error> {
    let user = sqlx::query_as!(UserInfo, r#"
                    SELECT id as "id!", username as "username!", password as "password!", email as "email!",  code as "code!",  creation_date as "creation_date!",  is_verified as "is_verified!", preference
                    FROM user_info
                    WHERE id = $1
                        "#, id)      
                .fetch_one(&**db_pool)
                .await?;
    Ok(user)
}

// MAYBE CHANGE THE NAME
// Gets the user if they are verified (if they have validated their email)
pub async fn get_user_from_creds(db_pool: web::Data<PgPool>, email: &str, password: &str) -> Result<UserInfo, sqlx::Error> {
    // if the user has not verified their email address, they will not be able to login 
    let user = sqlx::query_as!(UserInfo, r#"
                SELECT id as "id!", username as "username!",  email as "email!", password as "password!", code as "code!",  creation_date as "creation_date!",  is_verified as "is_verified!", preference
                FROM user_info
                WHERE email = $1
                    "#, email)
            .fetch_one(&**db_pool)
            .await?;


    if user.is_verified == true { // if the user is verified
        if verify_password(password, &user.password) {
            Ok(user.clone())
        } else {
            error!("\t\tInvalid password for user {email}");
            Err(sqlx::Error::Protocol(format!("IncorrectPassword")))
        }
    } else {
        error!("\t\t The user is not verified {email}");
        Err(sqlx::Error::Protocol(format!("UserNotVerified")))
    }
      
}


pub async fn save_user_data(db_pool: web::Data<PgPool>, user_data: UserRegistration, user_code: i16) -> Result<UserInfo, sqlx::Error> {
    let pass_hash = hash_password(&user_data.password); // Get the password hash
    let now = Utc::now().naive_local();
    let user = sqlx::query_as!(UserInfo, r#"
        INSERT INTO user_info
        (id, username, email, password, code, creation_date, is_verified)
        VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)
        RETURNING id as "id!", username as "username!",  email as "email!", password as "password!",  code as "code!",  creation_date as "creation_date!",  is_verified as "is_verified!", preference
            "#,  user_data.username, user_data.email , pass_hash, user_code, now, false)
    .fetch_one(&**db_pool)
    .await?;

    Ok(user)
}


pub async fn delete_user_data(user_id: i32, db_pool: web::Data<PgPool>) -> Result<bool, sqlx::Error> {
    sqlx::query_as!(Recommendation,
        r#"
        DELETE FROM recommendations
        WHERE user_id = $1
        "#,
        user_id
    )      
    .execute(&**db_pool)
    .await?;

    let res = sqlx::query_as!(UserInfo,
        r#"
        DELETE FROM user_info
        WHERE id = $1
        "#,
        user_id
    )      
    .execute(&**db_pool)
    .await?;

    if res.rows_affected() > 0 {
        return Ok(true)
    }
    
    Ok(false)

}


pub async fn is_email_exist(db_pool: web::Data<PgPool>, user_email: &str) -> Result<bool, sqlx::Error> {

    let rows = sqlx::query!("SELECT email
                            FROM user_info
                            WHERE email = $1
                                ", user_email)
                .fetch_all(&**db_pool)
                .await?;
    if rows.len() > 1 {
        error!("\t\tError: There are multiple combinations of the same email in user_info for user: {}", user_email);
        return Err(sqlx::Error::Protocol(format!("There are multiple combinations of the same email")));
    } else{
        return Ok(false);
    }
 
}

/* ########### Private methods ########### */

fn hash_password(password: &str) -> String {
    let salt: [u8; 32] = rand::thread_rng().gen();
    let config = Config::default();
    match argon2::hash_encoded(password.as_bytes(), &salt, &config) {
        Ok(hash) => hash,
        Err(e) => {
            error!("Error creating the hash: {}", e);
            String::new()  // returns an empty string in case of error
        }
    }
}

fn verify_password(password: &str, hash: &str) -> bool {
    match argon2::verify_encoded(hash, password.as_bytes()) {
        Ok(res) => res,
        Err(e) => {
            error!("Error verifying password: {}", e);
            false
        }
    }
}
