use actix_web::http::header::AUTHORIZATION;
use actix_web::{delete, get, post,put, web, HttpRequest, HttpResponse, Responder};
use models::users::UserRegistration;
use serde_json::json;
use services::user_session;
use std::sync::{Mutex, RwLock};
use std::collections::HashMap;
use rand_chacha::ChaCha8Rng;
use std::sync::Arc;
use sqlx::PgPool;
use services::authentication::{create_login_cookie, COOKIE_NAME};
use log::error;

type Random = web::Data<Arc<Mutex<ChaCha8Rng>>>;
type SessionStore = Arc<RwLock<HashMap<String, String>>>;


// LOGIN
// obtain user data from token 
#[post("/api/mobile/login")]
async fn login_mobile(db_pool: web::Data<PgPool>, store_sessions: web::Data<SessionStore>, request: HttpRequest) -> impl Responder {
    let user_info = services::authentication::check_login(db_pool.clone(), request).await;  
    match user_info {
        Ok(user_id) => {  
            match services::authentication::create_login_token_mobile(user_id, store_sessions.clone()).await {
                Ok(token) => {
                    HttpResponse::Ok().json(json!({ "token": token }))
                },
                Err(error) => {
                    HttpResponse::BadRequest().json(error)
                }
            }
        },
        Err(error) => {
            HttpResponse::Unauthorized().json(error)
        }
    }
}

// obtain user data from the cookie
#[post("/login")]
async fn login_web(rng: Random, db_pool: web::Data<PgPool>, store_sessions: web::Data<SessionStore>, request: HttpRequest) -> impl Responder {
    let user_info = services::authentication::check_login(db_pool.clone(), request).await; 
    match user_info {
        Ok(user_info) => {
            let cookie = create_login_cookie(rng, user_info, store_sessions.clone()).await;
            HttpResponse::Ok()
            .cookie(cookie.unwrap())
            .finish()
        },
        Err(error) => {
            HttpResponse::Unauthorized().json(error)
        }
    }
}

// LOGOUT

// obtain user data from token 
#[get("/api/mobile/logout")]
async fn logout_mobile(request: HttpRequest, store_sessions: web::Data<SessionStore>) -> impl Responder {
    // get the cookie and logout the user 
    services::user_session::logout_token(request.headers().get(AUTHORIZATION), store_sessions).await;
    HttpResponse::Ok()
    .finish()

}

#[get("/logout")]
async fn logout_web(request: HttpRequest, store_sessions: web::Data<SessionStore>) -> impl Responder {
    // get the cookie and logout the user 
    services::user_session::logout_user(request.cookie(COOKIE_NAME), store_sessions).await;
    HttpResponse::Ok()
    .finish()

}

// DELETE ACCOUNT

#[delete("/user")]
async fn delete_account(request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
    let user_id = match services::user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => {
            // get the token and logout the user 
            services::user_session::logout_token(request.headers().get(AUTHORIZATION), store_sessions).await;
            id
        },
        None => match services::user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions.clone()) {
            Some(id) => {
                services::user_session::logout_user(request.cookie(COOKIE_NAME), store_sessions).await;
                id
            },
            None => return HttpResponse::Unauthorized().finish()
        }
    };
    
    // delete information of the BD
    match services::user::delete_info(user_id, db_pool).await {
        Ok(true) => {
            return HttpResponse::Ok()
            .finish();
            },
        Ok(false) => {
            error!("Error: Delete /user suffered the following error");
            return HttpResponse::InternalServerError().body("Failed to delete account");                            
        },
        Err(error) => {
            error!("Error: Delete /user suffered the following error: {error}");
            return HttpResponse::InternalServerError().json("Failed to delete account");
        }
    }

}

// SIGN UP

#[post("/signup/mobile")]
async fn sign_up_mobile(db_pool: web::Data<PgPool>, request: web::Json<UserRegistration>, store_sessions: web::Data<SessionStore>) -> impl Responder {
    let create_account = services::register::check_create_account(db_pool.clone(), request.into_inner()).await;

    match create_account {
        Ok(user_id) => {
            match services::authentication::create_login_token_mobile(user_id, store_sessions.clone()).await {
                Ok(token) => {
                    HttpResponse::Ok().json(json!({ "token": token }))
                },
                Err(error) => {
                    HttpResponse::BadRequest().json(error)
                }
            }
        },
        Err(error) => {
            HttpResponse::BadRequest().json(error)
        }
    }
}

#[post("/signup")]
async fn sign_up(rng: Random, db_pool: web::Data<PgPool>, request: web::Json<UserRegistration>, store_sessions: web::Data<SessionStore>) -> impl Responder {
    let create_account = services::register::check_create_account(db_pool.clone(), request.into_inner()).await;

    match create_account {
        Ok(user_info) => {
            let cookie = create_login_cookie(rng, user_info, store_sessions.clone()).await;
            HttpResponse::Ok()
            .cookie(cookie.unwrap())
            .finish()
        },
        Err(error) => {
            HttpResponse::BadRequest().json(error)
        }
    }
}


#[put("/validation")]
async fn verification_email(db_pool: web::Data<PgPool>, request: web::Json<String>) -> impl Responder {
    let code = request.clone();

    let code_to_int = code.parse::<i16>().unwrap();

    let user = services::register::validate_code(db_pool, code_to_int).await;


    match user {
        Ok(user_info) => {
            HttpResponse::Ok().json(user_info)
            },
        Err(error) => {
            error!("Email validation failed");
            HttpResponse::BadRequest().json(error)
        }
    }

}


// check if the user is authenticated 
#[get("/protected")]
async fn protected_route(request: HttpRequest, store_sessions: web::Data<SessionStore>) -> impl Responder {
    if let Some(cookie) = request.cookie(COOKIE_NAME) {
        if user_session::is_logged_in(cookie.value(), store_sessions) {
            return HttpResponse::Ok()
                .finish();
        } else {
            return HttpResponse::Unauthorized()
                .finish();
        }
    } else {
        return HttpResponse::Unauthorized().json("Cannot obtain cookie");
    }
}


// obtain user data from the cookie
#[get("/user_data")]
async fn user_data(request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
    let user_id = match user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => id,
        None => match user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions) {
            Some(id) => id,
            None => return HttpResponse::Unauthorized().finish()
        }
    };

    let body = match services::user::get_user_data_json(db_pool, user_id).await {
        Ok(result) => result,
        Err(error) => {
            error!("Error: /user_data suffered the following error: {error}");
            return HttpResponse::InternalServerError().finish();
        }
    };
    return HttpResponse::Ok().json(body);

}
