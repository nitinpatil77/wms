import express from 'express';
import MachinePickUpLocation from '../../models/master/addNewMachinePickupLcationsModel.js';
import {addNewMachinePickUpLocation,deleteMachinePickUpLocation,editMachinePickUpLocation} from '../../controller/master/addNewMachinePickUpLocationController.js'
import { authenticateUser } from '../../middleware/authMiddleware.js';
const machinePickUpLocationRouter = express.Router();
// new machine pick up location router
machinePickUpLocationRouter.post('/addNewMachinePickUpLocation', authenticateUser,addNewMachinePickUpLocation);
// get all machine pick up locations list
machinePickUpLocationRouter.get('/getAllMachinePickUpLocations', async (req, res) => {
    try {
        const machinePickUpLocations = await MachinePickUpLocation.find();
        res.json(machinePickUpLocations);
    } catch (error) {
        res.json({ message: error });
    }
});
// get machine pick up location by qr code workStation id
machinePickUpLocationRouter.get('/getMachinePickUpLocationByMachineName', async (req, res) => {
    const { position } = req.query; 
    try {
        const machinePickUpLocation = await MachinePickUpLocation.find({position:position});
        if (!machinePickUpLocation) {
            return res.status(404).json({ message: "Machine Pick Up Location not found" });
        }
        res.json(machinePickUpLocation);
    } catch (error) {
        res.json({ message: error });
    }
});
// edit machine pick up location by id
machinePickUpLocationRouter.put('/editMachinePickUpLocation', authenticateUser, editMachinePickUpLocation);
// delete machine pick up location by id
machinePickUpLocationRouter.delete('/deleteMachinePickUpLocationById', authenticateUser, deleteMachinePickUpLocation);

export default machinePickUpLocationRouter;