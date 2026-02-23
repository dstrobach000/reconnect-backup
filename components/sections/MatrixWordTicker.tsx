'use client';

export default function MatrixWordTicker({ word, textStyle }) {
  return (
    <div className="w-full max-w-xl text-center">
      <p
        className="min-h-[1.1em] text-3xl leading-none tracking-[0.15em] md:text-5xl"
        style={textStyle}
      >
        {word}
      </p>
    </div>
  );
}
