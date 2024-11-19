const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    // Get the authorization header
    const authorizationHeader = req.headers["authorization"];
    
    // Check if the authorization header is present
    if (!authorizationHeader) {
      return res.status(401).send({ message: "Authorization header missing", success: false });
    }

    // Extract token from authorization header (Bearer <token>)
    const token = authorizationHeader.split(" ")[1];
    
    // Verify the token
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Token is not valid", success: false });
      } else {
        // Save decoded user info to request object for future use
        req.user = decoded;
        next();
      }
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).send({ message: "Internal server error", success: false });
  }
};
