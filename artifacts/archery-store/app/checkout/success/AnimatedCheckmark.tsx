"use client";

export function AnimatedCheckmark() {
  return (
    <div className="inline-flex items-center justify-center w-20 h-20 mb-8">
      <svg
        className="animated-checkmark"
        viewBox="0 0 52 52"
        width={80}
        height={80}
      >
        <circle
          className="animated-checkmark__circle"
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          className="animated-checkmark__check"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 26l7 7 15-15"
        />
      </svg>

      <style>{`
        .animated-checkmark {
          color: #4ade80;
        }

        .animated-checkmark__circle {
          stroke-dasharray: 151;
          stroke-dashoffset: 151;
          animation: checkmark-circle 0.6s ease-in-out forwards;
        }

        .animated-checkmark__check {
          stroke-dasharray: 36;
          stroke-dashoffset: 36;
          animation: checkmark-draw 0.4s ease-in-out 0.5s forwards;
        }

        @keyframes checkmark-circle {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes checkmark-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
