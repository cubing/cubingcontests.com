type Props = {
  color: string; // color hex value
  small?: boolean;
} & React.HTMLAttributes<HTMLElement>;

function ColorSquare({ color, small, style }: Props) {
  return (
    <div
      className="cc-color-square"
      style={{
        margin: small ? "0" : "3px",
        width: "2.1rem",
        height: small ? "1.5rem" : "2.1rem",
        border: "1px solid",
        borderRadius: "5px",
        backgroundColor: color,
        ...style,
      }}
    />
  );
}

export default ColorSquare;
