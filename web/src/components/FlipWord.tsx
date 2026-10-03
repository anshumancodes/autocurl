'use client';

import { useEffect, useState } from 'react';

const WORDS = ['you', 'agent'];

export default function FlipWord() {
  const [index, setIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipping(true);

      const changeWordTimer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % WORDS.length);
      }, 250);

      const endAnimTimer = setTimeout(() => {
        setIsFlipping(false);
      }, 500);

      return () => {
        clearTimeout(changeWordTimer);
        clearTimeout(endAnimTimer);
      };
    }, 2600);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="flip-word-wrapper">
      <span className={`flip-word ${isFlipping ? 'flipping' : ''}`}>
        {WORDS[index]}
      </span>
    </span>
  );
}
