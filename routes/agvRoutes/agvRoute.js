import express from 'express';
import { createAGV, getAllAGVs ,deleteAGVDetails,editAgvDetails} from '../../controller/master/agvController.js';
import {getErrorStatistics,getTimeLostBySeverity,getWaitTimes,getRobotErrors} from '../../controller/operations/operationController.js'
import { authenticateUser } from "../../middleware/authMiddleware.js";
const agvRouter = express.Router();

// AGV Registration & Details
agvRouter.post('/registerAGVDetails', createAGV);
// Get all agv details list
agvRouter.get('/getAllAGVDetails', getAllAGVs);
// get agv error statistics
agvRouter.get('/getAllErrors', getRobotErrors);
// get agve error statistics by severity(AGV ID)
agvRouter.get('/getTimeLostbyEachError', getTimeLostBySeverity);
// get total time loss in errors and warining
agvRouter.get('/getTotalErrorloss',getErrorStatistics)
// get agv wait times
agvRouter.get('/wait-times', getWaitTimes);
// Delete AGV Details by ID
agvRouter.delete('/deleteAGVDetailsById',authenticateUser, deleteAGVDetails);
// Edit AGV Details by ID
agvRouter.put('/editAGVDetails',authenticateUser, editAgvDetails);
export default agvRouter;
 