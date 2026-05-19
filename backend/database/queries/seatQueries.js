const doQuery = require('../query');

async function addSeat(seatDetails) {
    const { location, status, rotation, x, y, type} = seatDetails;
    const normalizedStatus = status || 'available'; // Default status is "available"
    const normalizedType = type || 'seat'; // Default type is "seat"

    try{
        
    }