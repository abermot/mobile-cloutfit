use std::fmt::{self,Display};
use serde::Serialize;

pub mod authentication;
//pub mod clothing_data;
pub mod user_session;
pub mod catalog;
pub mod recommendations;
pub mod register;
pub mod item;
pub mod user;

/// Authorization Header Error
#[derive(Debug, Serialize)]
pub enum ServerError {
    Unauthorized,
    BadInput,
    DatabaseAccess,
    InvalidInput,
    InvalidEmailInput,
    InvalidPasswordInput,
    EmailSendFailed,
    EmailAlreadyExistsDB,
    IncorrectPassword,
    IncorrectEmail,
    FindUserFailed,
    UpdateUserFailed,
    UserNotVerified,
    GenerateTokenError,
}
impl Display for ServerError { // To be able to log the error
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let msg = format!( "ServerError::{}",
            match self {
                ServerError::BadInput => String::from("BadInput"),
                ServerError::Unauthorized => String::from("Unauthorized"),
                ServerError::DatabaseAccess => String::from("DatabaseAccess"),
                ServerError::InvalidInput => String::from("InvalidInput"),
                ServerError::InvalidEmailInput => String::from("InvalidEmailInput"),
                ServerError::InvalidPasswordInput => String::from("InvalidPasswordInput"),
                ServerError::EmailSendFailed => String::from("EmailSendFailed"),
                ServerError::EmailAlreadyExistsDB => String::from("EmailAlreadyExistsDB"),
                ServerError::IncorrectPassword => String::from("IncorrectPassword"),
                ServerError::IncorrectEmail => String::from("IncorrectEmail"),
                ServerError::FindUserFailed => String::from("FindUserFailed"),
                ServerError::UpdateUserFailed => String::from("UpdateUserFailed"),
                ServerError::UserNotVerified => String::from("UserNotVerified"), // usuario no verificado 
                ServerError::GenerateTokenError => String::from("GenerateTokenError"), // usuario no verificado 

            }
        );
        write!(f, "{}", msg)
    }
}

