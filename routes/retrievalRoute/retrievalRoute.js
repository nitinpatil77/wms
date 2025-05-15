import express from "express";
import RetrievalDropLocation from "../../models/master/addNewRetrievalDropLocationModel.js";
import { addNewRetrievalDropLocation,editRetrievalDropLocation,deleteRetrievalDropLocation } from "../../controller/master/addNewRetrievalDropLocationController.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";
const retrievalDropLocationRouter = express.Router();
// post route to add a new retrieval drop location
retrievalDropLocationRouter.post(
  "/addNewRetrievalDropLocation",
  authenticateUser,
  addNewRetrievalDropLocation
);
// get route to retrieve all retrieval drop locations
retrievalDropLocationRouter.get(
  "/getAllRetrievalDropLocations",
  async (req, res) => {
    try {
      const retrievalDropLocations = await RetrievalDropLocation.find();
      res.json(retrievalDropLocations);
    } catch (error) {
      res.json({ message: error });
    }
  }
);
// delete route to delete a retrieval drop location by ID
retrievalDropLocationRouter.delete(
  "/deleteRetrievalDropLocationByID",
  authenticateUser,
  deleteRetrievalDropLocation
);
// put route to edit a retrieval drop location
retrievalDropLocationRouter.put(
  "/editRetrievalDropLocation",
  authenticateUser,
  editRetrievalDropLocation
);

export default retrievalDropLocationRouter;
