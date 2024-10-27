import React, { useState, useEffect } from 'react';

const ImageSlider = () => {
  const images = [
    'https://images.unsplash.com/photo-1610018556010-6a11691bc905?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1583912267623-a5a8c1ef7b56?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
      <div className="relative w-full h-full overflow-hidden bg-foreground/5 rounded-lg flex items-center justify-center p-2">
        {images.map((image, index) => (
            <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
                style={{transitionDuration: '1s', willChange: 'opacity'}}
            >
              <div className="w-full h-full p-2">
                <img src={image} alt={`Slide ${index + 1}`} className="w-full h-full object-cover rounded-lg"/>
              </div>
            </div>
        ))}
      </div>
  );
};

export default ImageSlider;
