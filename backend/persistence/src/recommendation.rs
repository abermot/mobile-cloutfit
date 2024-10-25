use actix_web::{web, Result};
use models::algorithm::{Recommendation, RecommendationType};
use sqlx::{PgPool, Transaction, Postgres};

// This module contains functions for managing recommendations in the database
// It includes operations for saving, retrieving, and deleting recommendations
// CRUD Operations

// Saves a new recommendation to the database
pub async fn save_recommendation(transaction: &mut Transaction<'_ , Postgres>, recommendation: Recommendation) -> Result<Recommendation, sqlx::Error> {
    sqlx::query_as!(Recommendation, r#"
        INSERT INTO recommendations
        (id, creation_date, user_id, r_type, clothing_id)
        VALUES (default, $1, $2, $3, $4)
        RETURNING id, creation_date as "creation_date!",
        user_id as "user_id!",
        r_type as "r_type!: RecommendationType",
        clothing_id as "clothing_id!"
        "#, 
        recommendation.creation_date, 
        recommendation.user_id, 
        recommendation.r_type as RecommendationType, 
        recommendation.clothing_id)
    .fetch_one(&mut **transaction)
    .await
}

// Retrieves recommendations for a specific user, filtered by type and optionally paginated.
pub async fn get_recommendations_by_user_id(transaction: &mut Transaction<'static, Postgres>, user_id: i32, r_type: RecommendationType,  page_size: Option<i64>, page_start: Option<i64>) -> Result<Vec<Recommendation>, sqlx::Error> {

    match page_size {
        Some(page_size) => match page_start {
            Some(page_start) => sqlx::query_as!(Recommendation,
                r#"SELECT id, creation_date as "creation_date!",  user_id as "user_id!", r_type as "r_type!: RecommendationType", clothing_id as "clothing_id!"
                FROM recommendations
                WHERE user_id = $1 and r_type = $2
                ORDER BY creation_date DESC
                LIMIT $3
                OFFSET $4"#,
                user_id, r_type as RecommendationType, page_size, page_start
            )
            .fetch_all(&mut **transaction)
            .await,
            None => sqlx::query_as!(Recommendation,
                r#"SELECT id, creation_date as "creation_date!",  user_id as "user_id!", r_type as "r_type!: RecommendationType", clothing_id as "clothing_id!"
                FROM recommendations
                WHERE user_id = $1 and r_type = $2
                ORDER BY creation_date DESC"#,
                user_id, r_type as RecommendationType
            )
            .fetch_all(&mut **transaction)
            .await,
            
        }, 
        None => sqlx::query_as!(Recommendation,
            r#"SELECT id, creation_date as "creation_date!",  user_id as "user_id!", r_type as "r_type!: RecommendationType", clothing_id as "clothing_id!"
            FROM recommendations
            WHERE user_id = $1 and r_type = $2
            ORDER BY creation_date DESC"#,
            user_id, r_type as RecommendationType
        )
        .fetch_all(&mut **transaction)
        .await
    } 
    
}

// Deletes recommendations for a specific clothing item and user.
pub async fn delete_recommendations_by_id(db_pool: web::Data<PgPool>, id: i32, user_id: i32) -> Result<bool, sqlx::Error> {
    let res = sqlx::query_as!(Recommendation,
        r#"
        DELETE FROM recommendations
        WHERE clothing_id = $1 AND user_id = $2
        "#,
        id, user_id
    )      
    .execute(&**db_pool)
    .await?;

    Ok(res.rows_affected() > 0)
}