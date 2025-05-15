import Stock from "../../models/stockModel/stockModel.js";

// Get FIFO Stock Data
export const getStockFIFO = async (req, res) => {
    try {
        const { sku } = req.query;
        const filter = sku ? { skuDetails: sku, status: { $ne: 1 } } : { status: { $ne: 1 } };

        const stockData = await Stock.find(filter).sort({ createdAt: 1 }); // FIFO Order

        if (stockData.length === 0) {
            return res.status(404).json({ message: "No stock available in FIFO order for the given SKU." });
        }

        res.status(200).json(stockData);
    } catch (error) {
        console.error("Error retrieving FIFO stock data:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get stock by SKU
export const getStockBySKU = async (req, res) => {
    try {
        const { sku } = req.query; // Extract SKU from query parameters

        if (!sku) {
            return res.status(400).json({ message: "SKU is required" });
        }

        // Query stock items where `skuDetails` matches the given SKU and `status` is not 1
        const stockItems = await Stock.find({ skuDetails: sku, status: { $ne: 1 } });

        if (stockItems.length === 0) {
            return res.status(404).json({ message: "No stock items found for the given SKU." });
        }

        res.json(stockItems);
    } catch (error) {
        console.error("Error retrieving stock by SKU:", error);
        res.status(500).json({ message: error.message });
    }
};

// get all stock data
export const getAllStock = async (req, res) => {
    try {
        const stockData = await Stock.find({ status: { $ne: 1 } }).sort({ createdAt: 1 }); // FIFO Order

        if (stockData.length === 0) {
            return res.status(404).json({ message: "No stock available." });
        }

        res.status(200).json(stockData);
    } catch (error) {
        console.error("Error retrieving all stock data:", error);
        res.status(500).json({ message: error.message });
    }
};