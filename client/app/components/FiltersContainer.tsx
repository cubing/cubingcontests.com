import { HTMLAttributes } from "react";

type Props = {
  children: React.ReactNode;
} & HTMLAttributes<HTMLDivElement>;

function FiltersContainer({ children, className }: Props) {
  return (
    <div className={`d-flex flex-wrap align-items-center column-gap-3 mb-3 px-2 ${className}`}>
      {children}
    </div>
  );
}

export default FiltersContainer;
