use lettre::message::{header::ContentType, header::ContentId, Message, MultiPart, SinglePart, Mailbox};
use lettre::transport::smtp::authentication::Credentials;
use models::users::{UserInfo, UserRegistration};
use lettre::{SmtpTransport, Transport};
use log::{error, info};
use super::ServerError;
use actix_web::web;
use sqlx::PgPool;
use rand::Rng;
use std::fs;

// Mailtrap Credentials 
// This domain is temporary, change it when you launch the app to clout.fit
const MAILTRAP_USER: &str = "api";
const MAILTRAP_PASSWORD: &str = "d4ddc3ddddbcebe0b1464e5d85cf6830";
const MAILTRAP_SERVER: &str = "live.smtp.mailtrap.io";


pub async fn check_create_account(db_pool: web::Data<PgPool>, user: UserRegistration) -> Result<i32, ServerError> {
    // check if the email is in use 
    match persistence::users::is_email_exist(db_pool.clone(), &user.email).await {
        Ok(_) => { // this email doesn't exist in the database 
            info!("Email is not in use ");
        },
        Err(err) => {
            error!("Error: email already registered in the database  {}", err);
            return Err(ServerError::EmailAlreadyExistsDB) 
        }
    };
    
    // check the syntax of the email address
    if !utils::is_email_valid(&user.email) { 
        error!("Error parsing email addresses");
        return Err(ServerError::InvalidEmailInput);
    }

    // generate code for verification
    let rand_code = rand::thread_rng().gen_range(0000..=9999);
    println!("code : {}", rand_code);
   
    match send_email(&user.email, &user.username, rand_code.clone()) {
       Ok(_) => {
            match persistence::users::save_user_data(db_pool, user.clone(), rand_code).await {
                Ok(user) => Ok(user.id), 
                Err(err) => {
                    error!("Error database {}", err);
                    Err(ServerError::DatabaseAccess) 
                }
            }
        }
        Err(err) => {
            error!("Error sending mail {}", err);
             Err(ServerError::EmailSendFailed) 
        }
    }

}
    



pub async fn validate_code(db_pool: web::Data<PgPool>, user_code: i16) -> Result<UserInfo, ServerError> {

    let user = persistence::users::find_user_by_code(db_pool.clone(), user_code).await;
    println!("user: {:?}", user);
    match user {
        Ok(user_result) => {
            // is_verified must be true 
            match persistence::users::update_verification_email(db_pool, user_result).await {
                Ok(user_info) => { 
                    println!("user info : {:?}", user_info);

                    Ok(user_info)
                },
                Err(error) => {
                    println!("error: {:?}", error);

                    error!("Error updating user {}", error);
                    Err(ServerError::UpdateUserFailed) 
                }
            }
        },
        Err(error) => {
            println!("errororororor: {:?}", error);

            error!("Error finding user by code {}", error);
            Err(ServerError::FindUserFailed) 
        }
    }
}



/* ########### Private methods ########### */


fn send_email(user_email: &str, user_name: &str, user_code: i16) -> Result<bool, ServerError> {

    // read files
    let html_body = fs::read_to_string("static/html/mail_verification_page.html").map_err(|_| ServerError::EmailSendFailed)?;
    let image_body = fs::read("../frontend/assets/cloutfitlogo.png").map_err(|_| ServerError::EmailSendFailed)?;
    let contet_type_image = ContentType::parse("image/png").map_err(|_| ServerError::EmailSendFailed)?;
    
    // give the value of the user name to html
    let html_body_named = html_body.replace("{username}", user_name); 
    let html_body_code = html_body_named.replace("{usercode}", &user_code.to_string());

    let email = match user_email.parse() {
        Ok(ok_user_email) => {
            let from_address = Mailbox::new(
                Some("Cloutfit".to_string()),
                "noreply-cloutfit@demomailtrap.com".parse().unwrap() // change domain !
            );
            let email = Message::builder()
            .from(from_address) 
            .to(ok_user_email)
            .subject("Bienvenido a CloutFit")
            .multipart(
                MultiPart::related()
                    .singlepart(SinglePart::html(html_body_code.clone())) 
                    .singlepart(
                        SinglePart::builder()
                            .header(contet_type_image)
                            .header(ContentId::from("<image1>".to_string()))
                            .body(image_body)
                    )
            )
            .unwrap();
            Ok(Some(email))
        },
        Err(err) => {
            error!("Error parsing email addresses: {}", err);
            Err(ServerError::InvalidInput) 
        },
    };

    let creds = Credentials::new(MAILTRAP_USER.to_string(), MAILTRAP_PASSWORD.to_string()); 

    // Open a secure connection to the SMTP server using STARTTLS
    let mailer = SmtpTransport::starttls_relay(MAILTRAP_SERVER)
    .unwrap() 
    .credentials(creds)
    .build();

    if let Ok(Some(email)) = email {
        match mailer.send(&email) {
            Ok(_) => Ok(true),
            Err(err) => {
                error!("Error sending mail {}", err);
                Err(ServerError::EmailSendFailed) 
            }
        }
    } else {
        error!("Error sending mail {:?}", mailer);
        Err(ServerError::EmailSendFailed) 
    }
}




