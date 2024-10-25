use super::ServerError;
use actix_web::web;
use models::users::UserInfo;
use sqlx::PgPool;
use log::error;

pub async fn get_user_data_json(db_pool: web::Data<PgPool>, user_id: i32) -> Result<String, ServerError> {
    let user_info = match persistence::users::get_user_by_id(db_pool, user_id).await {
        Ok(info) => info,
        Err(error) => {
            error!("\tCould not get the UserInfo for user id + {user_id}: {error}");
            return Err(ServerError::DatabaseAccess)
        }
    };

    // convertir UserInfo a json
    match serde_json::to_string(&user_info) {
        Ok(json) => Ok(json),
        Err(error) => {
            error!("Error serializing UserInfo to JSON: {:?}", error);
            // SerializationError
            Err(ServerError::BadInput)
        }
    }
}

pub async fn get_user_data(db_pool: web::Data<PgPool>, user_id: i32) -> Result<UserInfo, ServerError> {
    let user_info = match persistence::users::get_user_by_id(db_pool, user_id).await {
        Ok(info) => info,
        Err(error) => {
            error!("\tCould not get the UserInfo for user id + {user_id}: {error}");
            return Err(ServerError::DatabaseAccess)
        }
    };
    Ok(user_info)
}

pub async fn set_preference(user_id: i32, db_pool: web::Data<PgPool>, gender: String) -> Result<UserInfo, ServerError> {
    match persistence::users::set_preference( db_pool, user_id, gender).await {
        Ok(result) => Ok(result),
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    }
}


pub async fn delete_info(user_id: i32, db_pool: web::Data<PgPool>) -> Result<bool, ServerError> {
    match persistence::users::delete_user_data(user_id, db_pool).await {
        Ok(result) => Ok(result),
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    }
}