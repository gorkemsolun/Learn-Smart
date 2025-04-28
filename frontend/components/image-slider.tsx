import React, { useState, useEffect } from "react";
import Image from "next/image";

import image_slider_1 from "@/assets/image_slider_1.jpg";
import image_slider_2 from "@/assets/image_slider_2.jpg";
import image_slider_3 from "@/assets/image_slider_3.jpg";

const images = [
  image_slider_1,
  image_slider_2,
  image_slider_3,
];

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4500); // Change image every 4.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden rounded-lg bg-foreground/5 p-2">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="size-full p-2">
            <Image
              src={image}
              alt={`Slide ${index + 1}`}
              layout="fill"
              objectFit="cover"
              className="rounded-lg bg-foreground/10"
              priority
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageSlider;
