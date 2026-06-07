const bcrypt = require('bcryptjs');

const passwordToHash = "Achraf.1234"; 

bcrypt.hash(passwordToHash, 10, (err, hash) => {
    if (err) console.error(err);
    console.log("--------------------------------------------");
    console.log("New secure hash:");
    console.log(hash);
    console.log("--------------------------------------------");
});