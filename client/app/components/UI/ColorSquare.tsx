import { Color } from '@sh/enums';

const ColorSquare = ({ color, style }: { color: Color; style?: React.CSSProperties }) => {
  if (color !== Color.White)
    return (
      <span
        className="cc-color-square"
        style={{
          margin: '3px',
          width: '2.1rem',
          height: '2.1rem',
          border: '1px solid',
          borderRadius: '5px',
          backgroundColor: `#${color}`,
          ...style,
        }}
      ></span>
    );
};

export default ColorSquare;
