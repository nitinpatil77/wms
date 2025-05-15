import express from 'express';
import {addNewCompound,getAllCompounds,deleteCompound,editCompound} from '../../controller/master/compoundController.js'
import {authenticateUser} from '../../middleware/authMiddleware.js'
const compoundRouter = express.Router();

// add new compound (SKU Details)
compoundRouter.post('/addNewCompound',authenticateUser, addNewCompound);
// get all compounds (SKU Details) list
compoundRouter.get('/getAllCompounds',authenticateUser, getAllCompounds)
// Delete an Compound (SKU Details) by ID
compoundRouter.delete('/deleteCompoundById',authenticateUser, deleteCompound);
// Edit an Compound (SKU Details) by ID
compoundRouter.put('/editCompound',authenticateUser, editCompound);
export default compoundRouter;