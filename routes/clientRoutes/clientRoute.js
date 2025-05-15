import express from 'express';
import {addClientDataBeforeQaCheck,getClientDataBeforeQaCheckByBatch} from '../../controller/clientData/clientDataController.js';

const clientDataRouter = express.Router();

// Client Data Routes
clientDataRouter.post('/addClientDataBeforeQaCheck', addClientDataBeforeQaCheck);
clientDataRouter.get('/getClientDataBeforeQaCheck', getClientDataBeforeQaCheckByBatch);
export default clientDataRouter;