use super::ServerError;
use actix_web::web;
use models::{algorithm::{Recommendation, RecommendationType}, clothing_data::Catalog};
use sqlx::{PgPool, Transaction, Postgres};
use log::error;

// SAVE RECOMMENDATION
pub async fn save_recommendations(mut transaction: &mut Transaction<'static, Postgres>, recommendations: Recommendation) -> Result<Recommendation, ServerError> {

    match persistence::recommendation::save_recommendation(&mut transaction, recommendations).await {
        Ok(result) => Ok(result),
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    }
}

// DELETE RECOMMENDATION
pub async fn delete_recommendations(db_pool: web::Data<PgPool>, id: i32, user_id: i32) -> Result<bool, ServerError> {

    match persistence::recommendation::delete_recommendations_by_id(db_pool, id, user_id).await {
        Ok(result) => Ok(result),
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    }
}

pub async fn get_clothing_by_user_and_type(mut transaction: &mut Transaction<'static, Postgres>, user_id: i32, recommendation_type: RecommendationType,  page_size: Option<i64>, page_start: Option<i64>) -> Result<Vec<Catalog>, ServerError> {

    match persistence::recommendation::get_recommendations_by_user_id(&mut transaction, user_id, recommendation_type, page_size, page_start).await {
        Ok(result) => {
            let mut list: Vec<Catalog> = vec![];
            for item in result {
                match persistence::catalog::get_catalog_by_clothing_id(&mut transaction, item).await {
                    Ok(garment) => list.append(&mut vec![garment]),
                    Err(_) => todo!(),
                }
            };
            return Ok(list);
        },
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    }

    
}


pub async fn is_like(mut transaction: &mut Transaction<'static, Postgres>, user_id: i32, item: i32) -> Result<bool, ServerError> {

    match persistence::recommendation::get_recommendations_by_user_id(&mut transaction, user_id, RecommendationType::Like, None, None).await {
        Ok(result) => {
            let is_liked = result.iter().any(|recommendation| recommendation.clothing_id == item);
            return Ok(is_liked);
        },
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    }
}


pub async fn is_not_user_tagged(mut transaction: &mut Transaction<'static, Postgres>, user_id: i32) -> Result<bool, ServerError> {

    let is_likes = match persistence::recommendation::get_recommendations_by_user_id(&mut transaction, user_id, RecommendationType::Like, None, None).await {
        Ok(result) => result,
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    };

    let is_dislikes = match persistence::recommendation::get_recommendations_by_user_id(&mut transaction, user_id, RecommendationType::Dislike, None, None).await {
        Ok(result) => result,
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    };
    Ok(is_likes.is_empty() && is_dislikes.is_empty())

}