const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendBookingNotification = functions.firestore
  .document('booking/{bookingId}')
  .onCreate(async (snapshot, context) => {
    const bookingData = snapshot.data();
    const vendorEmail = bookingData.vendorEmailAddress;

    // Query the 'vendors' collection to find the vendor document with the given email
    const querySnapshot = await admin.firestore().collection('vendor').where('email', '==', vendorEmail).get();

    // Check if a vendor document is found
    if (querySnapshot.empty) {
      console.error(`No vendor found with email: ${vendorEmail}`);
      return;
    }

    // Get the first document from the query result (assuming unique email addresses)
    const vendorDoc = querySnapshot.docs[0];
    const vendorData = vendorDoc.data();
    const vendorId = vendorDoc.id; // Retrieve the vendorId (document ID)
    const fcmToken = vendorData.fcmToken;

    // Create the notification payload
    const payload = {
      notification: {
        title: 'New Booking',
        body: `You have a new booking.`,
        click_action: 'OPEN_ACTIVITY_1',
      },
      data: {
        booking_id: context.params.bookingId,
      },
    };

    // Send the notification
    return admin.messaging().sendToDevice(fcmToken, payload);
  });
