import express from 'express';
import { getStockFIFO, getStockBySKU ,getAllStock} from '../../controller/stock/stockController.js';

const stockRouter = express.Router();

// Route to fetch FIFO stock data (sorted by createdAt)
stockRouter.get('/fifo', getStockFIFO);

// Route to fetch stock details by SKU
stockRouter.get('/sku', getStockBySKU);

// Route to fetch all stock data (sorted by createdAt)
stockRouter.get('/getAllStockData', getAllStock);
export default stockRouter;
