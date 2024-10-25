use std::{collections::HashMap, env, sync::{Arc, Mutex, RwLock}};
use rand_core::{OsRng, RngCore, SeedableRng};
use actix_web::{http, App, HttpServer, web};
use persistence::DATABASE_URL;
use rand_chacha::ChaCha8Rng;
use actix_cors::Cors;
use dotenv::dotenv;
use sqlx::PgPool;
use log::info;


type SessionStore = Arc<RwLock<HashMap<String, String>>>;


#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // init env
    dotenv().ok();
    log4rs::init_file("config/log4rs.yaml", Default::default()).unwrap();
    info!("booting up");
    
    // init app state variables
    let server_url = env::var("SERVER_URL").expect("SERVER URL is not in .env file");
    env::var("SECRET_KEY").expect("SECRET_KEY must be defined in the .env file.");
    let store_sessions: SessionStore = Arc::new(RwLock::new(HashMap::new()));
    let pool = PgPool::connect(&DATABASE_URL).await.unwrap();
    let random: ChaCha8Rng = ChaCha8Rng::seed_from_u64(OsRng.next_u64());

    HttpServer::new(move || {
        // Es necesario para web
        let cors = Cors::default()
        .allowed_origin("http://localhost:8081")
        .allowed_methods(vec!["GET", "POST", "DELETE", "PUT"])
        .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
        .allowed_header(http::header::CONTENT_TYPE)
        .supports_credentials()
        .max_age(3600);
        App::new()
            .wrap(cors)
            .app_data(web::Data::new(pool.clone())) // pool is in the state of the app
            .app_data(web::Data::new(Arc::new(Mutex::new(random.clone())))) // randomSeed is in the state of the app
            .app_data(web::Data::new(store_sessions.clone())) //no se necesita mutex, ya lo maneja rlock
            .service(controller::user::sign_up)
            .service(controller::user::sign_up_mobile)
            .service(controller::user::verification_email)
            .service(controller::user::delete_account)
            .service(controller::get_data::send_info_mobile)
            .service(controller::get_data::send_info_web)
            .service(controller::user::login_web)
            .service(controller::user::logout_web)
            .service(controller::user::user_data)
            .service(controller::algorithm::foryou)
            .service(controller::algorithm::algorithm_without_gender)
            .service(controller::algorithm::algorithm_with_gender)
            .service(controller::algorithm::get_history_recommendations)
            .service(controller::algorithm::delete_history_recommendations)
            .service(controller::recommendation::save_like)
            .service(controller::recommendation::save_dislike)
            .service(controller::recommendation::get_favorites)
            .service(controller::recommendation::remove_like)
            .service(controller::recommendation::is_liked)
            .service(controller::algorithm::has_user_tagged)
            .service(controller::user::login_mobile)
            .service(controller::user::logout_mobile)

            
    })
    .bind(server_url)?
    .run()
    .await
}