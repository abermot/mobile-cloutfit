use super::ServerError;
use models::clothing_data::{Catalog, Item};
use sqlx::{Transaction, Postgres};

pub async fn get_by_gender_and_category(mut transaction: &mut Transaction<'static, Postgres>, gender: String, category: String, page_size: i64, page_start: i64) -> Result<Vec<Item>, ServerError> {
    let category = if category == "all" { None } else { Some(category) };

    let catalog_elements = match persistence::catalog::get_by_gender_and_category(
        &mut transaction, page_start, page_size, gender, category).await 
    {
        Ok(elements) => elements,
        Err(_e) => return Err(ServerError::DatabaseAccess)
    };

    match get_items_by_all_catalogs(&mut transaction, catalog_elements).await {
        Ok(items) => return Ok(items),
        Err(_e) => return Err(ServerError::DatabaseAccess)
    }
}


pub async fn get_items_by_all_catalogs(mut transaction: &mut Transaction<'static, Postgres>, catalogs: Vec<Catalog>) -> Result<Vec<Item>, ServerError> {
    let mut items: Vec<Item> = Vec::new();

    for element in catalogs {
        let photos = match persistence::clothing_photos::get_by_catalog_id(&mut transaction, element.id).await {
            Ok(photos) => photos,
            Err(_e) => return Err(ServerError::DatabaseAccess)
        };
        let urls: Vec<String> = photos.into_iter().map(|x| x.url).collect();

        items.push(Item {
            id: element.id,
            name: element.name,
            price: element.price,
            description: element.description,
            category: element.category,
            gender: element.gender,
            page_link: element.page_link,
            colour: element.colour,
            embeddings: element.embeddings,
            photos_urls: urls,
        })
    }
    
    Ok(items)
}