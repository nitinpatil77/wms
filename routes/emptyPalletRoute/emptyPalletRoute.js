import express from "express";
import EmptyPalletDropLocation from "../../models/master/addNewEmptyPalletDropModel.js";
import EmptyPalletPickUpLocation from "../../models/master/addNewEmptyPalletPickUpModel.js";
import { addNewEmptyPalletDrop,deleteEmptyPalletDrop,editEmptyPalletDrop } from "../../controller/master/addNewEmptyPalletDropController.js";
import { addNewEmptyPalletPickUp,editEmptyPalletPickUp,deleteEmptyPalletPickUp } from "../../controller/master/addNewEmptyPalletPickUpController.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";

const emptyPalletPickUpLocationRouter = express.Router();
// add new EmptyPallet Drop Location
emptyPalletPickUpLocationRouter.post(
  "/addNewEmptyPalletDropLocation",
  authenticateUser,
  addNewEmptyPalletDrop
);
// add new EmptyPallet Pickup Location
emptyPalletPickUpLocationRouter.post(
  "/addNewEmptyPalletPickUpLocation",
  authenticateUser,
  addNewEmptyPalletPickUp
);
// get all empty pallet pick and drop location list
emptyPalletPickUpLocationRouter.get(
  "/getAllEmptyPalletLocations",
  async (req, res) => {
    try {
      const [pickUpLocations, dropLocations] = await Promise.all([
        EmptyPalletPickUpLocation.find(),
        EmptyPalletDropLocation.find(),
      ]);

      res.json({
        pickUpLocations,
        dropLocations,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
// Delete an empty pallet drop location by ID
emptyPalletPickUpLocationRouter.delete(
  "/deleteEmptyPalletDropLocationById",
  deleteEmptyPalletDrop
);

// update EmptyPallet Drop Location by ID
emptyPalletPickUpLocationRouter.put(
  "/editEmptyPalletDropById",authenticateUser,
  editEmptyPalletDrop
);

//  delete an empty pallet pick up location by ID
emptyPalletPickUpLocationRouter.delete(
  "/deleteEmptyPalletPickUpLocationById",authenticateUser,
  deleteEmptyPalletPickUp
);
// update EmptyPallet PickUp Location by ID
emptyPalletPickUpLocationRouter.put(
  "/editEmptyPalletPickUpById",authenticateUser,
  editEmptyPalletPickUp
);
export default emptyPalletPickUpLocationRouter;
