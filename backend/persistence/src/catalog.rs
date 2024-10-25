use actix_web::Result;
use models::{clothing_data::Catalog, algorithm::Recommendation};
use sqlx::{Transaction, Postgres};


// GET one clothing by clothing id
pub async fn get_catalog_by_clothing_id(transaction: &mut Transaction<'static, Postgres>, recommendation: Recommendation) -> Result<Catalog, sqlx::Error> {
    sqlx::query_as!(Catalog, r#"
        SELECT c.id as "id!", c.name as "name!", c.price as "price!",c.description as "description", c.category as "category!", c.gender as "gender!", c.page_link as "page_link!", c.colour as "colour!", c.embeddings as "embeddings"
        FROM catalog c
        WHERE c.id = $1"#, recommendation.clothing_id)
    .fetch_one(&mut **transaction)
    .await
}

// GET x n_items images of y gender for new recommendations
pub async fn get_new_recommendations(transaction: &mut Transaction<'static, Postgres>, user_id: i32, gender: String, n_items: i64) -> Result<Vec<Catalog>, sqlx::Error> {
    sqlx::query_as!(Catalog, r#"
        SELECT c.id as "id!", c.name as "name!", c.price as "price!",c.description as "description", c.category as "category!", c.gender as "gender!", c.page_link as "page_link!", c.colour as "colour!", c.embeddings as "embeddings"
        FROM catalog c left JOIN recommendations r 
        ON c.id = r.clothing_id AND r.user_id = $1
        WHERE r.user_id IS NULL AND c.gender LIKE $2
        ORDER BY RANDOM()
        LIMIT $3"#, user_id, gender, n_items
    )
    .fetch_all(&mut **transaction)    
    .await
}

pub async fn get_clothing_no_iteraction(transaction: &mut Transaction<'static, Postgres>, user_id: i32, gender: String) -> Result<Vec<Catalog>, sqlx::Error> {
    sqlx::query_as!(Catalog, r#"
        SELECT c.id as "id!", c.name as "name!", c.price as "price!",c.description as "description", c.category as "category!", c.gender as "gender!", c.page_link as "page_link!", c.colour as "colour!", c.embeddings as "embeddings"
        FROM catalog c left JOIN recommendations r 
        ON c.id = r.clothing_id AND r.user_id = $1
        WHERE r.user_id IS NULL AND c.gender LIKE $2
        ORDER BY RANDOM()"#, user_id, gender
    )
    .fetch_all(&mut **transaction)    
    .await
}

pub async fn get_categories(transaction: &mut Transaction<'static, Postgres>) -> Result<Vec<String>, sqlx::Error> {
    let categories = sqlx::query!(
        "SELECT DISTINCT category FROM catalog"
    )
    .fetch_all(transaction)
    .await?;
    
    let category_list: Vec<String> = categories
        .into_iter()
        .filter_map(|record| record.category)
        .collect();

    Ok(category_list)
}


pub async fn get_by_gender_and_category(
    transaction: &mut Transaction<'static, Postgres>,
    start: i64,
    size: i64,
    gender: String,
    category: Option<String>)
 -> Result<Vec<Catalog>, sqlx::Error> {
    match category {
        Some(category) => sqlx::query_as!(Catalog, r#"
            SELECT c.id as "id!", c.name as "name!", c.price as "price!",c.description as "description", c.category as "category!", c.gender as "gender!", c.page_link as "page_link!", c.colour as "colour!", c.embeddings as "embeddings"
            FROM catalog c
            WHERE gender = $1 AND category like $2
            LIMIT $3
            OFFSET $4"#, gender, format!("%{}%", category), size, start
        )
        .fetch_all(&mut **transaction)    
        .await,
        None =>  sqlx::query_as!(Catalog, r#"
            SELECT c.id as "id!", c.name as "name!", c.price as "price!",c.description as "description", c.category as "category!", c.gender as "gender!", c.page_link as "page_link!", c.colour as "colour!", c.embeddings as "embeddings"
            FROM catalog c
            WHERE gender = $1
            LIMIT $2
            OFFSET $3"#, gender, size, start
        )
        .fetch_all(&mut **transaction)    
        .await
    }
}