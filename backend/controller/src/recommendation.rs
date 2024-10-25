use actix_web::{delete, get,post, http::header::AUTHORIZATION, web, HttpRequest, HttpResponse, Responder};
use models::algorithm::RecommendationType;
use services::authentication::COOKIE_NAME;
use services::user_session;
use sqlx::types::chrono::Utc;
use sqlx::PgPool;
use std::sync::RwLock;
use std::collections::HashMap;
use std::sync::Arc;
use log::error;
use models::algorithm::Recommendation;

type SessionStore = Arc<RwLock<HashMap<String, String>>>;

// SAVE LIKES
#[post("/save/like/{id}")]
async fn save_like(path: web::Path<i32>, request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
    let user_id = match user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => id,
        None => match user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions) {
            Some(id) => id,
            None => return HttpResponse::Unauthorized().finish()
        }
    };

    let mut transaction = match db_pool.begin().await {
        Ok(conn) => conn,
        Err(_e) => {
            return HttpResponse::InternalServerError().finish()
        }
    };
   
    let item_id = path.into_inner();
    let now = Utc::now().naive_local();

    let recommendation =  Recommendation {
        id: -1,
        creation_date: now,
        user_id,
        r_type: RecommendationType::Like,
        clothing_id: item_id,
    };

    if let Err(_) = services::recommendations::save_recommendations(&mut transaction, recommendation).await {
        return HttpResponse::InternalServerError().finish();
    }

    match transaction.commit().await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(_e) => HttpResponse::InternalServerError().finish() 
    }
}

// SAVE DISLIKES
#[post("/save/dislike/{id}")]
async fn save_dislike(path: web::Path<i32>, request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
    let user_id = match user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => id,
        None => match user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions) {
            Some(id) => id,
            None => return HttpResponse::Unauthorized().finish()
        }
    };

    let mut transaction = match db_pool.begin().await {
        Ok(conn) => conn,
        Err(_e) => {
            return HttpResponse::InternalServerError().finish()
        }
    };

    let item_id = path.into_inner();
    let now = Utc::now().naive_local();

    let recommendation =  Recommendation {
        id: -1,
        creation_date: now,
        user_id,
        r_type: RecommendationType::Dislike,
        clothing_id: item_id,
    };

    if let Err(_) = services::recommendations::save_recommendations(&mut transaction, recommendation).await {
        return HttpResponse::InternalServerError().finish();
    }

    match transaction.commit().await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(_e) => HttpResponse::InternalServerError().finish() 
    }
              
}

// GET LIKES
#[get("/get_likes/{page}")]
async fn get_favorites(request: HttpRequest, path: web::Path<i64>, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
    let user_id = match user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => id,
        None => match user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions) {
            Some(id) => id,
            None => return HttpResponse::Unauthorized().finish()
        }
    };

    let page = path.into_inner();
    
    let mut transaction = match db_pool.begin().await {
        Ok(conn) => conn,
        Err(e) => {
            error!("failed while trying to obtain transaction: {e}");
            return HttpResponse::InternalServerError().finish()
        }
    };

    let catalogs = match services::recommendations::get_clothing_by_user_and_type(&mut transaction, user_id, RecommendationType::Like, Some(20), Some((page-1)*20)).await {
        Ok(result) => result,
        Err(error) => {
            error!("Error: /get_favorites suffered the following error: {error}");
            return HttpResponse::InternalServerError().json("FailedLike");
        }
    };

    let items = match services::item::get_items_by_all_catalogs(&mut transaction, catalogs).await {
        Ok(result) => result,
        Err(error) => {
            error!("Error: /get_favorites suffered the following error: {error}");
            return HttpResponse::InternalServerError().json("FailedLike");
        }
    };


    match transaction.commit().await {
        Ok(_) => HttpResponse::Ok().json(items),
        Err(_e) => HttpResponse::InternalServerError().finish() 
    }
}


// REMOVE LIKE
#[delete("/remove/like/{item}")]
async fn remove_like(path: web::Path<i32>, request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
    let user_id = match user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => id,
        None => match user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions) {
            Some(id) => id,
            None => return HttpResponse::Unauthorized().finish()
        }
    };
    let item = path.into_inner();
    // remove item from likes list  
    match services::recommendations::delete_recommendations(db_pool.clone(), item, user_id).await {
        Ok(true) => {
            return HttpResponse::Ok()
            .finish();
            },
        Ok(false) => {
            error!("Error: /remove/likes suffered the following error");
            return HttpResponse::InternalServerError().body("FailedLike");                            
        },
        Err(error) => {
            error!("Error: /remove/likes suffered the following error: {error}");
            return HttpResponse::InternalServerError().json("FailedLike");
        }
    }
}


// CHECK IF LIKED ITEM
#[get("/details/isliked/{item}")]
async fn is_liked(path: web::Path<i32>, request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
    let user_id = match user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => id,
        None => match user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions) {
            Some(id) => id,
            None => return HttpResponse::Unauthorized().finish()
        }
    };

    let mut transaction = match db_pool.begin().await {
        Ok(conn) => conn,
        Err(_e) => {
            return HttpResponse::InternalServerError().finish()
        }
    };

    let item_id = path.into_inner();

    let is_liked = services::recommendations::is_like(&mut transaction, user_id, item_id).await.unwrap();

  
    match transaction.commit().await {
        Ok(_) => HttpResponse::Ok().json(is_liked),
        Err(_e) => HttpResponse::InternalServerError().finish() 
    }
              
}