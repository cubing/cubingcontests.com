import { Color } from '@sh/enums';

const ColorSquare = ({ color, style }: { color: Color; style?: React.CSSProperties }) => {
  if (color !== Color.White)
    return (
      <span
        style={{
          margin: '3px',
          width: '2.1rem',
          height: '2.1rem',
          border: '1px solid',
          borderColor: 'white',
          borderRadius: '5px',
          backgroundColor: `#${color}`,
          ...style,
        }}
      ></span>
    );
};

export default ColorSquare;
