import React, { useState, useEffect } from 'react';

const LiveDateTime = () => {
  const [dateTime, setDateTime] = useState(new Date());
  
  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(timer);
  }, []);
  
  // Format date as: Monday, April 23, 2025
  const formattedDate = dateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Format time as: 06:28:16 PM
  const formattedTime = dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return (
    <div className="live-datetime">
      <div className="date">{formattedDate}</div>
      <div className="time">{formattedTime}</div>
    </div>
  );
};

export default LiveDateTime;
