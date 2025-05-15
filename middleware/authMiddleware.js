// import jwt from 'jsonwebtoken';

// export const authenticateUser = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;  // Store user ID from token in request object
//     next();
//   } catch (error) {
//     return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
//   }
// };

import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    // Decode token without checking expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

    req.user = { userId: decoded.userId, role: decoded.role };  // Attach user data to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
  }
};

