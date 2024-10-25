use actix_web::{get, web, HttpResponse, Responder};
use sqlx::PgPool;
const PAGE_SIZE: i64 = 30;
const PAGE_SIZE_M: i64 = 5;


#[get("/mobile/list_data/{gender}/{category}/{page}")]
async fn send_info_mobile(path: web::Path<(String, String, i64)>, db_pool: web::Data<PgPool>) -> impl Responder {
    send_info(PAGE_SIZE_M, path, db_pool).await
}

#[get("/list_data/{gender}/{category}/{page}")]
async fn send_info_web(path: web::Path<(String, String, i64)>, db_pool: web::Data<PgPool>) -> impl Responder {
    send_info(PAGE_SIZE, path, db_pool).await
}

async fn send_info(page_size:i64, path: web::Path<(String, String, i64)>, db_pool: web::Data<PgPool>) -> HttpResponse {
    let (mut gender, category, page) = path.into_inner();
    gender = if gender == "mujer" {"woman".to_string()} else {"men".to_string()};


    let mut transaction = match db_pool.begin().await {
        Ok(conn) => conn,
        Err(_e) => {
            return HttpResponse::InternalServerError().finish()
        }
    };

    let catalog_elements = 
        match services::item::get_by_gender_and_category(&mut transaction, gender, category, page_size, (page-1)*page_size).await {
            Ok(els) => els,
            Err(_e) => return HttpResponse::InternalServerError().finish()
    };

    match transaction.commit().await {
        Ok(_) => HttpResponse::Ok().json(catalog_elements),
        Err(_e) => HttpResponse::InternalServerError().finish() 
    }
}
