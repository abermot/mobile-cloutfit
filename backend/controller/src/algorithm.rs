use actix_web::delete;
use actix_web::http::header::AUTHORIZATION;
use actix_web::{get, web, HttpRequest, HttpResponse, Responder};
use models::algorithm::{Recommendation, RecommendationType};
use serde_json::json;
use services::authentication::COOKIE_NAME;
use services::user_session;
use sqlx::types::chrono::Utc;
use sqlx::PgPool;
use std::io::Write;
use std::process::Output;
use std::sync::RwLock;
use std::sync::Arc;
use std::collections::HashMap;
use log::error;
use std::process::{Command, Stdio};

type SessionStore = Arc<RwLock<HashMap<String, String>>>;


// Envía el numero de items indicados por el usuario, del género indicado. Sobre los que se obtendrán las preferencias
#[get("/foryou/{gender}/{items}")]
async fn foryou(path: web::Path<(String, String)>, request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
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

    // filter clothes by gender
    let (gender, items) = path.into_inner();

    // establecer preferencia
    match services::user::set_preference(user_id, db_pool, gender.clone()).await {
        Ok(result) => result,
        Err(_e) => return HttpResponse::InternalServerError().finish()
    };

    // obtenemos las prendas (Items) del género indicado 
    let n_items = items.parse::<i64>().unwrap();
    let foryou_items = match services::catalog::get_new_algorithm_recommendations(&mut transaction, user_id, gender, n_items).await {
        Ok(result) => result,
        Err(error) => {
            error!("Error: cannot obtain recommended list : {error}");
            return HttpResponse::InternalServerError().finish();
        }
        
    };

    match transaction.commit().await {
        Ok(_) => HttpResponse::Ok().json(foryou_items),
        Err(_e) => HttpResponse::InternalServerError().finish() 
    }
}


// GET history recommendations
#[get("/history/recommendations/{page}")]
async fn get_history_recommendations(request: HttpRequest, path: web::Path<i64>, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
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

    let catalogs = match services::recommendations::get_clothing_by_user_and_type(&mut transaction, user_id, RecommendationType::ToShow, Some(20), Some((page-1)*20)).await {
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

    // get all the history recommendations
    match transaction.commit().await {
        Ok(_) => HttpResponse::Ok().json(items),
        Err(_e) => return HttpResponse::InternalServerError().finish() 
    }
}

// DELETE history recommendations
#[delete("/history/recommendations/{id}")]
async fn delete_history_recommendations(path: web::Path<i32>, request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
    let user_id = match user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => id,
        None => match user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions) {
            Some(id) => id,
            None => return HttpResponse::Unauthorized().finish()
        }
    };
    let clothing_id = path.into_inner();

    // get all the history recommendations, we need to get the metadata of the images by the image_path
    match services::recommendations::delete_recommendations(db_pool.clone(), clothing_id, user_id).await {
        Ok(_) => { // there are the recommendations
            HttpResponse::Ok().finish()
        },
        Err(error) => {
            error!("Error: cannot obtain disliked list : {error}");
            return HttpResponse::InternalServerError().finish();
        }
        
    }
}

// If user tagged clothes

#[get("/foryou/hasUserTagged")]
async fn has_user_tagged(request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> impl Responder {
    let user_id = match user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => id,
        None => match user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions) {
            Some(id) => id,
            None => return HttpResponse::Unauthorized().finish()
        }
    };
    
    let mut transaction = match db_pool.begin().await {
        Ok(conn) => conn,
        Err(e) => {
            error!("failed while trying to obtain transaction: {e}");
            return HttpResponse::InternalServerError().finish()
        }
    };

    
    let is_tagged = match services::recommendations::is_not_user_tagged(&mut transaction, user_id).await {
        Ok(result) => result,
        Err(error) => {
            error!("Error: /get_favorites suffered the following error: {error}");
            return HttpResponse::InternalServerError().json("FailedLike");
        }
    };

    match transaction.commit().await {
        Ok(_) => HttpResponse::Ok().json(is_tagged),
        Err(_e) => return HttpResponse::InternalServerError().finish() 
    }
}


// RUN algorithm
#[get("/run_algorithm/{gender}")]
async fn algorithm_with_gender(path: web::Path<String>, request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> HttpResponse {
    let user_id = match user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => id,
        None => match user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions) {
            Some(id) => id,
            None => return HttpResponse::Unauthorized().finish()
        }
    };
    let gender = path.into_inner();
    show_recommendation(gender, user_id, db_pool).await

}
#[get("/run_algorithm")]
async fn algorithm_without_gender(request: HttpRequest, store_sessions: web::Data<SessionStore>, db_pool: web::Data<PgPool>) -> HttpResponse {
    let user_id = match user_session::get_user_session_from_token(request.headers().get(AUTHORIZATION), store_sessions.clone()) {
        Some(id) => id,
        None => match user_session::get_user_session_from_cookie(request.cookie(COOKIE_NAME), store_sessions) {
            Some(id) => id,
            None => return HttpResponse::Unauthorized().finish()
        }
    };
    let gender = match services::user::get_user_data(db_pool.clone(), user_id).await {
        Ok(user) => user.preference, 
        Err(_) => {
            return HttpResponse::InternalServerError().finish()
        }
        
    };

    let gender_string = gender.unwrap_or("woman".to_string());

    show_recommendation(gender_string, user_id, db_pool).await
}

