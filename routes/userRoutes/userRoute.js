import express from 'express'
import {loginUser,registerUser,passwordReset,getLoggedUserDetails,getAllUsers,updateUserById,deleteUserById} from '../../controller/user/userController.js'
import { authenticateUser } from '../../middleware/authMiddleware.js';
const userRouter = express.Router();
 
userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.post('/forget',passwordReset)
userRouter.get('/userDetails',authenticateUser, getLoggedUserDetails);
userRouter.get('/allUsers',authenticateUser, getAllUsers);
userRouter.put('/updateUser', authenticateUser, updateUserById);
userRouter.delete('/deleteUserbyId', authenticateUser, deleteUserById);

export default userRouter