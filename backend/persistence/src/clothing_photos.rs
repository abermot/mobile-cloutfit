use actix_web::Result;
use models::clothing_data::ClothingPhotos;
use sqlx::{Transaction, Postgres};


pub async fn get_by_catalog_id(transaction: &mut Transaction<'static, Postgres>, catalog_id: i32) -> Result<Vec<ClothingPhotos>, sqlx::Error> {
    sqlx::query_as!(ClothingPhotos, r#"
        SELECT id as "id!", catalog_id as "catalog_id!", url as "url!"
        FROM clothing_photos
        WHERE catalog_id = $1"#, catalog_id)
    .fetch_all(&mut **transaction)
    .await
}