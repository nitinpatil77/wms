import express from 'express';
import skuModel from "../../models/skuModel/skuModel.js";
const skuRoute=express.Router();
skuRoute.get('/getAllSKU', async (req, res) => {
    try {
        const sku = await skuModel.find();
        res.json(sku);
    } catch (error) {
        res.json({ message: error });
    }
});

export default skuRoute;