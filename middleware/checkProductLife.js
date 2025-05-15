import Stock from "../models/stockModel/stockModel.js";

const checkProductLife = async (req, res, next) => {
  try {
    const now = new Date();
    const stocks = await Stock.find({});

    for (const stock of stocks) {
      const { _id, createdAt, compoundAge, qaStatus } = stock;

      if (!createdAt || !compoundAge) continue;

      // ✅ Corrected expiry date calculation
      const expiryDate = new Date(
        new Date(createdAt).getTime() + compoundAge * 24 * 60 * 60 * 1000
      );

      const timeLeftInHours = (expiryDate - now) / (1000 * 60 * 60);

      let newStatus = qaStatus;

      if (timeLeftInHours <= 0) {
        newStatus = "overage";
      } else if (timeLeftInHours <= 48) {
        newStatus = "overAgeAlert";
      }

      if (qaStatus !== newStatus) {
        await Stock.updateOne({ _id }, { $set: { qaStatus: newStatus } });
        // console.log(`Updated qaStatus for stock ${_id}`);
      }
    }

    next(); // Move to next middleware or route
  } catch (err) {
    console.error("Error updating stock lifespan status:", err);
    next(err);
  }
};

export default checkProductLife;
