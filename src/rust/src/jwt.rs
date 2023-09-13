use std::fs::File;
use std::io::Write;

use serde::{Deserialize, Serialize};

use jsonwebtoken::errors::ErrorKind;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};

#[derive(Debug, Serialize, Deserialize)]
#[repr(C)]
struct Claims {
    iss: String,
    sub: String,
    aud: String,
    iat: usize,
    exp: usize,
    azp: String,
    scope: String,
    gty: String
}

// To compile: rustc --crate-type cdylib jwt.rs
// jwt.rs
pub extern "C" fn gen_jwt() -> Result<(), jsonwebtoken::errors::Error> {
    let claims = Claims {
        iss: "wust".to_owned(),
        sub: "Ssg691_8s4g4-s4g8dfzg416d54g".to_owned(),
        aud: "wust-api::jwt::validate".to_owned(),
        iat: 1650458791,
        exp: 32513202429,
        azp: "7ad2fb9f-5eb4-4e72-8a63-47a4e52b1b05".to_owned(),
        scope: "wust::endpoints".to_owned(),
        gty: "api-access".to_owned()
    };
    let priv_key = include_bytes!("./pem/ec-priv.pem");

    let header = Header {
        typ: Some("JWT".to_owned()),
        kid: Some("7Q27d_m2HW6HDG12kLdVn".to_owned()),
        alg: Algorithm::ES256,
        ..Default::default()
    };

    let token = match encode(&header, &claims, &EncodingKey::from_ec_pem(priv_key).unwrap()) {
        Ok(t) => t,
        Err(e) => return Err(e)
    };

    // Put our newly created token into a file
    let mut jwt_file = File::create("jwt.txt").unwrap();
    jwt_file.write_all(token.as_bytes()).unwrap();

    let pub_key = include_bytes!("./pem/ec-pub.pem");
    let token_data = match decode::<Claims>(
        &token,
        &DecodingKey::from_ec_pem(pub_key).unwrap(),
        &Validation::new(Algorithm::ES256)
    ) {
        Ok(c) => c,
        Err(err) => match *err.kind() {
            ErrorKind::InvalidToken => return Err(err),
            ErrorKind::InvalidSignature => return Err(err),
            _ => panic!("Should be an error but none found")
        }
    };

    println!("{:?}", token_data.claims);
    println!("{:?}", token_data.header);

    Ok(())
}