async fn show_recommendation(gender: String, user_id:i32, db_pool: web::Data<PgPool>) -> HttpResponse {

    let mut transaction = match db_pool.begin().await {
        Ok(conn) => conn,
        Err(e) => {
            error!("failed while trying to obtain transaction: {e}");
            return HttpResponse::InternalServerError().finish()
        }
    };

    // get all likes for user 
    let like_recommendations = match services::recommendations::get_clothing_by_user_and_type(&mut transaction, user_id, models::algorithm::RecommendationType::Like, None, None).await {
        Ok(result) => result,
        Err(error) => {
            error!("Error: cannot obtain likes : {error}");
            return HttpResponse::InternalServerError().finish();
        }
        
    };

    // get all dislikes for user 
    let dislike_recommendations = match services::recommendations::get_clothing_by_user_and_type(&mut transaction, user_id, models::algorithm::RecommendationType::Dislike,  None, None).await {
        Ok(result) => result,
        Err(error) => {
            error!("Error: cannot obtain likes : {error}");
            return HttpResponse::InternalServerError().finish();
        }
        
    };

    let clothes_no_iteration_recommendations = match services::catalog::get_clothing_no_iteraction_by_gender(&mut transaction, user_id, gender).await {
        Ok(result) => result,
        Err(error) => {
            error!("Error: cannot obtain likes : {error}");
            return HttpResponse::InternalServerError().finish();
        }
        
    };

    let mut like_embeddings: Vec<Option<String>> = vec![];
    for item in like_recommendations.iter(){
        like_embeddings.push(item.embeddings.clone())
    }
    let mut dislike_embeddings: Vec<Option<String>> = vec![];
    for item in dislike_recommendations.iter(){
        dislike_embeddings.push(item.embeddings.clone())
    }
    let mut clothes_no_iteration: HashMap<i32, Option<String>> = HashMap::new();
    for item in clothes_no_iteration_recommendations.iter(){
        clothes_no_iteration.insert(item.id, item.embeddings.clone());
    }

    // crear el json que se pasará al script
    
    
    let data = json!({
        "likes": like_embeddings,
        "dislikes": dislike_embeddings,
        "rest": clothes_no_iteration,
    });
              
    // ejecutar script
    let output = run_script(data.to_string());
    

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let json_start = stdout.find('[').unwrap_or(0);
        let json_end = stdout.rfind(']').unwrap_or(stdout.len() - 1);
        let json_str = &stdout[json_start..=json_end];
        match serde_json::from_str::<Vec<String>>(&json_str) {
            Ok(image_paths) => {
                let now = Utc::now().naive_local();
                let mut rec_vec:Vec<Recommendation> = Vec::new();
                for item in image_paths {
                    let clothing_id = match item.parse::<i32>() {
                        Ok(id) => id,
                        Err(_) => return HttpResponse::BadRequest().finish(),
                    };
                    let recommendation = Recommendation {
                        id: -1,
                        creation_date:now ,
                        user_id,
                        r_type: RecommendationType::ToShow,
                        clothing_id,
                    };

                    if let Err(_) = services::recommendations::save_recommendations(&mut transaction, recommendation.clone()).await {
                        return HttpResponse::InternalServerError().finish();
                    }
                    rec_vec.push(recommendation)
                }

                let catalogs = match services::catalog::get_all_catalog_by_clothing_id(&mut transaction, rec_vec).await {
                    Ok(result) => result,
                    Err(_error) => return HttpResponse::InternalServerError().finish(),
                    
                };

                let items = match services::item::get_items_by_all_catalogs(&mut transaction, catalogs).await {
                    Ok(result) => result,
                    Err(_error) => return HttpResponse::InternalServerError().finish(),
                };
            
                match transaction.commit().await {
                    Ok(_) => {
                        HttpResponse::Ok().json(items)
                    },
                    Err(_e) => {
                        println!("falla la transaccion");
                        return  HttpResponse::InternalServerError().finish() 
                    }
                }
            }
            Err(e) => {
                error!("Error parsing JSON: {}", e);
                HttpResponse::InternalServerError().finish()
            }
        }
    
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        println!("Python script error: {}", stderr);
        HttpResponse::InternalServerError().body(stderr)
    }
}



fn run_script(data: String) -> Output {
    // llamar al script de python
    let mut child = Command::new("python3")
    .arg("pycode/algorithm.py")
    .stdin(Stdio::piped())
    .stdout(Stdio::piped())
    .spawn()
    .expect("Failed to execute Python script");

    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(data.as_bytes()).expect("Failed to write to stdin");
    } 

    let output = child
        .wait_with_output()
        .expect("Failed to read stdout");

    output
}
