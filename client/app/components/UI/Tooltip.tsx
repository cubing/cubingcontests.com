'use client';

import { useEffect } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';

const tooltipWidth = 200;
const horizontalPadding = 10;

const Tooltip = ({ id, text }: { id: string; text: string }) => {
  useEffect(() => {
    window.addEventListener('resize', limitTooltipPosition);

    return () => window.removeEventListener('resize', limitTooltipPosition);
  }, []);

  useEffect(() => {
    limitTooltipPosition();
  }, [id]);

  // Limits the tooltip's horizontal position so that it doesn't go beyond the edge of the screen
  const limitTooltipPosition = () => {
    const tooltipDiv = document.getElementById(id);
    // The parent has no width, so it's a good reference point to do the calculations off of
    const parentBounds = tooltipDiv.parentElement.getBoundingClientRect();
    const optimalLeftEdge = parentBounds.left - tooltipWidth / 2 - horizontalPadding;
    const optimalRightEdge = parentBounds.right + tooltipWidth / 2 + horizontalPadding;
    let newPosition = -tooltipWidth / 2;

    if (optimalLeftEdge < 0) newPosition += -optimalLeftEdge;
    else if (optimalRightEdge > window.innerWidth) newPosition -= optimalRightEdge - window.innerWidth;

    tooltipDiv.style.left = newPosition + 'px';
  };

  return (
    <div className="cc-tooltip position-relative d-flex align-items-center" style={{ cursor: 'default' }}>
      <div
        className="cc-tooltip-text position-absolute d-flex flex-column align-items-center pt-5"
        style={{ height: 0, width: '100%' }}
      >
        {/* Tip of the tooltip pointing up */}
        <span
          className="position-absolute z-2 bg-black"
          style={{ height: '1.5rem', width: '1.5rem', rotate: '45deg' }}
        />
        <div className="position-relative z-3 overflow-visible mt-2" style={{ width: '0' }}>
          {/* Tooltip */}
          <div
            id={id}
            className="position-absolute p-3 rounded bg-black text-white fs-6"
            style={{ width: `${tooltipWidth}px`, left: `${-tooltipWidth / 2}px`, whiteSpace: 'pre-wrap' }}
          >
            {text}
          </div>
        </div>
      </div>

      <FaQuestionCircle className="m-1 fs-6 text-secondary-emphasis" />
    </div>
  );
};

export default Tooltip;
