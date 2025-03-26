import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const YourInvitePage = () => {
  const { code } = useParams(); // Access the invite code from the URL
  const [inviteDetails, setInviteDetails] = useState(null);

  useEffect(() => {
    // Make a request to your backend to get details using the invite code
    const fetchInviteDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/invites/${code}`);
        if (response.ok) {
          const data = await response.json();
          setInviteDetails(data);
        } else {
          // Handle invalid or expired invite
          alert('Invalid invite code or invite expired');
        }
      } catch (error) {
        console.error('Error fetching invite details:', error);
      }
    };

    fetchInviteDetails();
  }, [code]);

  return (
    <div>
      {inviteDetails ? (
        <div>
          <h1>Join Chat</h1>
          <p>Chat ID: {inviteDetails.chatId}</p>
          {/* Optionally, add a button to join the chat or any other UI elements */}
        </div>
      ) : (
        <p>Loading invite details...</p>
      )}
    </div>
  );
};

export default YourInvitePage;