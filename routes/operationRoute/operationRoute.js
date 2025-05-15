import express from 'express';
import {createOperation,manualRetrieval,getQueueStatus,getClientFullPollStatus,getAllOperations,getOperationHistory,terminateQueueOperations} from '../../controller/operations/operationController.js'
import {authenticateUser} from '../../middleware/authMiddleware.js'
const operationRouter = express.Router();
operationRouter.post('/',authenticateUser, createOperation);
operationRouter.post('/manualRetrieval', manualRetrieval);
operationRouter.get('/getQueList', getQueueStatus);
operationRouter.get('/getAgvStatus', getClientFullPollStatus);
operationRouter.get('/getAllOperations', getAllOperations);
operationRouter.get('/getOperationHistory', getOperationHistory);
operationRouter.post('/terminateQueueOperations', terminateQueueOperations);
export default operationRouter;