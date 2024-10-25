use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use regex::Regex;


pub fn generate_token(characters: usize) -> String {
    let token: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(characters)
        .map(char::from)
        .collect();
    token
}

pub fn is_email_valid(user_email: &str) -> bool { 
    let re = Regex::new(r"^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$").unwrap();
    return re.is_match(user_email)    
}

