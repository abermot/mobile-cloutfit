use chrono::NaiveDateTime;
use serde::Deserialize;
use serde::Serialize;
use sqlx;

#[derive(Serialize, Deserialize, Debug, sqlx::Type, Clone, PartialEq)]
#[sqlx(type_name = "recommendation_type", rename_all = "snake_case")] 
pub enum RecommendationType {
    Like,
    Dislike,
    ToShow
}


#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Recommendation {
    pub id: i32, 
    pub creation_date: NaiveDateTime,
    pub user_id: i32,
    pub r_type: RecommendationType,
    pub clothing_id: i32,
}
