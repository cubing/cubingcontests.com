import { Color } from "~/helpers/enums.ts";

type Props = {
  color: Color;
  style?: React.CSSProperties;
};

const ColorSquare = ({ color, style }: Props) => {
  if (color !== Color.White) {
    return (
      <span
        className="cc-color-square"
        style={{
          margin: "3px",
          width: "2.1rem",
          height: "2.1rem",
          border: "1px solid",
          borderRadius: "5px",
          backgroundColor: `#${color}`,
          ...style,
        }}
      />
    );
  }
};

export default ColorSquare;
