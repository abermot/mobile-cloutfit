use super::ServerError;
use models::{algorithm::Recommendation, clothing_data::{Catalog, Item}};
use sqlx::{Transaction, Postgres};
use log::error;
use crate::item;
// GET NEW CATALOG ITEMS FOR CREATE NEW RECOMMENDATIONS 
pub async fn get_new_algorithm_recommendations(mut transaction: &mut Transaction<'static, Postgres>, user_id: i32, gender: String, n_items: i64) -> Result<Vec<Item>, ServerError> {

    let catalog_elements = match persistence::catalog::get_new_recommendations(&mut transaction, user_id, gender, n_items).await {
        Ok(result) => result,
        Err(error) => {
            error!("{}", error);
            return Err(ServerError::DatabaseAccess) 
        }
    };
  
    match item::get_items_by_all_catalogs(&mut transaction, catalog_elements).await {
        Ok(items) => return Ok(items),
        Err(_e) => return Err(ServerError::DatabaseAccess)
    }
}


// GET one clothing by clothing id
pub async fn get_catalog_by_clothing_id(mut transaction: &mut Transaction<'static, Postgres>, recommendation: Recommendation) -> Result<Catalog, ServerError> {
    
    match persistence::catalog::get_catalog_by_clothing_id(&mut transaction, recommendation).await {
        Ok(result) => Ok(result),
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    }
}

pub async fn get_all_catalog_by_clothing_id(mut transaction: &mut Transaction<'static, Postgres>, recommendations: Vec<Recommendation>) -> Result<Vec<Catalog>, ServerError> {
    let mut catalog_list:Vec<Catalog> = Vec::new();
    for element in recommendations{
        let catalog = match persistence::catalog::get_catalog_by_clothing_id(&mut transaction, element).await {
            Ok(result) => result,
            Err(_error) => return  Err(ServerError::DatabaseAccess)
        };
        catalog_list.push(catalog)
    }
    Ok(catalog_list)  
}




pub async fn get_clothing_no_iteraction_by_gender(mut transaction: &mut Transaction<'static, Postgres>, user_id: i32, gender: String) -> Result<Vec<Catalog>, ServerError> {
    match persistence::catalog::get_clothing_no_iteraction(&mut transaction, user_id, gender).await {
        Ok(result) => Ok(result),
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    }
}

pub async fn get_categories(mut transaction: &mut Transaction<'static, Postgres>) -> Result<Vec<String>, ServerError> {
    match persistence::catalog::get_categories(&mut transaction).await {
        Ok(result) => Ok(result),
        Err(error) => {
            error!("{}", error);
            return  Err(ServerError::DatabaseAccess) 
        }
    }
}