const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  return (
    <div className="cc-tooltip position-relative d-flex align-items-center" style={{ cursor: 'default' }}>
      <div
        className="cc-tooltip-text position-absolute z-3 d-flex flex-column align-items-center pt-5"
        style={{ height: 0, width: '100%' }}
      >
        <span className="position-absolute bg-black" style={{ height: '1.5rem', width: '1.5rem', rotate: '45deg' }} />
        <div
          className="top-0 start-50 overflow-visible mt-2 p-3 rounded bg-black text-white fs-6"
          style={{ width: '200px' }}
        >
          {text}
        </div>
      </div>

      {children}
    </div>
  );
};

export default Tooltip;
