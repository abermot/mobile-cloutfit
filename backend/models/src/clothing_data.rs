use serde::Deserialize;
use serde::Serialize;


#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Item {
    // [Catalog]
    pub id: i32,
    pub name: String,
    pub price: String,
    pub description: Option<String>,
    pub category: String,
    pub gender: String,
    pub page_link: String,
    pub colour: String,
    pub embeddings: Option<String>,
    // [ClothingPhotos]
    pub photos_urls: Vec<String>,
}


#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Catalog {
    pub id: i32,
    pub name: String,
    pub price: String,
    pub description: Option<String>,
    pub category: String,
    pub gender: String,
    pub page_link: String,
    pub colour: String,
    pub embeddings: Option<String>,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct ClothingPhotos {
    pub id: i32,
    pub catalog_id: i32, // references [Catalog]
    pub url: String,
}
