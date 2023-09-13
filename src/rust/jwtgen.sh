###########################################################################
## JWT TOKEN GENERATOR
##
## Requires openssl
###########################################################################

# Create our pem keys if necessary
if [ ! -f ./src/pem/ec-priv.pem ]; then
  # Private and Public keys
  # For RSA (hasbeen)
  #
  # openssl genrsa 2048 > private-key.pem
  # openssl rsa -in ./private-key.pem -pubout -out public-key.pem
  #
  # For Elliptic Curve (average crypto enjoyer)
  # secp256r1 has been recently deprecated (still usable but c'mon)
  #
  # This command generates a basic key
  # openssl ecparam -name prime256v1 -genkey -noout -out private-key.pem
  #
  # What we need is that key but of format PKCS#8, so pipe to format it
  openssl ecparam -genkey -noout -name prime256v1 | openssl pkcs8 -topk8 -nocrypt -out ./src/pem/ec-priv.pem
  openssl ec -in ./src/pem/ec-priv.pem -pubout -out ./src/pem/ec-pub.pem
fi

exec cargo run
